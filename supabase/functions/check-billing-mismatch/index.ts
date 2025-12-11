import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🔍 开始扣费异常检查...');

    // 获取最近24小时的使用记录
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: usageRecords, error: usageError } = await supabase
      .from('usage_records')
      .select('*')
      .gte('created_at', last24Hours)
      .order('created_at', { ascending: false });

    if (usageError) {
      console.error('❌ 查询使用记录失败:', usageError);
      throw usageError;
    }

    console.log(`📊 查询到 ${usageRecords?.length || 0} 条最近24小时的使用记录`);

    // 获取功能配置映射
    const { data: featureSettings, error: settingsError } = await supabase
      .from('package_feature_settings')
      .select('feature_id, cost_per_use, package_id, feature_items!inner(item_key, item_name)');

    if (settingsError) {
      console.error('❌ 查询功能配置失败:', settingsError);
      throw settingsError;
    }

    // 构建功能配额映射 (使用最高成本作为基准)
    const featureSettingsMap: Record<string, { cost: number; name: string }> = {};
    featureSettings?.forEach((setting: any) => {
      const featureKey = setting.feature_items?.item_key;
      if (featureKey) {
        if (!featureSettingsMap[featureKey] || setting.cost_per_use > featureSettingsMap[featureKey].cost) {
          featureSettingsMap[featureKey] = {
            cost: setting.cost_per_use || 1,
            name: setting.feature_items?.item_name || featureKey
          };
        }
      }
    });

    console.log(`📋 功能配置映射: ${Object.keys(featureSettingsMap).length} 个功能`);

    // 获取已存在的异常记录 (避免重复)
    const { data: existingAlerts } = await supabase
      .from('cost_alerts')
      .select('metadata')
      .eq('alert_type', 'billing_mismatch')
      .gte('created_at', last24Hours);

    const existingRecordIds = new Set(
      existingAlerts?.map((a: any) => a.metadata?.usage_record_id).filter(Boolean)
    );

    // 检测异常
    const mismatches: any[] = [];

    for (const record of usageRecords || []) {
      // 跳过已检测的记录
      if (existingRecordIds.has(record.id)) continue;

      // 跳过免费额度使用
      if (record.metadata?.free_quota_used) continue;

      // 跳过显式金额扣费 (这些是预期行为)
      if (record.metadata?.cost_source === 'explicit_amount') continue;

      // 获取功能键
      const featureKey = record.metadata?.feature_key || record.source;
      if (!featureKey) continue;

      // 获取预期成本
      const featureSetting = featureSettingsMap[featureKey];
      const expectedCost = featureSetting?.cost || 1;
      const actualCost = record.amount || 0;

      // 检测不匹配
      if (actualCost !== expectedCost && actualCost > 0) {
        const deviation = ((actualCost - expectedCost) / expectedCost) * 100;
        
        mismatches.push({
          alert_type: 'billing_mismatch',
          user_id: record.user_id,
          threshold_cny: expectedCost, // 复用为预期金额
          actual_cost_cny: actualCost,
          alert_message: `扣费异常: ${featureSetting?.name || featureKey} 预期扣${expectedCost}点，实际扣${actualCost}点 (偏差${deviation.toFixed(1)}%)`,
          is_acknowledged: false,
          metadata: {
            feature_key: featureKey,
            feature_name: featureSetting?.name || featureKey,
            expected_amount: expectedCost,
            actual_amount: actualCost,
            deviation_percentage: deviation,
            usage_record_id: record.id,
            cost_source: record.metadata?.cost_source || 'unknown',
            created_at: record.created_at
          }
        });
      }
    }

    console.log(`⚠️ 发现 ${mismatches.length} 条扣费异常`);

    // 批量插入异常记录
    if (mismatches.length > 0) {
      const { error: insertError } = await supabase
        .from('cost_alerts')
        .insert(mismatches);

      if (insertError) {
        console.error('❌ 插入异常记录失败:', insertError);
        throw insertError;
      }

      // 发送汇总通知 (如果异常数量超过阈值)
      const severeCount = mismatches.filter((m: any) => Math.abs(m.metadata.deviation_percentage) > 50).length;
      
      if (mismatches.length > 10 || severeCount > 0) {
        try {
          await supabase.functions.invoke('send-wecom-notification', {
            body: {
              notification: {
                title: '⚠️ 扣费异常批量预警',
                message: `最近24小时发现 ${mismatches.length} 条扣费异常\n` +
                  `严重异常: ${severeCount} 条\n` +
                  `涉及功能: ${[...new Set(mismatches.map((m: any) => m.metadata.feature_name))].join(', ')}\n\n` +
                  `请登录管理后台查看详情`
              }
            }
          });
          console.log('📢 已发送企业微信通知');
        } catch (notifyError) {
          console.error('⚠️ 发送通知失败:', notifyError);
        }
      }
    }

    // 统计汇总
    const summary = {
      checked_records: usageRecords?.length || 0,
      mismatches_found: mismatches.length,
      severe_mismatches: mismatches.filter((m: any) => Math.abs(m.metadata.deviation_percentage) > 50).length,
      affected_features: [...new Set(mismatches.map((m: any) => m.metadata.feature_key))],
      checked_at: new Date().toISOString()
    };

    console.log('✅ 扣费异常检查完成:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        ...summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ check-billing-mismatch error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

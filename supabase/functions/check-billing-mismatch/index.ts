import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CorrectionResult {
  userId: string;
  alertId: string;
  type: 'refund' | 'charge';
  amount: number;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 解析请求参数
    const body = await req.json().catch(() => ({}));
    const autoCorrect = body.autoCorrect ?? true; // 默认启用自动修复
    const dryRun = body.dryRun ?? false; // 试运行模式（不实际修复）

    console.log('🔍 开始扣费异常检查...', { autoCorrect, dryRun });

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
      .select('id, metadata, correction_status')
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
          correction_status: 'pending',
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

    console.log(`⚠️ 发现 ${mismatches.length} 条新扣费异常`);

    // 批量插入异常记录
    let insertedAlerts: any[] = [];
    if (mismatches.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('cost_alerts')
        .insert(mismatches)
        .select();

      if (insertError) {
        console.error('❌ 插入异常记录失败:', insertError);
        throw insertError;
      }
      insertedAlerts = inserted || [];
    }

    // 获取所有待修复的异常 (包括历史未修复的)
    const { data: pendingAlerts, error: pendingError } = await supabase
      .from('cost_alerts')
      .select('*')
      .eq('alert_type', 'billing_mismatch')
      .eq('correction_status', 'pending')
      .order('created_at', { ascending: true });

    if (pendingError) {
      console.error('❌ 查询待修复异常失败:', pendingError);
      throw pendingError;
    }

    console.log(`🔧 待修复异常数: ${pendingAlerts?.length || 0}`);

    // 自动修复逻辑
    const corrections: CorrectionResult[] = [];

    if (autoCorrect && pendingAlerts && pendingAlerts.length > 0) {
      for (const alert of pendingAlerts) {
        const metadata = alert.metadata as any;
        const expectedAmount = metadata?.expected_amount || 0;
        const actualAmount = metadata?.actual_amount || 0;
        const difference = expectedAmount - actualAmount;

        if (difference === 0) {
          // 无需修复
          await supabase
            .from('cost_alerts')
            .update({ correction_status: 'skipped' })
            .eq('id', alert.id);
          continue;
        }

        const correctionType = difference > 0 ? 'charge' : 'refund';
        const correctionAmount = Math.abs(difference);

        console.log(`🔄 处理异常 ${alert.id}: ${correctionType} ${correctionAmount}点 (用户: ${alert.user_id})`);

        if (dryRun) {
          // 试运行模式，不实际修复
          corrections.push({
            userId: alert.user_id,
            alertId: alert.id,
            type: correctionType,
            amount: correctionAmount,
            success: true
          });
          continue;
        }

        try {
          // 创建修复记录
          const { data: correctionRecord, error: correctionError } = await supabase
            .from('billing_corrections')
            .insert({
              user_id: alert.user_id,
              alert_id: alert.id,
              correction_type: correctionType,
              original_amount: actualAmount,
              expected_amount: expectedAmount,
              correction_amount: correctionAmount,
              feature_key: metadata?.feature_key,
              feature_name: metadata?.feature_name,
              usage_record_id: metadata?.usage_record_id,
              status: 'pending'
            })
            .select()
            .single();

          if (correctionError) throw correctionError;

          // 获取用户当前余额
          const { data: userAccount, error: accountError } = await supabase
            .from('user_accounts')
            .select('total_quota, used_quota, remaining_quota')
            .eq('user_id', alert.user_id)
            .single();

          if (accountError) throw accountError;

          // 执行修复
          if (correctionType === 'charge') {
            // 少扣了，需要补扣
            const newUsedQuota = (userAccount.used_quota || 0) + correctionAmount;
            
            const { error: updateError } = await supabase
              .from('user_accounts')
              .update({ 
                used_quota: newUsedQuota,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', alert.user_id);

            if (updateError) throw updateError;

            // 记录补扣到 usage_records
            await supabase
              .from('usage_records')
              .insert({
                user_id: alert.user_id,
                record_type: 'correction_charge',
                amount: correctionAmount,
                source: 'billing_correction',
                metadata: {
                  correction_id: correctionRecord.id,
                  original_alert_id: alert.id,
                  feature_key: metadata?.feature_key,
                  reason: `补扣差额: 原扣${actualAmount}点，应扣${expectedAmount}点`
                }
              });

          } else {
            // 多扣了，需要退还
            const newUsedQuota = Math.max(0, (userAccount.used_quota || 0) - correctionAmount);
            
            const { error: updateError } = await supabase
              .from('user_accounts')
              .update({ 
                used_quota: newUsedQuota,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', alert.user_id);

            if (updateError) throw updateError;

            // 记录退还到 usage_records
            await supabase
              .from('usage_records')
              .insert({
                user_id: alert.user_id,
                record_type: 'correction_refund',
                amount: -correctionAmount, // 负数表示退还
                source: 'billing_correction',
                metadata: {
                  correction_id: correctionRecord.id,
                  original_alert_id: alert.id,
                  feature_key: metadata?.feature_key,
                  reason: `退还差额: 原扣${actualAmount}点，应扣${expectedAmount}点`
                }
              });
          }

          // 更新修复记录状态
          await supabase
            .from('billing_corrections')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', correctionRecord.id);

          // 更新告警状态
          await supabase
            .from('cost_alerts')
            .update({ 
              correction_status: 'corrected',
              correction_id: correctionRecord.id,
              is_acknowledged: true
            })
            .eq('id', alert.id);

          corrections.push({
            userId: alert.user_id,
            alertId: alert.id,
            type: correctionType,
            amount: correctionAmount,
            success: true
          });

          console.log(`✅ 修复成功: ${correctionType} ${correctionAmount}点`);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`❌ 修复失败: ${alert.id}`, error);

          // 更新修复记录为失败
          await supabase
            .from('billing_corrections')
            .update({ 
              status: 'failed',
              error_message: errorMsg
            })
            .eq('alert_id', alert.id);

          // 更新告警状态
          await supabase
            .from('cost_alerts')
            .update({ correction_status: 'failed' })
            .eq('id', alert.id);

          corrections.push({
            userId: alert.user_id,
            alertId: alert.id,
            type: difference > 0 ? 'charge' : 'refund',
            amount: Math.abs(difference),
            success: false,
            error: errorMsg
          });
        }
      }
    }

    // 发送汇总通知
    const severeCount = mismatches.filter((m: any) => Math.abs(m.metadata.deviation_percentage) > 50).length;
    const successfulCorrections = corrections.filter(c => c.success).length;
    const failedCorrections = corrections.filter(c => !c.success).length;

    if (mismatches.length > 10 || severeCount > 0 || corrections.length > 0) {
      try {
        await supabase.functions.invoke('send-wecom-notification', {
          body: {
            notification: {
              title: '⚠️ 扣费异常监控报告',
              message: `📊 检查时间: ${new Date().toISOString()}\n\n` +
                `🔍 新发现异常: ${mismatches.length} 条\n` +
                `⚡ 严重异常: ${severeCount} 条\n` +
                `📋 待修复总数: ${pendingAlerts?.length || 0} 条\n\n` +
                (autoCorrect && !dryRun ? 
                  `✅ 修复成功: ${successfulCorrections} 条\n` +
                  `❌ 修复失败: ${failedCorrections} 条\n\n` : '') +
                (dryRun ? '🔬 模式: 试运行 (未实际修复)\n\n' : '') +
                `涉及功能: ${[...new Set(mismatches.map((m: any) => m.metadata.feature_name))].join(', ') || '无'}`
            }
          }
        });
        console.log('📢 已发送企业微信通知');
      } catch (notifyError) {
        console.error('⚠️ 发送通知失败:', notifyError);
      }
    }

    // 统计汇总
    const summary = {
      checked_records: usageRecords?.length || 0,
      new_mismatches_found: mismatches.length,
      severe_mismatches: severeCount,
      pending_corrections: pendingAlerts?.length || 0,
      corrections_attempted: corrections.length,
      corrections_successful: successfulCorrections,
      corrections_failed: failedCorrections,
      affected_features: [...new Set(mismatches.map((m: any) => m.metadata.feature_key))],
      auto_correct_enabled: autoCorrect,
      dry_run: dryRun,
      checked_at: new Date().toISOString()
    };

    console.log('✅ 扣费异常检查完成:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        ...summary,
        corrections: dryRun ? corrections : undefined // 试运行时返回详情
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

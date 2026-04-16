import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 检查训练营权益（支持同一 feature_key 对应多个 camp_type）
async function checkCampEntitlement(supabase: any, userId: string, featureKey: string) {
  // 1. 查询该功能对应的所有训练营权益（可能有多条记录）
  const { data: entitlements, error: entErr } = await supabase
    .from('camp_entitlements')
    .select('camp_type')
    .eq('feature_key', featureKey)
    .eq('is_free', true)
    .limit(10);

  if (entErr || !entitlements || entitlements.length === 0) {
    return { hasCampAccess: false };
  }

  // 2. 遍历每个 camp_type，检查用户是否有有效购买 + 活跃训练营
  for (const entitlement of entitlements) {
    const campType = entitlement.camp_type;

    // 检查购买记录
    const { data: purchase } = await supabase
      .from('user_camp_purchases')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('camp_type', campType)
      .eq('payment_status', 'completed')
      .maybeSingle();

    if (!purchase) continue;

    // 检查是否过期
    if (purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
      continue;
    }

    // 检查活跃训练营
    const { data: activeCamp } = await supabase
      .from('training_camps')
      .select('id, status')
      .eq('user_id', userId)
      .eq('camp_type', campType)
      .in('status', ['active', 'completed'])
      .maybeSingle();

    if (activeCamp) {
      console.log(`✅ 训练营权益匹配: campType=${campType}, featureKey=${featureKey}`);
      return { hasCampAccess: true, campType };
    }
  }

  return { hasCampAccess: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Create client with anon key to verify user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get authenticated user from JWT
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`🔐 Authenticated user: ${userId}`);

    // Create service role client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { feature_key, source, conversationId, metadata, amount: explicitAmount, feature_type: legacyFeatureType, session_id } = await req.json();
    
    // Support both feature_key (new) and feature_type (legacy)
    const featureKey = feature_key || legacyFeatureType;

    console.log(`📥 扣费请求: feature_key=${featureKey}, source=${source}, explicitAmount=${explicitAmount}, session_id=${session_id}`);

    // ⭐ 训练营权益检查：在扣费前检查用户是否有训练营权益
    const campCheck = await checkCampEntitlement(supabase, userId, featureKey);
    if (campCheck.hasCampAccess) {
      console.log(`🎁 训练营权益免费: ${featureKey} (${campCheck.campType})`);
      
      // 记录使用但不扣费
      await supabase.from('usage_records').insert({
        user_id: userId,
        record_type: 'camp_entitlement',
        amount: 0,
        source: source || featureKey,
        conversation_id: conversationId,
        metadata: { 
          feature_key: featureKey, 
          camp_type: campCheck.campType,
          free_by_camp: true 
        }
      });
      
      // 获取剩余额度
      const { data: account } = await supabase
        .from('user_accounts')
        .select('remaining_quota')
        .eq('user_id', userId)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          cost: 0,
          camp_entitlement: true,
          camp_type: campCheck.campType,
          feature_name: featureKey,
          remaining_quota: account?.remaining_quota || 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!featureKey && !explicitAmount) {
      return new Response(
        JSON.stringify({ error: 'feature_key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ⭐ 服务端防重复扣费：检查语音通话是否已扣过同一分钟
    if (source === 'voice_chat' && metadata?.session_id && metadata?.minute !== undefined) {
      const { data: existingRecord } = await supabase
        .from('usage_records')
        .select('id')
        .eq('source', 'voice_chat')
        .eq('user_id', userId)
        .filter('metadata->>session_id', 'eq', metadata.session_id)
        .filter('metadata->>minute', 'eq', String(metadata.minute))
        .limit(1)
        .maybeSingle();

      if (existingRecord) {
        console.log(`⚠️ 跳过重复扣费: session=${metadata.session_id}, minute=${metadata.minute}`);
        // 返回成功但不扣费
        const { data: account } = await supabase
          .from('user_accounts')
          .select('remaining_quota')
          .eq('user_id', userId)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            cost: 0,
            skipped: true,
            reason: 'duplicate_billing_prevented',
            remaining_quota: account?.remaining_quota || 0,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ⭐ 关键改进：显式 amount 具有最高优先级
    // 如果前端传递了 amount，直接使用它，不再查询数据库
    let useExplicitAmount = false;
    if (explicitAmount && explicitAmount > 0) {
      useExplicitAmount = true;
      console.log(`⭐ 使用显式传递的 amount: ${explicitAmount} (最高优先级)`);
    }

    // 1. Try to find feature in new feature_items table
    const { data: featureItem } = await supabase
      .from('feature_items')
      .select('id, item_key, item_name, is_active')
      .eq('item_key', featureKey)
      .single();

    // 2. Get user's active subscription/package
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('package_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let packageId = subscription?.package_id;

    // Fallback to user_accounts if no active subscription
    if (!packageId) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('current_package_id')
        .eq('user_id', userId)
        .single();
      packageId = account?.current_package_id;
    }

    // ⭐ 如果有显式 amount，直接使用；否则使用 1 作为默认值
    let actualCost = useExplicitAmount ? explicitAmount : 1;
    let featureName = source || featureKey || 'unknown';
    let costSource = useExplicitAmount ? 'explicit_amount' : 'default';
    let usedFreeQuota = false;
    let isEnabled = true;
    let freeQuota = 0;
    let freeQuotaPeriod = 'monthly';

    // 3. If feature exists in new system, use package_feature_settings
    // ⭐ 但如果有显式 amount，跳过成本查询（仍需检查 is_enabled 和 free_quota）
    if (featureItem) {
      featureName = featureItem.item_name;

      if (!featureItem.is_active) {
        console.log(`ℹ️ Feature ${featureKey} is globally inactive`);
        return new Response(
          JSON.stringify({ success: true, cost: 0, message: '功能已禁用' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get package-specific settings
      let foundSettings = false;
      if (packageId) {
        const { data: featureSetting } = await supabase
          .from('package_feature_settings')
          .select('is_enabled, cost_per_use, free_quota, free_quota_period')
          .eq('package_id', packageId)
          .eq('feature_id', featureItem.id)
          .single();

        if (featureSetting) {
          foundSettings = true;
          isEnabled = featureSetting.is_enabled;
          // ⭐ 只有在没有显式 amount 时才使用数据库配置的 cost
          if (!useExplicitAmount) {
            actualCost = featureSetting.cost_per_use;
            costSource = 'package_settings';
          }
          freeQuota = featureSetting.free_quota;
          freeQuotaPeriod = featureSetting.free_quota_period;
          console.log(`📋 Found package settings: dbCost=${featureSetting.cost_per_use}, actualCost=${actualCost}, freeQuota=${freeQuota}, costSource=${costSource}`);
        }
      }

      // 如果用户没有套餐或套餐没有配置该功能，尝试获取任意套餐的默认配置
      if (!foundSettings && !useExplicitAmount) {
        const { data: defaultSetting } = await supabase
          .from('package_feature_settings')
          .select('cost_per_use, free_quota, free_quota_period')
          .eq('feature_id', featureItem.id)
          .order('cost_per_use', { ascending: false })
          .limit(1)
          .single();

        if (defaultSetting) {
          actualCost = defaultSetting.cost_per_use;
          costSource = 'default_package_settings';
          freeQuota = 0; // 无套餐用户不享受免费额度
          freeQuotaPeriod = 'per_use';
          console.log(`ℹ️ No package settings, using default cost: ${actualCost} for ${featureKey}`);
        }
      }

      if (!isEnabled) {
        return new Response(
          JSON.stringify({ error: '您的套餐不支持此功能', allowed: false }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (!useExplicitAmount) {
      // Fallback to legacy feature_cost_rules (only if no explicit amount)
      console.log(`⚠️ Feature ${featureKey} not in feature_items, checking legacy rules`);
      
      const { data: costRule } = await supabase
        .from('feature_cost_rules')
        .select('default_cost, feature_name, is_active')
        .eq('feature_type', featureKey)
        .single();

      if (costRule) {
        if (!costRule.is_active) {
          return new Response(
            JSON.stringify({ success: true, cost: 0, message: 'Feature inactive' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        actualCost = costRule.default_cost;
        costSource = 'legacy_cost_rules';
        featureName = costRule.feature_name;
      }

      // Check legacy package_free_quotas
      if (packageId && actualCost > 0) {
        const { data: legacyFreeQuota } = await supabase
          .from('package_free_quotas')
          .select('free_quota, period')
          .eq('package_id', packageId)
          .eq('feature_type', featureKey)
          .single();

        if (legacyFreeQuota) {
          freeQuota = legacyFreeQuota.free_quota;
          freeQuotaPeriod = legacyFreeQuota.period;
        }
      }
    }

    console.log(`💰 最终扣费决定: actualCost=${actualCost}, costSource=${costSource}, featureName=${featureName}`);

    // 4. Check and use free quota if available
    // Handle special period types: per_use and one_time
    if (freeQuotaPeriod === 'per_use') {
      // per_use: 每次使用都独立扣费，不使用免费额度
      console.log(`ℹ️ Feature ${featureKey} is per_use, skipping free quota`);
      // actualCost remains as configured, skip free quota check
    } else if (freeQuota > 0 && actualCost > 0) {
      // Calculate period start for other period types
      let periodStart: Date;
      const now = new Date();
      
      if (freeQuotaPeriod === 'one_time') {
        // one_time: 整个用户生命周期只能使用一次免费
        periodStart = new Date('1970-01-01');
      } else if (freeQuotaPeriod === 'daily') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (freeQuotaPeriod === 'monthly') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        // lifetime: 用完为止
        periodStart = new Date('2020-01-01');
      }

      const { data: usageRecord } = await supabase
        .from('user_free_quota_usage')
        .select('id, used_count')
        .eq('user_id', userId)
        .eq('feature_type', featureKey)
        .gte('period_start', periodStart.toISOString())
        .single();

      const currentUsed = usageRecord?.used_count || 0;

      if (currentUsed < freeQuota) {
        usedFreeQuota = true;
        actualCost = 0;

        if (usageRecord) {
          await supabase
            .from('user_free_quota_usage')
            .update({ used_count: currentUsed + 1 })
            .eq('id', usageRecord.id);
        } else {
          await supabase
            .from('user_free_quota_usage')
            .insert({
              user_id: userId,
              feature_type: featureKey,
              used_count: 1,
              period_start: periodStart.toISOString(),
            });
        }

        console.log(`🎁 Used free quota for ${featureKey}: ${currentUsed + 1}/${freeQuota}`);
      }
    }

    // 5. Deduct from main quota if not using free quota and cost > 0
    if (!usedFreeQuota && actualCost > 0) {
      const { data, error: deductError } = await supabase.rpc('deduct_user_quota', {
        p_user_id: userId,
        p_amount: actualCost,
      });

      if (deductError) {
        console.error(`❌ 扣费失败: ${deductError.message}`);
        return new Response(
          JSON.stringify({ error: '余额不足', details: deductError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ 用户 ${userId} 扣费 ${actualCost} 点 (${featureName})`);
    }

    // 6. Record usage
    await supabase.from('usage_records').insert({
      user_id: userId,
      record_type: 'conversation',
      amount: actualCost,
      source: source || featureKey,
      conversation_id: conversationId,
      metadata: { ...metadata, feature_key: featureKey, free_quota_used: usedFreeQuota, cost_source: costSource }
    });

    // 7. 实时扣费异常监控
    // 如果不是显式金额且不是免费额度，检查扣费是否与配置一致
    if (!useExplicitAmount && !usedFreeQuota && actualCost > 0) {
      // 获取数据库中配置的预期成本
      let expectedCostFromDb = 1;
      if (featureItem) {
        const { data: dbSetting } = await supabase
          .from('package_feature_settings')
          .select('cost_per_use')
          .eq('feature_id', featureItem.id)
          .order('cost_per_use', { ascending: false })
          .limit(1)
          .single();
        
        if (dbSetting) {
          expectedCostFromDb = dbSetting.cost_per_use;
        }
      }

      // 如果实际扣费与数据库配置不符，记录异常
      if (actualCost !== expectedCostFromDb) {
        const deviation = ((actualCost - expectedCostFromDb) / expectedCostFromDb) * 100;
        
        console.log(`⚠️ 扣费异常检测: expected=${expectedCostFromDb}, actual=${actualCost}, deviation=${deviation.toFixed(1)}%`);
        
        await supabase.from('cost_alerts').insert({
          alert_type: 'billing_mismatch',
          user_id: userId,
          threshold_cny: expectedCostFromDb,
          actual_cost_cny: actualCost,
          alert_message: `扣费异常: ${featureName} 预期扣${expectedCostFromDb}点，实际扣${actualCost}点 (偏差${deviation.toFixed(1)}%)`,
          is_acknowledged: false,
          metadata: {
            feature_key: featureKey,
            feature_name: featureName,
            expected_amount: expectedCostFromDb,
            actual_amount: actualCost,
            deviation_percentage: deviation,
            cost_source: costSource,
            source: source
          }
        });

        // 严重异常（偏差>50%）立即发送企业微信通知
        if (Math.abs(deviation) > 50) {
          try {
            await supabase.functions.invoke('send-wecom-notification', {
              body: {
                notification: {
                  title: '🚨 严重扣费异常',
                  message: `功能: ${featureName}\n预期: ${expectedCostFromDb}点\n实际: ${actualCost}点\n偏差: ${deviation.toFixed(1)}%\n\n请立即检查扣费配置！`
                }
              }
            });
          } catch (notifyError) {
            console.error('⚠️ 发送通知失败:', notifyError);
          }
        }
      }
    }

    // 8. Get remaining quota
    const { data: account } = await supabase
      .from('user_accounts')
      .select('remaining_quota')
      .eq('user_id', userId)
      .single();

    // 9. 写入点数流水审计日志
    try {
      await supabase.from('quota_transactions').insert({
        user_id: userId,
        type: usedFreeQuota ? 'free_quota' : (actualCost > 0 ? 'deduct' : 'free_quota'),
        amount: actualCost > 0 && !usedFreeQuota ? -actualCost : 0,
        balance_after: account?.remaining_quota ?? 0,
        source: source || featureKey,
        description: usedFreeQuota
          ? `${featureName} (免费额度)`
          : `${featureName}扣费 -${actualCost}点`,
        reference_id: session_id || conversationId || null,
      });
    } catch (txErr) {
      console.warn('⚠️ quota_transactions insert failed (non-blocking):', txErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cost: actualCost,
        used_free_quota: usedFreeQuota,
        feature_name: featureName,
        remaining_quota: account?.remaining_quota || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('deduct-quota error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

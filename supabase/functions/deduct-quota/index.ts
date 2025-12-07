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

    const { feature_key, source, conversationId, metadata, amount: legacyAmount, feature_type: legacyFeatureType } = await req.json();
    
    // Support both feature_key (new) and feature_type (legacy)
    const featureKey = feature_key || legacyFeatureType;

    if (!featureKey && !legacyAmount) {
      return new Response(
        JSON.stringify({ error: 'feature_key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    let actualCost = legacyAmount || 1;
    let featureName = source || featureKey || 'unknown';
    let usedFreeQuota = false;
    let isEnabled = true;
    let freeQuota = 0;
    let freeQuotaPeriod = 'monthly';

    // 3. If feature exists in new system, use package_feature_settings
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
      if (packageId) {
        const { data: featureSetting } = await supabase
          .from('package_feature_settings')
          .select('is_enabled, cost_per_use, free_quota, free_quota_period')
          .eq('package_id', packageId)
          .eq('feature_id', featureItem.id)
          .single();

        if (featureSetting) {
          isEnabled = featureSetting.is_enabled;
          actualCost = featureSetting.cost_per_use;
          freeQuota = featureSetting.free_quota;
          freeQuotaPeriod = featureSetting.free_quota_period;
        }
      }

      if (!isEnabled) {
        return new Response(
          JSON.stringify({ error: '您的套餐不支持此功能', allowed: false }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Fallback to legacy feature_cost_rules
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

    // 4. Check and use free quota if available
    if (freeQuota > 0 && actualCost > 0) {
      // Calculate period start
      let periodStart: Date;
      const now = new Date();
      
      if (freeQuotaPeriod === 'daily') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (freeQuotaPeriod === 'monthly') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        // lifetime
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
      metadata: { ...metadata, feature_key: featureKey, free_quota_used: usedFreeQuota }
    });

    // 7. Get remaining quota
    const { data: account } = await supabase
      .from('user_accounts')
      .select('remaining_quota')
      .eq('user_id', userId)
      .single();

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

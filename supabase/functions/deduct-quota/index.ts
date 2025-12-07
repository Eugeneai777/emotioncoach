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

    const { feature_type, source, conversationId, metadata, amount: legacyAmount } = await req.json();

    // Determine actual cost - support both new feature_type and legacy amount
    let actualCost = legacyAmount || 1;
    let featureName = source || 'unknown';

    if (feature_type) {
      // New dynamic cost system - look up cost from feature_cost_rules
      const { data: costRule, error: costError } = await supabase
        .from('feature_cost_rules')
        .select('default_cost, feature_name, is_active')
        .eq('feature_type', feature_type)
        .single();

      if (costError) {
        console.log(`⚠️ No cost rule found for ${feature_type}, using default 1`);
        actualCost = 1;
      } else if (!costRule.is_active) {
        console.log(`ℹ️ Feature ${feature_type} is inactive, skipping charge`);
        return new Response(
          JSON.stringify({ success: true, remaining_quota: -1, message: 'Feature inactive' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        actualCost = costRule.default_cost;
        featureName = costRule.feature_name;
      }

      // Check for free quota if cost > 0
      if (actualCost > 0) {
        // Get user's active subscription and package
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('package_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (subscription?.package_id) {
          // Check for free quota for this feature
          const { data: freeQuota } = await supabase
            .from('package_free_quotas')
            .select('free_quota, period')
            .eq('package_id', subscription.package_id)
            .eq('feature_type', feature_type)
            .single();

          if (freeQuota && freeQuota.free_quota > 0) {
            // Get or create usage record for current period
            const periodStart = freeQuota.period === 'monthly' 
              ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
              : freeQuota.period === 'daily'
              ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
              : new Date(0).toISOString(); // lifetime

            const { data: usage, error: usageError } = await supabase
              .from('user_free_quota_usage')
              .select('id, used_count')
              .eq('user_id', userId)
              .eq('feature_type', feature_type)
              .gte('period_start', periodStart)
              .single();

            const usedCount = usage?.used_count || 0;

            if (usedCount < freeQuota.free_quota) {
              // Use free quota instead of deducting
              console.log(`🎁 Using free quota for ${feature_type}: ${usedCount + 1}/${freeQuota.free_quota}`);
              
              if (usage) {
                await supabase
                  .from('user_free_quota_usage')
                  .update({ used_count: usedCount + 1 })
                  .eq('id', usage.id);
              } else {
                await supabase
                  .from('user_free_quota_usage')
                  .insert({
                    user_id: userId,
                    feature_type,
                    used_count: 1,
                    period_start: periodStart
                  });
              }

              // Record usage but with 0 cost
              await supabase.from('usage_records').insert({
                user_id: userId,
                record_type: 'conversation',
                amount: 0,
                source: source || feature_type,
                conversation_id: conversationId,
                metadata: { ...metadata, free_quota_used: true, feature_type }
              });

              // Get current remaining quota for response
              const { data: account } = await supabase
                .from('user_accounts')
                .select('remaining_quota')
                .eq('user_id', userId)
                .single();

              return new Response(
                JSON.stringify({
                  success: true,
                  remaining_quota: account?.remaining_quota || 0,
                  free_quota_used: true,
                  free_quota_remaining: freeQuota.free_quota - usedCount - 1
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }
    }

    // If cost is 0, skip deduction
    if (actualCost === 0) {
      console.log(`ℹ️ Feature ${feature_type || source} has 0 cost, skipping deduction`);
      
      // Still record usage
      await supabase.from('usage_records').insert({
        user_id: userId,
        record_type: 'conversation',
        amount: 0,
        source: source || feature_type,
        conversation_id: conversationId,
        metadata: { ...metadata, feature_type }
      });

      const { data: account } = await supabase
        .from('user_accounts')
        .select('remaining_quota')
        .eq('user_id', userId)
        .single();

      return new Response(
        JSON.stringify({ success: true, remaining_quota: account?.remaining_quota || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute deduction
    const { data, error: deductError } = await supabase.rpc('deduct_user_quota', {
      p_user_id: userId,
      p_amount: actualCost,
    });

    if (deductError) {
      console.error(`❌ 扣费失败: ${deductError.message}`);
      throw new Error(`扣费失败: ${deductError.message}`);
    }

    // Record usage
    await supabase.from('usage_records').insert({
      user_id: userId,
      record_type: 'conversation',
      amount: actualCost,
      source: source || feature_type,
      conversation_id: conversationId,
      metadata: { ...metadata, feature_type }
    });

    console.log(`✅ 用户 ${userId} 扣费 ${actualCost} 次 (${featureName})，剩余: ${data[0].remaining_quota}`);

    return new Response(
      JSON.stringify({
        success: true,
        remaining_quota: data[0].remaining_quota,
        cost: actualCost
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

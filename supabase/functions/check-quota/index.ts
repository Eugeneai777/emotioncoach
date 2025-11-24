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

    const { userId, source } = await req.json();

    const { data: account, error } = await supabase
      .from('user_accounts')
      .select(`
        *,
        subscriptions(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error || !account) {
      console.log(`❌ 用户 ${userId} 账户不存在`);
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'user_not_found',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscription = account.subscriptions;
    const hasQuota = account.remaining_quota > 0;
    const isExpired = account.quota_expires_at 
      ? new Date(account.quota_expires_at) < new Date()
      : false;

    const isSubscriptionActive = subscription &&
      subscription.status === 'active' &&
      (!subscription.end_date || new Date(subscription.end_date) > new Date());

    const allowed = hasQuota && !isExpired;

    console.log(`✅ 检查额度 [${source}]: 用户 ${userId}, 剩余 ${account.remaining_quota}, 允许: ${allowed}`);

    return new Response(
      JSON.stringify({
        allowed,
        reason: !allowed ? (isExpired ? 'quota_expired' : 'insufficient_quota') : 'ok',
        account: {
          remaining_quota: account.remaining_quota,
          expires_at: account.quota_expires_at,
          subscription_type: subscription?.subscription_type || 'free',
          subscription_active: isSubscriptionActive,
          last_sync: account.last_sync_at,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('check-quota error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

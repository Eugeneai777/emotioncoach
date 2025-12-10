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
    // Extract user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the JWT and get the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const { source } = await req.json().catch(() => ({}));

    // Get user account
    const { data: account, error: accountError } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (accountError || !account) {
      console.log(`❌ 用户 ${userId} 账户不存在:`, accountError);
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'user_not_found',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subscription separately
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const subscription = subscriptions?.[0];
    const hasQuota = account.remaining_quota > 0;
    const isExpired = account.quota_expires_at 
      ? new Date(account.quota_expires_at) < new Date()
      : false;

    const isSubscriptionActive = subscription &&
      subscription.status === 'active' &&
      (!subscription.end_date || new Date(subscription.end_date) > new Date());

    const allowed = hasQuota && !isExpired;

    console.log(`✅ 检查额度 [${source || 'unknown'}]: 用户 ${userId}, 剩余 ${account.remaining_quota}, 允许: ${allowed}`);

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
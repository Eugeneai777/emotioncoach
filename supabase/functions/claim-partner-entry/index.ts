import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: '未授权访问' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: '用户验证失败' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { partner_id } = await req.json();

    if (!partner_id) {
      return new Response(
        JSON.stringify({ success: false, message: '缺少合伙人ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing free claim for user ${user.id} from partner ${partner_id}`);

    // Check if partner exists and get entry config
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, user_id, default_entry_type, default_quota_amount, total_referrals')
      .eq('id', partner_id)
      .single();

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerError);
      return new Response(
        JSON.stringify({ success: false, message: '合伙人不存在' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-referral
    if (partner.user_id === user.id) {
      return new Response(
        JSON.stringify({ success: false, message: '不能领取自己的推广福利' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already referred
    const { data: existingReferral } = await supabase
      .from('partner_referrals')
      .select('id')
      .eq('referred_user_id', user.id)
      .maybeSingle();

    if (existingReferral) {
      return new Response(
        JSON.stringify({ success: false, message: '你已经领取过了' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quotaAmount = partner.default_quota_amount || 10;

    // Add quota to user account
    const { data: userAccount, error: accountError } = await supabase
      .from('user_accounts')
      .select('id, total_quota')
      .eq('user_id', user.id)
      .single();

    if (accountError && accountError.code !== 'PGRST116') {
      throw accountError;
    }

    if (userAccount) {
      // Update existing account
      await supabase
        .from('user_accounts')
        .update({ 
          total_quota: userAccount.total_quota + quotaAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      // Create new account
      await supabase
        .from('user_accounts')
        .insert({
          user_id: user.id,
          total_quota: quotaAmount,
          used_quota: 0
        });
    }

    // Create referral record
    await supabase
      .from('partner_referrals')
      .insert({
        partner_id: partner_id,
        referred_user_id: user.id,
        level: 1,
        conversion_status: 'trial'
      });

    // Update partner referral count
    await supabase
      .from('partners')
      .update({
        total_referrals: partner.total_referrals ? partner.total_referrals + 1 : 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', partner_id);

    console.log(`Successfully claimed ${quotaAmount} quota for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功领取${quotaAmount}次对话额度！`,
        quota_amount: quotaAmount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Claim error:', error);
    const message = error instanceof Error ? error.message : '领取失败';
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

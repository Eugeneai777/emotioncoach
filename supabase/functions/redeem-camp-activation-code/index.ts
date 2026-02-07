import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedeemRequest {
  code: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: '请先登录后再兑换' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('[redeem-camp-activation-code] Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: '登录已过期，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { code }: RedeemRequest = await req.json();

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '请输入兑换码' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedCode = code.trim();
    console.log(`[redeem-camp-activation-code] User ${user.id} attempting to redeem code: ${trimmedCode.substring(0, 4)}***`);

    // Check if user already has wealth camp purchase
    const { data: existingPurchase } = await supabaseAdmin
      .from('user_camp_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('camp_type', 'wealth_block_7')
      .eq('payment_status', 'completed')
      .maybeSingle();

    if (existingPurchase) {
      console.log(`[redeem-camp-activation-code] User ${user.id} already has camp access`);
      return new Response(
        JSON.stringify({
          success: false,
          error: '您已拥有训练营权限，无需重复兑换',
          alreadyActivated: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up activation code (case-insensitive)
    const { data: activationCode, error: codeError } = await supabaseAdmin
      .from('wealth_camp_activation_codes')
      .select('*')
      .ilike('code', trimmedCode)
      .maybeSingle();

    if (codeError) {
      console.error('[redeem-camp-activation-code] Code lookup error:', codeError);
      return new Response(
        JSON.stringify({ success: false, error: '系统错误，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!activationCode) {
      console.log(`[redeem-camp-activation-code] Code not found: ${trimmedCode.substring(0, 4)}***`);
      return new Response(
        JSON.stringify({ success: false, error: '兑换码无效' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already used
    if (activationCode.is_used) {
      console.log(`[redeem-camp-activation-code] Code already used: ${activationCode.id}`);
      return new Response(
        JSON.stringify({ success: false, error: '该兑换码已被使用' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
      console.log(`[redeem-camp-activation-code] Code expired: ${activationCode.id}`);
      return new Response(
        JSON.stringify({ success: false, error: '该兑换码已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate transaction ID
    const transactionId = `CAMP-ACT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create user_camp_purchases record
    const { error: purchaseError } = await supabaseAdmin
      .from('user_camp_purchases')
      .insert({
        user_id: user.id,
        camp_type: 'wealth_block_7',
        camp_name: '财富觉醒训练营（兑换码）',
        purchase_price: 0,
        payment_method: 'activation_code',
        payment_status: 'completed',
        transaction_id: transactionId,
        purchased_at: new Date().toISOString(),
      });

    if (purchaseError) {
      console.error('[redeem-camp-activation-code] Purchase creation error:', purchaseError);
      return new Response(
        JSON.stringify({ success: false, error: '兑换失败，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark activation code as used
    const { error: updateError } = await supabaseAdmin
      .from('wealth_camp_activation_codes')
      .update({
        is_used: true,
        redeemed_by: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', activationCode.id);

    if (updateError) {
      console.error('[redeem-camp-activation-code] Code update error:', updateError);
      // Purchase was created, so still return success
    }

    console.log(`[redeem-camp-activation-code] Successfully redeemed for user ${user.id}, transaction: ${transactionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        message: '兑换成功！',
        batchName: activationCode.batch_name,
        sourceChannel: activationCode.source_channel,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[redeem-camp-activation-code] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: '系统错误，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

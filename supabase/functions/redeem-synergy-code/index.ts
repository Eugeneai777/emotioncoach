import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: '登录已过期，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code } = await req.json();
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '请输入兑换码' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedCode = code.trim();
    console.log(`[redeem-synergy-code] User ${user.id} attempting code: ${trimmedCode.substring(0, 4)}***`);

    // Check existing purchase
    const { data: existingPurchase } = await supabaseAdmin
      .from('user_camp_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('camp_type', 'emotion_stress_7')
      .eq('payment_status', 'completed')
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ success: false, error: '您已拥有训练营权限，无需重复兑换', alreadyActivated: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up code
    const { data: activationCode, error: codeError } = await supabaseAdmin
      .from('synergy_activation_codes')
      .select('*')
      .ilike('code', trimmedCode)
      .maybeSingle();

    if (codeError) {
      console.error('[redeem-synergy-code] Code lookup error:', codeError);
      return new Response(
        JSON.stringify({ success: false, error: '系统错误，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!activationCode) {
      return new Response(
        JSON.stringify({ success: false, error: '兑换码无效' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (activationCode.is_used) {
      return new Response(
        JSON.stringify({ success: false, error: '该兑换码已被使用' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: '该兑换码已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transactionId = `SYN-ACT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create camp purchase for emotion_stress_7
    const { error: purchaseError } = await supabaseAdmin
      .from('user_camp_purchases')
      .insert({
        user_id: user.id,
        camp_type: 'emotion_stress_7',
        camp_name: '7天有劲训练营（兑换码）',
        purchase_price: 0,
        payment_method: 'activation_code',
        payment_status: 'completed',
        transaction_id: transactionId,
        purchased_at: new Date().toISOString(),
      });

    if (purchaseError) {
      console.error('[redeem-synergy-code] Purchase creation error:', purchaseError);
      return new Response(
        JSON.stringify({ success: false, error: '兑换失败，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also grant emotion_journal_21 entitlement
    await supabaseAdmin
      .from('user_camp_purchases')
      .insert({
        user_id: user.id,
        camp_type: 'emotion_journal_21',
        camp_name: '21天情绪日记（兑换码附赠）',
        purchase_price: 0,
        payment_method: 'activation_code',
        payment_status: 'completed',
        transaction_id: `${transactionId}-J21`,
        purchased_at: new Date().toISOString(),
      });

    // Mark code as used
    await supabaseAdmin
      .from('synergy_activation_codes')
      .update({
        is_used: true,
        redeemed_by: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', activationCode.id);

    console.log(`[redeem-synergy-code] Success for user ${user.id}, transaction: ${transactionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        message: '兑换成功！',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[redeem-synergy-code] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: '系统错误，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

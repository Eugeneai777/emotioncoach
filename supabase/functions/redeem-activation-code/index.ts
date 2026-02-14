import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RedeemRequest {
  code: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: '请先登录后再激活' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // User client for auth verification
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Service client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('[redeem-activation-code] Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: '登录已过期，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { code }: RedeemRequest = await req.json();
    
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '请输入激活码' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedCode = code.trim();
    console.log(`[redeem-activation-code] User ${user.id} attempting to redeem code: ${trimmedCode.substring(0, 4)}***`);

    // Check if user already has wealth_block_assessment access
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('package_key', 'wealth_block_assessment')
      .eq('status', 'paid')
      .maybeSingle();

    if (existingOrder) {
      console.log(`[redeem-activation-code] User ${user.id} already has assessment access`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '您已拥有测评权限，无需重复激活',
          alreadyActivated: true 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up activation code (case-insensitive)
    const { data: activationCode, error: codeError } = await supabaseAdmin
      .from('wealth_assessment_activation_codes')
      .select('*')
      .ilike('code', trimmedCode)
      .maybeSingle();

    if (codeError) {
      console.error('[redeem-activation-code] Code lookup error:', codeError);
      return new Response(
        JSON.stringify({ success: false, error: '系统错误，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!activationCode) {
      console.log(`[redeem-activation-code] Code not found: ${trimmedCode.substring(0, 4)}***`);
      return new Response(
        JSON.stringify({ success: false, error: '激活码无效' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already used
    if (activationCode.is_used) {
      console.log(`[redeem-activation-code] Code already used: ${activationCode.id}`);
      return new Response(
        JSON.stringify({ success: false, error: '该激活码已被使用' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
      console.log(`[redeem-activation-code] Code expired: ${activationCode.id}`);
      return new Response(
        JSON.stringify({ success: false, error: '该激活码已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate order number
    const orderNo = `ACT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create order record (amount = 0, status = paid)
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: user.id,
        package_key: 'wealth_block_assessment',
        package_name: '财富卡点测评（激活码）',
        amount: 0,
        status: 'paid',
        payment_method: 'activation_code',
        paid_at: new Date().toISOString(),
        metadata: {
          activation_code_id: activationCode.id,
          batch_name: activationCode.batch_name,
          source_channel: activationCode.source_channel,
        }
      });

    if (orderError) {
      console.error('[redeem-activation-code] Order creation error:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: '激活失败，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark activation code as used
    const { error: updateError } = await supabaseAdmin
      .from('wealth_assessment_activation_codes')
      .update({
        is_used: true,
        redeemed_by: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', activationCode.id);

    if (updateError) {
      console.error('[redeem-activation-code] Code update error:', updateError);
      // Order was created, so still return success
      // The code update failure is logged but doesn't block user access
    }

    console.log(`[redeem-activation-code] Successfully activated for user ${user.id}, order: ${orderNo}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderNo,
        message: '激活成功！',
        batchName: activationCode.batch_name,
        sourceChannel: activationCode.source_channel,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[redeem-activation-code] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: '系统错误，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

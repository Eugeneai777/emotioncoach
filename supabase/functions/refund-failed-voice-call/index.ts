import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 退还语音通话预扣费点数
 * 当语音通话连接失败时，退还已预扣的第一分钟点数
 * 
 * 🔒 安全设计：
 * 1. 需要用户认证
 * 2. 只能退还自己的点数
 * 3. 使用 service_role 调用 add_user_quota 函数
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 验证用户身份
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // 使用 anon key 验证用户
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`🔐 Authenticated user for refund: ${userId}`);

    // 解析请求体
    const { amount, session_id, reason, feature_key } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid refund amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💰 Refund request: user=${userId}, amount=${amount}, session=${session_id}, reason=${reason}`);

    // 使用 service_role 执行退款
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 调用 add_user_quota 函数退还点数
    const { data: refundResult, error: refundError } = await supabase.rpc('add_user_quota', {
      p_user_id: userId,
      p_amount: amount
    });

    if (refundError) {
      console.error('❌ Refund failed:', refundError.message);
      return new Response(
        JSON.stringify({ error: 'Refund failed', details: refundError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = refundResult?.[0];
    if (!result?.success) {
      console.error('❌ Refund failed:', result?.message);
      return new Response(
        JSON.stringify({ error: result?.message || 'Refund failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 记录退款到 usage_records
    await supabase.from('usage_records').insert({
      user_id: userId,
      record_type: 'refund',
      amount: -amount, // 负数表示退还
      source: 'voice_chat_refund',
      metadata: {
        session_id,
        reason: reason || 'connection_failed',
        feature_key: feature_key || 'realtime_voice',
        refund_type: 'pre_deduction_refund'
      }
    });

    console.log(`✅ Refund successful: ${amount} points returned, new balance: ${result.new_remaining_quota}`);

    return new Response(
      JSON.stringify({
        success: true,
        refunded_amount: amount,
        remaining_quota: result.new_remaining_quota,
        message: result.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Refund error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

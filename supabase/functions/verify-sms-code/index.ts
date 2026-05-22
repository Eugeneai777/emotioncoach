import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

const ALLOWED_PURPOSES = ['coach_proxy_verify'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code, purpose } = await req.json();

    if (!phone || !/^\d{11}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: '请输入有效的11位手机号' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: '请输入6位验证码' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!ALLOWED_PURPOSES.includes(purpose)) {
      return new Response(
        JSON.stringify({ error: '不支持的验证用途' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: codes } = await adminClient
      .from('sms_verification_codes')
      .select('*')
      .eq('phone_number', phone)
      .eq('code', code)
      .eq('purpose', purpose)
      .is('verified_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (!codes || codes.length === 0) {
      return new Response(
        JSON.stringify({ error: '验证码无效或已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 标记已使用
    await adminClient
      .from('sms_verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', codes[0].id);

    return new Response(
      JSON.stringify({ success: true, verified_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('verify-sms-code error:', error);
    return new Response(
      JSON.stringify({ error: '验证失败，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

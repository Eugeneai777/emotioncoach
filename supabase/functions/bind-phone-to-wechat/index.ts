import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code, countryCode = '+86' } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: '手机号和验证码不能为空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^\d{11}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: '请输入有效的11位手机号' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 验证调用者身份
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '未登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '身份验证失败' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 确认是微信用户（临时邮箱）
    const userEmail = user.email || '';
    if (!userEmail.includes('@temp.youjin365.com')) {
      return new Response(
        JSON.stringify({ error: '仅微信用户需要绑定手机号' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 验证短信验证码
    const { data: codes, error: codeError } = await adminClient
      .from('sms_verification_codes')
      .select('*')
      .eq('phone_number', phone)
      .eq('code', code)
      .eq('purpose', 'sms_login')
      .is('verified_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (codeError || !codes || codes.length === 0) {
      return new Response(
        JSON.stringify({ error: '验证码无效或已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 标记验证码已使用
    await adminClient
      .from('sms_verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', codes[0].id);

    // 检查手机号是否已被其他用户绑定
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, display_name')
      .eq('phone', phone)
      .eq('phone_country_code', countryCode)
      .is('deleted_at', null)
      .neq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: '该手机号已绑定其它微信账号，请使用该手机号登录后查看' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 绑定手机号到当前用户 profile
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        phone,
        phone_country_code: countryCode,
        phone_bind_prompted: true,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update profile error:', updateError);
      return new Response(
        JSON.stringify({ error: '绑定失败，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Phone ${phone} bound to WeChat user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: '手机号绑定成功' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bind phone error:', error);
    return new Response(
      JSON.stringify({ error: '绑定失败，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

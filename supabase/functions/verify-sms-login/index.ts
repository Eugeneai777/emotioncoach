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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 查询有效验证码
    const { data: codes, error: codeError } = await adminClient
      .from('sms_verification_codes')
      .select('*')
      .eq('phone_number', phone)
      .eq('code', code)
      .eq('purpose', 'sms_login')
      .eq('is_used', false)
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
      .update({ is_used: true })
      .eq('id', codes[0].id);

    // 生成占位邮箱
    const cleanCode = countryCode.replace('+', '');
    const placeholderEmail = `phone_${cleanCode}${phone}@youjin.app`;

    // ✅ 修复P0：精准查询用户，替代 listUsers() 全量拉取
    const { data: userLookup, error: lookupError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    // 通过邮箱精确匹配（listUsers 不支持 filter，改用遍历 + profiles 表双重确认）
    // 更可靠的方案：先查 profiles 表
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .eq('phone_country_code', countryCode)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    let existingUserId: string | null = profileData?.id || null;

    // 如果 profiles 没找到，尝试通过占位邮箱查 auth.users
    if (!existingUserId) {
      // 使用 admin API 通过邮箱精准查找
      // Supabase admin API 没有 getUserByEmail，但可以用 listUsers + filter workaround
      // 最可靠方式：直接尝试 generateLink，如果用户不存在会报错
      try {
        const { data: linkTest, error: linkTestError } = await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email: placeholderEmail,
        });
        if (!linkTestError && linkTest?.user) {
          existingUserId = linkTest.user.id;
        }
      } catch {
        // 用户不存在，继续注册流程
      }
    }

    if (existingUserId) {
      // ✅ 已有用户：使用 generateLink + verifyOtp 统一登录（不再覆盖密码）
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: placeholderEmail,
      });

      if (linkError) {
        console.error('Generate link error:', linkError);
        return new Response(
          JSON.stringify({ error: '登录失败，请稍后重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 从 action_link 中提取 token_hash
      const url = new URL(linkData.properties.action_link);
      const token_hash = url.searchParams.get('token') || url.hash?.match(/token=([^&]*)/)?.[1];

      if (!token_hash) {
        console.error('Failed to extract token_hash from action_link');
        return new Response(
          JSON.stringify({ error: '登录失败，请稍后重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 使用 OTP 验证获取 session
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
        token_hash: token_hash,
        type: 'magiclink',
      });

      if (verifyError || !verifyData.session) {
        console.error('Verify OTP error:', verifyError);
        return new Response(
          JSON.stringify({ error: '登录验证失败，请重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          isNewUser: false,
          session: verifyData.session,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // 新用户：自动注册
      const defaultPassword = crypto.randomUUID();
      const { data: newUser, error: signUpError } = await adminClient.auth.admin.createUser({
        email: placeholderEmail,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          display_name: `用户${phone.slice(-4)}`,
        },
      });

      if (signUpError) {
        console.error('Create user error:', signUpError);
        return new Response(
          JSON.stringify({ error: '注册失败，请稍后重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 创建 profile
      await adminClient.from('profiles').upsert({
        id: newUser.user.id,
        display_name: `用户${phone.slice(-4)}`,
        phone: phone,
        phone_country_code: countryCode,
        auth_provider: 'sms',
      });

      // 登录新用户
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
        email: placeholderEmail,
        password: defaultPassword,
      });

      if (signInError) {
        console.error('Sign in new user error:', signInError);
        return new Response(
          JSON.stringify({ error: '自动登录失败，请使用密码登录' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          isNewUser: true,
          session: signInData.session,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Verify SMS login error:', error);
    return new Response(
      JSON.stringify({ error: '验证失败，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

    // 检查用户是否已存在
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === placeholderEmail);

    if (existingUser) {
      // 已有用户，生成登录链接（magic link 方式）
      // 使用 admin API 生成 session
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

      // 从 link 中提取 token 并直接验证
      const url = new URL(linkData.properties.action_link);
      const token_hash = url.searchParams.get('token') || url.hash?.match(/token=([^&]*)/)?.[1];
      
      if (!token_hash) {
        // Fallback: 使用 signInWithPassword（为已有验证码用户设置临时密码）
        const tempPassword = crypto.randomUUID();
        await adminClient.auth.admin.updateUser(existingUser.id, { password: tempPassword });
        
        // 创建匿名 client 进行登录
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const anonClient = createClient(supabaseUrl, anonKey);
        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
          email: placeholderEmail,
          password: tempPassword,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          return new Response(
            JSON.stringify({ error: '登录失败' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 恢复原密码（如果有）或保留临时密码
        return new Response(
          JSON.stringify({
            success: true,
            isNewUser: false,
            session: signInData.session,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 使用 OTP 验证
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
        token_hash: token_hash,
        type: 'magiclink',
      });

      if (verifyError) {
        console.error('Verify OTP error:', verifyError);
        // Fallback
        const tempPassword = crypto.randomUUID();
        await adminClient.auth.admin.updateUser(existingUser.id, { password: tempPassword });
        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
          email: placeholderEmail,
          password: tempPassword,
        });
        if (signInError) {
          return new Response(
            JSON.stringify({ error: '登录失败' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ success: true, isNewUser: false, session: signInData.session }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      const defaultPassword = crypto.randomUUID(); // 随机密码
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

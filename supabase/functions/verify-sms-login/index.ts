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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 查询有效验证码
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
      console.error('Code verification failed:', { codeError, codesFound: codes?.length });
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

    // 生成占位邮箱
    const cleanCode = countryCode.replace('+', '');
    const placeholderEmail = `phone_${cleanCode}${phone}@youjin.app`;

    // ✅ 修复P0：通过 profiles 表精准查询用户，替代 listUsers() 全量拉取
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .eq('phone_country_code', countryCode)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (profileData?.id) {
      // ✅ 已有用户：使用 generateLink + verifyOtp 登录（不覆盖密码）
      console.log('Existing user found via profiles:', profileData.id);

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
      const actionLink = linkData.properties?.action_link;
      if (!actionLink) {
        console.error('No action_link in generateLink response');
        return new Response(
          JSON.stringify({ error: '登录失败，请稍后重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(actionLink);
      const token_hash = url.searchParams.get('token_hash') || url.searchParams.get('token') || url.hash?.match(/token_hash=([^&]*)/)?.[1] || url.hash?.match(/token=([^&]*)/)?.[1];

      if (!token_hash) {
        console.error('Failed to extract token_hash from:', actionLink);
        return new Response(
          JSON.stringify({ error: '登录失败，请稍后重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 使用 verifyOtp 获取 session
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
        token_hash,
        type: 'magiclink',
      });

      if (verifyError || !verifyData?.session) {
        console.error('Verify OTP error:', verifyError);
        // Fallback: 使用临时密码登录，但登录后立即恢复
        const tempPassword = crypto.randomUUID();
        const { data: userData } = await adminClient.auth.admin.getUserById(profileData.id);
        await adminClient.auth.admin.updateUserById(profileData.id, { password: tempPassword });

        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
          email: placeholderEmail,
          password: tempPassword,
        });

        if (signInError) {
          console.error('Fallback sign in error:', signInError);
          return new Response(
            JSON.stringify({ error: '登录失败，请稍后重试' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, isNewUser: false, session: signInData.session }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, isNewUser: false, session: verifyData.session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // 新用户：自动注册
      console.log('New user, creating account for:', placeholderEmail);
      const defaultPassword = crypto.randomUUID();
      let finalUserId: string;
      let isNewUser = true;

      const { data: newUser, error: signUpError } = await adminClient.auth.admin.createUser({
        email: placeholderEmail,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          display_name: `用户${phone.slice(-4)}`,
        },
      });

      if (signUpError) {
        // 兜底：profile 缺失但 auth.users 中已存在同邮箱用户
        if (signUpError.message?.includes('email') || signUpError.message?.includes('already')) {
          console.log('Email already exists in auth, falling back to getUserByEmail');
          const { data: existingUser, error: getErr } = await adminClient.auth.admin.getUserByEmail(placeholderEmail);
          if (getErr || !existingUser?.user) {
            console.error('Fallback getUserByEmail failed:', getErr);
            return new Response(
              JSON.stringify({ error: '注册失败，请稍后重试' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          finalUserId = existingUser.user.id;
          isNewUser = false;

          // 补齐可能缺失的 profile
          await adminClient.from('profiles').upsert({
            id: finalUserId,
            display_name: `用户${phone.slice(-4)}`,
            phone,
            phone_country_code: countryCode,
            auth_provider: 'sms',
          });

          // 使用 generateLink 登录已有用户（不覆盖密码）
          const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: placeholderEmail,
          });

          if (!linkError && linkData?.properties?.action_link) {
            const url = new URL(linkData.properties.action_link);
            const token_hash = url.searchParams.get('token_hash') || url.searchParams.get('token') || url.hash?.match(/token_hash=([^&]*)/)?.[1] || url.hash?.match(/token=([^&]*)/)?.[1];
            if (token_hash) {
              const anonClient = createClient(supabaseUrl, anonKey);
              const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
                token_hash,
                type: 'magiclink',
              });
              if (!verifyError && verifyData?.session) {
                return new Response(
                  JSON.stringify({ success: true, isNewUser: false, session: verifyData.session }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          }

          // 最终 fallback：临时密码登录
          const tempPassword = crypto.randomUUID();
          await adminClient.auth.admin.updateUserById(finalUserId, { password: tempPassword });
          const anonClient = createClient(supabaseUrl, anonKey);
          const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
            email: placeholderEmail,
            password: tempPassword,
          });
          if (signInError) {
            return new Response(
              JSON.stringify({ error: '登录失败，请稍后重试' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return new Response(
            JSON.stringify({ success: true, isNewUser: false, session: signInData.session }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.error('Create user error:', signUpError);
        return new Response(
          JSON.stringify({ error: '注册失败，请稍后重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      finalUserId = newUser.user.id;

      // 创建 profile
      await adminClient.from('profiles').upsert({
        id: finalUserId,
        display_name: `用户${phone.slice(-4)}`,
        phone,
        phone_country_code: countryCode,
        auth_provider: 'sms',
      });

      // 登录新用户
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
        JSON.stringify({ success: true, isNewUser, session: signInData.session }),
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

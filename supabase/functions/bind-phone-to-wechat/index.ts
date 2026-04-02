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
      // 检查该手机号用户是否是微信用户
      const { data: existingAuthData } = await adminClient.auth.admin.getUserById(existingProfile.id);
      const existingEmail = existingAuthData?.user?.email || '';
      const isExistingWechatUser = existingEmail.includes('@temp.youjin365.com');

      if (isExistingWechatUser) {
        // 手机号已被另一个微信账号绑定，拒绝
        return new Response(
          JSON.stringify({ error: '该手机号已绑定其它微信账号，请使用该手机号登录后查看' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 手机号属于普通账号（手机号/邮箱注册），执行账号合并：
      // 将微信用户的资产迁移到已有手机号用户，然后清理微信临时账号
      console.log(`[bind-phone] Merging WeChat user ${user.id} into phone user ${existingProfile.id}`);

      const wechatUserId = user.id;
      const phoneUserId = existingProfile.id;

      // 迁移订单
      await adminClient
        .from('orders')
        .update({ user_id: phoneUserId })
        .eq('user_id', wechatUserId);

      // 迁移会话记录
      await adminClient
        .from('conversations')
        .update({ user_id: phoneUserId })
        .eq('user_id', wechatUserId);

      // 迁移觉醒记录
      await adminClient
        .from('awakening_entries')
        .update({ user_id: phoneUserId })
        .eq('user_id', wechatUserId);

      // 迁移呼吸会话
      await adminClient
        .from('breathing_sessions')
        .update({ user_id: phoneUserId })
        .eq('user_id', wechatUserId);

      // 迁移 AI 教练通话
      await adminClient
        .from('ai_coach_calls')
        .update({ user_id: phoneUserId })
        .eq('user_id', wechatUserId);

      // 迁移训练营购买
      await adminClient
        .from('user_camp_purchases')
        .update({ user_id: phoneUserId })
        .eq('user_id', wechatUserId);

      // 迁移用户额度（合并）
      const { data: wechatAccount } = await adminClient
        .from('user_accounts')
        .select('total_quota, used_quota')
        .eq('user_id', wechatUserId)
        .maybeSingle();

      if (wechatAccount) {
        const { data: phoneAccount } = await adminClient
          .from('user_accounts')
          .select('total_quota, used_quota')
          .eq('user_id', phoneUserId)
          .maybeSingle();

        if (phoneAccount) {
          await adminClient
            .from('user_accounts')
            .update({
              total_quota: (phoneAccount.total_quota || 0) + (wechatAccount.total_quota || 0),
            })
            .eq('user_id', phoneUserId);
        }

        // 删除微信临时账号的 user_accounts
        await adminClient
          .from('user_accounts')
          .delete()
          .eq('user_id', wechatUserId);
      }

      // 将微信映射关联到手机号用户
      await adminClient
        .from('wechat_user_mappings')
        .update({ system_user_id: phoneUserId })
        .eq('system_user_id', wechatUserId);

      // 标记微信临时 profile 为已删除
      await adminClient
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', wechatUserId);

      // 标记手机号用户已完成绑定
      await adminClient
        .from('profiles')
        .update({ phone_bind_prompted: true })
        .eq('id', phoneUserId);

      console.log(`[bind-phone] Merge complete: WeChat ${wechatUserId} → Phone ${phoneUserId}`);

      // 生成手机号用户的新 session 给微信用户使用
      // 使用 generateLink 获取 magic link 来登录目标账号
      const phoneEmail = existingAuthData?.user?.email || `phone_${countryCode.replace('+', '')}${phone}@youjin.app`;
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: phoneEmail,
      });

      if (linkError || !linkData) {
        console.error('[bind-phone] Failed to generate session for merged user:', linkError);
        return new Response(
          JSON.stringify({ 
            success: true, 
            merged: true,
            message: '手机号绑定成功，账号已合并。请使用手机号重新登录。',
            needRelogin: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 从 link 中提取 token_hash 用于 verifyOtp
      const actionLink = linkData?.properties?.action_link || '';
      const urlObj = new URL(actionLink);
      const tokenHash = urlObj.searchParams.get('token_hash') || urlObj.hash?.match(/token_hash=([^&]+)/)?.[1];

      if (tokenHash) {
        const { data: sessionData, error: verifyError } = await adminClient.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });

        if (!verifyError && sessionData?.session) {
          return new Response(
            JSON.stringify({
              success: true,
              merged: true,
              message: '手机号绑定成功，账号已合并',
              session: sessionData.session,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          merged: true,
          message: '手机号绑定成功，账号已合并。请使用手机号重新登录。',
          needRelogin: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state } = await req.json();

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing code or state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 使用系统级微信配置
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      return new Response(
        JSON.stringify({ error: 'WeChat not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 通过 code 换取 access_token 和 openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    
    console.log('Fetching access token...');
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode) {
      console.error('WeChat token error:', tokenData);
      return new Response(
        JSON.stringify({ error: `WeChat error: ${tokenData.errmsg || 'Unknown error'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`;
    const userInfoResponse = await fetch(userInfoUrl);
    const userInfo = await userInfoResponse.json();

    console.log('Got user info:', userInfo.nickname);

    // 检查是否已存在该 openid 的映射
    const { data: existingMapping } = await supabaseClient
      .from('wechat_user_mappings')
      .select('system_user_id')
      .eq('openid', tokenData.openid)
      .single();

    let finalUserId: string | null = null;
    let isNewUser = false;

    // 如果 state 是 'register'，表示是注册流程
    if (state === 'register') {
      if (existingMapping?.system_user_id) {
        // 用户已存在，直接当作登录处理
        finalUserId = existingMapping.system_user_id;
        isNewUser = false;
        console.log('User already registered, logging in:', finalUserId);
      } else {
        // 创建新用户
        const email = `wechat_${tokenData.openid}@temp.youjin365.com`;
        const password = crypto.randomUUID();
        
        const { data: newUser, error: signUpError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nickname: userInfo.nickname,
            avatar_url: userInfo.headimgurl,
            wechat_openid: tokenData.openid
          }
        });

        if (signUpError) {
          // 如果是邮箱已存在错误，尝试获取现有用户并登录
          if (signUpError.code === 'email_exists') {
            console.log('Email exists, fetching existing user...');
            const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === email);
            
            if (existingUser) {
              finalUserId = existingUser.id;
              isNewUser = false;
              console.log('Found existing user by email:', finalUserId);
              
              // 确保映射存在
              await supabaseClient
                .from('wechat_user_mappings')
                .upsert({
                  system_user_id: finalUserId,
                  openid: tokenData.openid,
                  unionid: tokenData.unionid,
                  nickname: userInfo.nickname,
                  avatar_url: userInfo.headimgurl,
                  subscribe_status: true,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'openid' });
            } else {
              console.error('Sign up error:', signUpError);
              return new Response(
                JSON.stringify({ error: signUpError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            console.error('Sign up error:', signUpError);
            return new Response(
              JSON.stringify({ error: signUpError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (!newUser?.user) {
          return new Response(
            JSON.stringify({ error: 'Failed to create user' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          finalUserId = newUser.user.id;
          isNewUser = true;
          console.log('Created new user:', finalUserId);
        }
      }
    } else if (state === 'bind') {
      // 绑定流程 - 从 authorization header 获取当前用户
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingMapping?.system_user_id && existingMapping.system_user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'already_bound' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      finalUserId = user.id;
      console.log('Binding to existing user:', finalUserId);
    } else if (existingMapping) {
      // 登录流程且已有映射
      finalUserId = existingMapping.system_user_id;
    } else {
      // 登录流程但没有映射
      return new Response(
        JSON.stringify({ error: 'not_registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 保存或更新用户映射
    const { error: upsertError } = await supabaseClient
      .from('wechat_user_mappings')
      .upsert({
        system_user_id: finalUserId,
        openid: tokenData.openid,
        unionid: tokenData.unionid,
        nickname: userInfo.nickname,
        avatar_url: userInfo.headimgurl,
        subscribe_status: true,
        subscribe_time: new Date().toISOString(),
        is_registered: true,
        registered_at: isNewUser ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'openid'
      });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: upsertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User mapping saved for:', tokenData.openid);

    // 更新 profiles 表的 auth_provider 为 wechat
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({ auth_provider: 'wechat' })
      .eq('id', finalUserId);

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError);
      // 不阻止登录流程，只记录错误
    } else {
      console.log('Profile auth_provider updated to wechat for:', finalUserId);
    }

    // 对于绑定流程，直接返回成功
    if (state === 'bind') {
      return new Response(
        JSON.stringify({ success: true, isNewUser: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 生成登录令牌
    const email = `wechat_${tokenData.openid}@temp.youjin365.com`;
    const { data: session, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return new Response(
        JSON.stringify({ error: sessionError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 发送登录成功通知（异步，不阻塞登录流程）
    try {
      const now = new Date();
      const loginTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      supabaseClient.functions.invoke('send-wechat-template-message', {
        body: {
          userId: finalUserId,
          scenario: 'login_success',
          notification: {
            id: crypto.randomUUID(),
            title: '登录成功',
            message: `您已于 ${loginTime} 成功登录有劲365`
          }
        }
      }).then(result => {
        if (result.error) {
          console.log('Login notification send failed:', result.error);
        } else {
          console.log('Login notification sent:', result.data);
        }
      }).catch(err => {
        console.log('Login notification error:', err);
      });
    } catch (notifyError) {
      console.log('Failed to send login notification:', notifyError);
      // 不阻止登录流程
    }

    return new Response(
      JSON.stringify({
        success: true,
        magicLink: true,
        tokenHash: session.properties.hashed_token,
        isNewUser,
        userId: finalUserId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in WeChat OAuth process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

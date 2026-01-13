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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 使用系统级微信配置
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      throw new Error('WeChat not configured - missing WECHAT_APP_ID or WECHAT_APP_SECRET');
    }

    // 通过 code 换取 access_token 和 openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode) {
      throw new Error(`WeChat OAuth error: ${tokenData.errmsg || 'Unknown error'}`);
    }

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`;
    const userInfoResponse = await fetch(userInfoUrl);
    const userInfo = await userInfoResponse.json();

    // 检查是否已存在该 openid 的映射
    const { data: existingMapping } = await supabaseClient
      .from('wechat_user_mappings')
      .select('system_user_id')
      .eq('openid', tokenData.openid)
      .single();

    let finalUserId: string | null = null;
    let isNewUser = false;

    // 解析 state：支持 'register', 'register_订单号', 'login', 'bind_用户ID' 格式
    const isRegister = state === 'register' || state.startsWith('register_');
    const isLogin = state === 'login';
    const isBind = state.startsWith('bind_');

    // 核心逻辑：如果微信已绑定账号，无论登录还是注册都直接使用已有用户
    if (existingMapping?.system_user_id) {
      // 微信已绑定用户，直接当作登录处理
      finalUserId = existingMapping.system_user_id;
      isNewUser = false;
      console.log('微信已绑定用户，直接登录:', finalUserId);
    } else if (isRegister) {
      // 注册模式且微信未绑定，创建新用户
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
        // 如果邮箱已存在，尝试获取现有用户
        if (signUpError.code === 'email_exists') {
          console.log('邮箱已存在，查找现有用户...');
          const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === email);
          
          if (existingUser) {
            finalUserId = existingUser.id;
            isNewUser = false;
            console.log('找到现有用户:', finalUserId);
          } else {
            throw signUpError;
          }
        } else {
          throw signUpError;
        }
      } else if (!newUser?.user) {
        throw new Error('Failed to create user');
      } else {
        finalUserId = newUser.user.id;
        isNewUser = true;
        console.log('创建新用户成功:', finalUserId);
      }
    } else if (isLogin || isBind) {
      // 登录或绑定模式但没有映射，引导去注册
      const redirectUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${redirectUrl}/wechat-auth?mode=register&wechat_error=not_registered`
        }
      });
    } else {
      // 未知 state，引导去注册
      const redirectUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${redirectUrl}/wechat-auth?mode=register`
        }
      });
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

    if (upsertError) throw upsertError;

    console.log('用户微信映射成功:', tokenData.openid);

    // 生成登录令牌（必须使用 finalUserId 对应的邮箱，否则会登录到错误账号）
    if (!finalUserId) {
      throw new Error('Missing finalUserId');
    }

    const { data: finalAuthUser, error: finalAuthUserError } = await supabaseClient.auth.admin.getUserById(finalUserId);
    if (finalAuthUserError || !finalAuthUser?.user?.email) {
      throw new Error('Failed to resolve user email for magiclink');
    }

    const { data: session, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: finalAuthUser.user.email,
    });

    if (sessionError) throw sessionError;

    const redirectUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
    
    // 注册成功后跳转到关注公众号引导页，登录成功后直接进入首页
    const nextPath = isNewUser ? '/wechat-auth?mode=follow' : '/';
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${redirectUrl}/auth/callback?token_hash=${session.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(nextPath)}`
      }
    });
  } catch (error) {
    console.error('Error in WeChat OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const redirectUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${redirectUrl}/settings?wechat_bind=error&message=${encodeURIComponent(errorMessage)}`
      }
    });
  }
});

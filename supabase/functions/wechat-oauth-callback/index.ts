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

    const userId = state;

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('wechat_appid, wechat_appsecret')
      .eq('id', userId)
      .single();

    if (!profile?.wechat_appid) {
      throw new Error('WeChat not configured');
    }

    // 通过 code 换取 access_token 和 openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${profile.wechat_appid}&secret=${profile.wechat_appsecret}&code=${code}&grant_type=authorization_code`;
    
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

    let finalUserId = userId;
    let isNewUser = false;

    // 如果 state 是 'register'，表示是注册流程
    if (state === 'register') {
      if (existingMapping?.system_user_id) {
        // 该微信已绑定账号，提示用户
        const redirectUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${redirectUrl}/auth?wechat_error=already_bound`
          }
        });
      }

      // 创建新用户（使用微信昵称作为邮箱前缀）
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

      if (signUpError) throw signUpError;
      if (!newUser.user) throw new Error('Failed to create user');

      finalUserId = newUser.user.id;
      isNewUser = true;
      console.log('创建新用户成功:', finalUserId);
    } else if (existingMapping) {
      // 登录流程且已有映射，使用已有用户
      finalUserId = existingMapping.system_user_id;
    } else {
      // 登录流程但没有映射，引导去注册
      const redirectUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${redirectUrl}/auth?wechat_error=not_registered`
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

    // 生成登录令牌
    const { data: session, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: `wechat_${tokenData.openid}@temp.youjin365.com`
    });

    if (sessionError) throw sessionError;

    const redirectUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${redirectUrl}/auth/callback?token_hash=${session.properties.hashed_token}&type=magiclink&next=${state === 'register' ? '/settings?wechat_bind=success' : '/'}`
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

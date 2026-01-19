import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(): Promise<string | null> {
  const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
  const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
  const appId = Deno.env.get('WECHAT_APP_ID');
  const appSecret = Deno.env.get('WECHAT_APP_SECRET');

  if (!proxyUrl || !proxyToken || !appId || !appSecret) {
    console.error('Missing WeChat configuration');
    return null;
  }

  try {
    const baseUrl = proxyUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/wechat/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proxyToken}`,
      },
      body: JSON.stringify({ appid: appId, secret: appSecret }),
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Get user's WeChat mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('wechat_user_mappings')
      .select('openid, subscribe_status')
      .eq('system_user_id', userId)
      .maybeSingle();

    if (mappingError) {
      console.error('Error fetching mapping:', mappingError);
      return new Response(
        JSON.stringify({ subscribed: false, error: 'Failed to fetch mapping' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!mapping) {
      // User hasn't linked WeChat
      return new Response(
        JSON.stringify({ subscribed: false, linked: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get real-time subscribe status from WeChat API
    const accessToken = await getAccessToken();
    if (!accessToken) {
      // Return cached status if can't get token
      return new Response(
        JSON.stringify({ 
          subscribed: mapping.subscribe_status === true, 
          linked: true,
          cached: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call WeChat API to get user info
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL')!.replace(/\/$/, '');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN')!;

    const userInfoResp = await fetch(`${proxyUrl}/wechat-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proxyToken}`,
      },
      body: JSON.stringify({
        target_url: `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${mapping.openid}&lang=zh_CN`,
        method: 'GET',
      }),
    });

    const userInfo = await userInfoResp.json();
    const subscribed = userInfo.subscribe === 1;

    // Update database with latest status and user info
    const mappingUpdate: Record<string, unknown> = {
      subscribe_status: subscribed,
      updated_at: new Date().toISOString(),
    };
    
    // 如果获取到有效的昵称头像，也一并更新
    if (userInfo.nickname && userInfo.nickname !== '微信用户' && userInfo.nickname !== '') {
      mappingUpdate.nickname = userInfo.nickname;
    }
    if (userInfo.headimgurl) {
      mappingUpdate.avatar_url = userInfo.headimgurl;
    }
    
    await supabase
      .from('wechat_user_mappings')
      .update(mappingUpdate)
      .eq('openid', mapping.openid);

    // 同时更新 profiles 表（如果缺少信息）
    if (subscribed && userInfo.nickname && userInfo.nickname !== '微信用户') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      const profileUpdate: Record<string, unknown> = {};
      if (!profile?.display_name || profile.display_name === '微信用户') {
        profileUpdate.display_name = userInfo.nickname;
      }
      if (!profile?.avatar_url && userInfo.headimgurl) {
        profileUpdate.avatar_url = userInfo.headimgurl;
      }

      if (Object.keys(profileUpdate).length > 0) {
        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId);
        
        console.log('Updated profile with WeChat info:', userId);
      }
    }

    return new Response(
      JSON.stringify({ 
        subscribed, 
        linked: true,
        nickname: userInfo.nickname,
        avatar_url: userInfo.headimgurl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking subscribe status:', error);
    return new Response(
      JSON.stringify({ subscribed: false, error: 'Internal error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

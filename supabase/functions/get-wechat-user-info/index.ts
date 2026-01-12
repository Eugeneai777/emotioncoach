import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 获取微信 access_token
async function getAccessToken(): Promise<string> {
  const appId = Deno.env.get('WECHAT_APPID');
  const appSecret = Deno.env.get('WECHAT_APPSECRET');
  const proxyServer = Deno.env.get('WECHAT_PROXY_SERVER');
  
  if (!appId || !appSecret) {
    throw new Error('Missing WeChat configuration');
  }

  let tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  
  // 如果配置了代理服务器，通过代理获取
  if (proxyServer) {
    tokenUrl = `${proxyServer}/wechat-token?appid=${appId}&secret=${appSecret}`;
  }

  const response = await fetch(tokenUrl);
  const data = await response.json();
  
  if (data.errcode) {
    throw new Error(`WeChat token error: ${data.errmsg}`);
  }
  
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { openId } = await req.json();

    if (!openId) {
      throw new Error('缺少 openId');
    }

    // 获取 access_token
    const accessToken = await getAccessToken();
    
    // 调用微信用户信息 API（服务号/公众号关注用户）
    const userInfoUrl = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openId}&lang=zh_CN`;
    
    const proxyServer = Deno.env.get('WECHAT_PROXY_SERVER');
    let response;
    
    if (proxyServer) {
      // 通过代理服务器获取用户信息
      response = await fetch(`${proxyServer}/wechat-user-info?access_token=${accessToken}&openid=${openId}&lang=zh_CN`);
    } else {
      response = await fetch(userInfoUrl);
    }
    
    const userInfo = await response.json();
    
    if (userInfo.errcode) {
      console.error('WeChat user info error:', userInfo);
      // 返回默认值而不是抛出错误
      return new Response(JSON.stringify({
        success: true,
        nickname: null,
        avatar_url: null,
        subscribe: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      nickname: userInfo.nickname || null,
      avatar_url: userInfo.headimgurl || null,
      subscribe: userInfo.subscribe || 0 // 是否关注公众号
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('get-wechat-user-info error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '获取用户信息失败',
      nickname: null,
      avatar_url: null
    }), {
      status: 200, // 返回 200 以便前端正常处理
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

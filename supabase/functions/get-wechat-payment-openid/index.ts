import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 用于支付场景的静默授权获取 openId
 * 使用 snsapi_base 授权范围，用户无感知
 * 
 * 两种模式：
 * 1. 生成授权 URL（POST 请求，无 code）
 * 2. 用 code 换取 openId（POST 请求，带 code）
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { redirectUri, code } = body;

    // 模式2：用 code 换取 openId
    if (code) {
      return exchangeCodeForOpenId(code);
    }

    // 模式1：生成授权 URL
    if (redirectUri) {
      return generateAuthUrl(redirectUri);
    }

    return new Response(
      JSON.stringify({ error: 'redirectUri or code is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PaymentOpenId] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * 生成微信静默授权 URL
 * redirect_uri 必须使用微信后台配置的授权域名 wechat.eugenewe.net
 */
function generateAuthUrl(redirectUri: string): Response {
  const appId = Deno.env.get('WECHAT_APP_ID');
  if (!appId) {
    return new Response(
      JSON.stringify({ error: 'WeChat not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 使用微信授权域名 wechat.eugenewe.net 替换原始域名
  // 保留原始路径，添加 payment_auth_callback=1 标记
  const originalUrl = new URL(redirectUri);
  const wechatBaseUrl = 'https://wechat.eugenewe.net';
  const callbackUrl = new URL(originalUrl.pathname, wechatBaseUrl);
  
  // 保留原始查询参数并添加回调标记
  originalUrl.searchParams.forEach((value, key) => {
    callbackUrl.searchParams.set(key, value);
  });
  callbackUrl.searchParams.set('payment_auth_callback', '1');
  
  // state 用于防止 CSRF，简单使用时间戳
  const state = `payment_${Date.now()}`;
  
  // 使用 snsapi_base 静默授权（用户无感知）
  const wechatAuthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(callbackUrl.toString())}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`;

  console.log('[PaymentOpenId] Generated silent auth URL for:', originalUrl.pathname);

  return new Response(
    JSON.stringify({ 
      success: true,
      authUrl: wechatAuthUrl,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * 用授权 code 换取 openId
 */
async function exchangeCodeForOpenId(code: string): Promise<Response> {
  const appId = Deno.env.get('WECHAT_APP_ID');
  const appSecret = Deno.env.get('WECHAT_APP_SECRET');

  if (!appId || !appSecret) {
    console.error('[PaymentOpenId] WeChat credentials not configured');
    return new Response(
      JSON.stringify({ error: 'WeChat not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 用 code 换取 access_token 和 openid
  const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
  
  const tokenResponse = await fetch(tokenUrl);
  const tokenData = await tokenResponse.json();

  if (tokenData.errcode) {
    console.error('[PaymentOpenId] Failed to get access token:', tokenData);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get openId', 
        errcode: tokenData.errcode,
        errmsg: tokenData.errmsg 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const openId = tokenData.openid;
  if (!openId) {
    console.error('[PaymentOpenId] No openid in response');
    return new Response(
      JSON.stringify({ error: 'No openId in response' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('[PaymentOpenId] Successfully obtained openId');

  return new Response(
    JSON.stringify({ 
      success: true,
      openId,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

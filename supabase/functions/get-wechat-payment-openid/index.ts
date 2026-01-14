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
 * 1. 生成授权 URL（POST 请求）
 * 2. 处理授权回调并重定向（GET 请求带 code 参数）
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // 如果有 code 参数，说明是微信回调，处理授权并重定向
  if (code && state) {
    return handleOAuthCallback(code, state);
  }

  // 否则是前端请求生成授权 URL
  if (req.method === 'POST') {
    return generateAuthUrl(req);
  }

  return new Response(
    JSON.stringify({ error: 'Invalid request' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

/**
 * 生成微信静默授权 URL
 */
async function generateAuthUrl(req: Request): Promise<Response> {
  try {
    const { redirectUri } = await req.json();
    
    if (!redirectUri) {
      return new Response(
        JSON.stringify({ error: 'redirectUri is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appId = Deno.env.get('WECHAT_APP_ID');
    if (!appId) {
      return new Response(
        JSON.stringify({ error: 'WeChat not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 构建回调 URL：指向本 Edge Function 自身
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const callbackUrl = `${supabaseUrl}/functions/v1/get-wechat-payment-openid`;
    
    // state 中编码原始的 redirectUri，方便回调时重定向
    const stateData = {
      redirect: redirectUri,
      t: Date.now(), // 防止缓存
    };
    const stateStr = btoa(JSON.stringify(stateData));
    
    // 使用 snsapi_base 静默授权（用户无感知）
    const wechatAuthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=snsapi_base&state=${stateStr}#wechat_redirect`;

    console.log('[PaymentOpenId] Generated silent auth URL');

    return new Response(
      JSON.stringify({ 
        success: true,
        authUrl: wechatAuthUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PaymentOpenId] Error generating auth URL:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 处理微信 OAuth 回调，获取 openId 并重定向回原页面
 */
async function handleOAuthCallback(code: string, state: string): Promise<Response> {
  try {
    // 解析 state 获取原始 redirectUri
    let redirectUri = '/';
    try {
      const stateData = JSON.parse(atob(state));
      redirectUri = stateData.redirect || '/';
    } catch (e) {
      console.warn('[PaymentOpenId] Failed to parse state, using default redirect');
    }

    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      console.error('[PaymentOpenId] WeChat credentials not configured');
      return redirectWithError(redirectUri, 'config_error');
    }

    // 用 code 换取 access_token 和 openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode) {
      console.error('[PaymentOpenId] Failed to get access token:', tokenData);
      return redirectWithError(redirectUri, 'token_error');
    }

    const openId = tokenData.openid;
    if (!openId) {
      console.error('[PaymentOpenId] No openid in response');
      return redirectWithError(redirectUri, 'no_openid');
    }

    console.log('[PaymentOpenId] Successfully obtained openId');

    // 重定向回原页面，URL 中带上 payment_openid 参数
    const redirectUrl = new URL(redirectUri, 'https://wechat.eugenewe.net');
    redirectUrl.searchParams.set('payment_openid', openId);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
      },
    });
  } catch (error) {
    console.error('[PaymentOpenId] Callback error:', error);
    return new Response(
      `<html><body><script>alert('授权失败，请重试');window.location.href='/';</script></body></html>`,
      { 
        status: 200, 
        headers: { 'Content-Type': 'text/html; charset=utf-8' } 
      }
    );
  }
}

/**
 * 重定向并附带错误信息
 */
function redirectWithError(redirectUri: string, error: string): Response {
  const redirectUrl = new URL(redirectUri, 'https://wechat.eugenewe.net');
  redirectUrl.searchParams.set('payment_auth_error', error);
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl.toString(),
    },
  });
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { redirectUri, orderNo } = await req.json();
    
    if (!redirectUri) {
      throw new Error('缺少 redirectUri 参数');
    }

    const appId = Deno.env.get('WECHAT_APP_ID');
    if (!appId) {
      throw new Error('微信配置不完整');
    }

    // 构建微信授权URL - 用于注册场景
    // state 参数携带 register 标识和订单号
    const state = orderNo ? `register_${orderNo}` : 'register';
    const scope = 'snsapi_userinfo'; // 需要获取用户信息用于注册
    
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;

    console.log('Generated WeChat register URL:', { appId, redirectUri, state });

    return new Response(
      JSON.stringify({
        success: true,
        url: authUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get WeChat register URL error:', error);
    const errorMessage = error instanceof Error ? error.message : '获取授权链接失败';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

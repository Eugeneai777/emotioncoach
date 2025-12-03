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
    const appId = Deno.env.get('WECHAT_APP_ID');

    if (!appId) {
      console.error('WECHAT_APP_ID not configured');
      return new Response(
        JSON.stringify({ error: '微信登录未配置' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('返回微信 AppID 配置');

    return new Response(
      JSON.stringify({ appId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting WeChat config:', error);
    return new Response(
      JSON.stringify({ error: '获取微信配置失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

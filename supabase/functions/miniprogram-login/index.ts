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
    const { code } = await req.json();
    
    if (!code) {
      throw new Error('缺少 code 参数');
    }

    console.log('MiniProgram login request, code:', code.substring(0, 10) + '...');

    // 获取小程序配置
    const appId = Deno.env.get('WECHAT_MINI_PROGRAM_APP_ID');
    const appSecret = Deno.env.get('WECHAT_MINI_PROGRAM_APP_SECRET');

    if (!appId || !appSecret) {
      console.error('Missing MiniProgram config:', { appId: !!appId, appSecret: !!appSecret });
      throw new Error('小程序配置不完整');
    }

    // 调用微信 jscode2session 接口
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    
    console.log('Calling WeChat jscode2session API...');
    
    const wxResponse = await fetch(wxUrl);
    const wxResult = await wxResponse.json();
    
    console.log('WeChat response:', { 
      openid: wxResult.openid ? wxResult.openid.substring(0, 10) + '...' : null,
      errcode: wxResult.errcode,
      errmsg: wxResult.errmsg
    });

    if (wxResult.errcode) {
      throw new Error(`微信接口错误: ${wxResult.errcode} - ${wxResult.errmsg}`);
    }

    if (!wxResult.openid) {
      throw new Error('未获取到 openid');
    }

    // 返回 openid（不返回 session_key，保证安全）
    return new Response(
      JSON.stringify({
        success: true,
        openid: wxResult.openid,
        // unionid 可能存在（如果小程序绑定了开放平台）
        unionid: wxResult.unionid || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('MiniProgram login error:', error);
    const errorMessage = error instanceof Error ? error.message : '登录失败';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

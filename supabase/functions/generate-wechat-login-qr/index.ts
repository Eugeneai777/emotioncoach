import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 生成随机场景值
function generateSceneStr(): string {
  return `login_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = 'login' } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 获取微信access_token
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

    if (!appId || !appSecret) {
      throw new Error('微信配置缺失');
    }

    // 生成唯一场景值
    const sceneStr = generateSceneStr();
    const expireSeconds = 300; // 5分钟过期

    console.log('生成登录二维码, sceneStr:', sceneStr, 'mode:', mode);

    // 获取access_token（通过代理或直接调用）
    let accessToken: string;
    
    if (proxyUrl && proxyToken) {
      // 通过代理获取access_token
      console.log('使用代理获取access_token, proxyUrl:', proxyUrl);
      const tokenResponse = await fetch(`${proxyUrl}/wechat/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${proxyToken}`,
        },
        body: JSON.stringify({ appid: appId, secret: appSecret }),
      });
      
      const proxyTokenData = await tokenResponse.json();
      console.log('代理返回token数据:', JSON.stringify(proxyTokenData));
      
      if (!tokenResponse.ok || proxyTokenData.errcode) {
        console.error('代理获取token失败:', proxyTokenData);
        throw new Error(`获取access_token失败: ${proxyTokenData.errmsg || tokenResponse.statusText}`);
      }
      
      accessToken = proxyTokenData.access_token;
    } else {
      // 直接调用微信API
      const tokenResponse = await fetch(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
      );
      const directTokenData = await tokenResponse.json();
      
      if (directTokenData.errcode) {
        throw new Error(`获取access_token失败: ${directTokenData.errmsg}`);
      }
      accessToken = directTokenData.access_token;
    }

    // 创建临时带参数二维码
    let qrResponse;
    const qrBody = {
      expire_seconds: expireSeconds,
      action_name: "QR_STR_SCENE",
      action_info: {
        scene: {
          scene_str: sceneStr,
        },
      },
    };

    if (proxyUrl && proxyToken) {
      // 通过代理创建二维码
      qrResponse = await fetch(`${proxyUrl}/wechat/qrcode/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${proxyToken}`,
        },
        body: JSON.stringify({
          access_token: accessToken,
          ...qrBody,
        }),
      });
    } else {
      // 直接调用微信API
      qrResponse = await fetch(
        `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(qrBody),
        }
      );
    }

    const qrData = await qrResponse.json();
    
    if (qrData.errcode) {
      console.error('创建二维码失败:', qrData);
      throw new Error(`创建二维码失败: ${qrData.errmsg}`);
    }

    console.log('二维码创建成功, ticket:', qrData.ticket);

    // 保存场景值到数据库，用于后续验证
    const { error: insertError } = await supabase
      .from('wechat_login_scenes')
      .insert({
        scene_str: sceneStr,
        mode: mode,
        expires_at: new Date(Date.now() + expireSeconds * 1000).toISOString(),
        status: 'pending',
      });

    if (insertError) {
      console.error('保存场景值失败:', insertError);
      // 不阻断流程，继续返回二维码
    }

    // 返回二维码URL
    const qrCodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(qrData.ticket)}`;

    return new Response(
      JSON.stringify({
        success: true,
        qrCodeUrl,
        sceneStr,
        expiresIn: expireSeconds,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('生成登录二维码失败:', error);
    const message = error instanceof Error ? error.message : '生成二维码失败';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

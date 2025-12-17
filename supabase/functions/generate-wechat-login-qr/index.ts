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
    // 重要：微信后台通常要求“IP 白名单”。云函数出口 IP 不固定，直连会报 invalid ip。
    // 因此：只要配置了代理，就必须强制走代理；不再回退到直连。
    const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');

    const getAccessToken = async (): Promise<string> => {
      if (proxyUrl && proxyToken) {
        const base = normalizeBaseUrl(proxyUrl);
        console.log('通过代理获取access_token, proxyUrl:', base);

        // 使用专用 /wechat/token 端点
        const tokenResponse = await fetch(`${base}/wechat/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${proxyToken}`,
          },
          body: JSON.stringify({ appid: appId, secret: appSecret }),
        });

        const text = await tokenResponse.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            `代理获取access_token失败：返回非JSON（HTTP ${tokenResponse.status}）: ${text.slice(0, 200)}`
          );
        }

        if (!tokenResponse.ok) {
          throw new Error(
            `代理获取access_token失败：HTTP ${tokenResponse.status} ${tokenResponse.statusText} ${JSON.stringify(data)}`
          );
        }

        if (data?.access_token) return data.access_token;
        if (data?.errmsg || data?.errcode) {
          throw new Error(`代理获取access_token失败: ${data.errmsg || data.errcode}`);
        }

        throw new Error(`代理返回异常，未包含access_token: ${JSON.stringify(data)}`);
      }

      throw new Error(
        '未配置微信代理（WECHAT_PROXY_URL/WECHAT_PROXY_TOKEN），当前环境直连微信API会触发IP白名单限制（invalid ip）。'
      );
    };

    const accessToken = await getAccessToken();

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

    const qrText = await qrResponse.text();
    let qrData: any;
    try {
      qrData = JSON.parse(qrText);
    } catch {
      throw new Error(`创建二维码失败：返回非JSON: ${qrText.slice(0, 200)}`);
    }
    
    if (!qrResponse.ok || qrData.errcode) {
      console.error('创建二维码失败:', qrData);
      throw new Error(`创建二维码失败: ${qrData.errmsg || qrResponse.statusText}`);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA1 实现
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 生成随机字符串
function generateNonceStr(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('Missing url parameter');
    }

    console.log('[JSSDK] Generating signature for URL:', url);

    // 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取微信配置
    const appId = Deno.env.get('WECHAT_APP_ID')!;
    const appSecret = Deno.env.get('WECHAT_APP_SECRET')!;
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL')!;
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN')!;

    // 1. 获取 access_token（从缓存或微信API）
    let accessToken: string;
    const tokenCacheKey = 'wechat_access_token';
    
    const { data: tokenCache } = await supabase
      .from('cache_store')
      .select('value, expires_at')
      .eq('key', tokenCacheKey)
      .single();

    if (tokenCache && new Date(tokenCache.expires_at) > new Date()) {
      accessToken = tokenCache.value;
      console.log('[JSSDK] Using cached access_token');
    } else {
      // 通过代理获取新的 access_token
      console.log('[JSSDK] Fetching new access_token via proxy');
      
      const tokenResponse = await fetch(`${proxyUrl}/wechat/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${proxyToken}`,
        },
        body: JSON.stringify({
          appid: appId,
          secret: appSecret,
        }),
      });

      const tokenResult = await tokenResponse.json();
      console.log('[JSSDK] Token response:', JSON.stringify(tokenResult));
      
      // 处理代理返回的嵌套数据结构
      const tokenData = tokenResult.data || tokenResult;
      
      if (tokenData.errcode) {
        throw new Error(`WeChat API error: ${tokenData.errmsg}`);
      }
      
      accessToken = tokenData.access_token;
      
      // 缓存 access_token（提前 5 分钟过期）
      const expiresAt = new Date(Date.now() + (tokenData.expires_in - 300) * 1000);
      await supabase
        .from('cache_store')
        .upsert({
          key: tokenCacheKey,
          value: accessToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    }

    // 2. 获取 jsapi_ticket（从缓存或微信API）
    let jsapiTicket: string;
    const ticketCacheKey = 'wechat_jsapi_ticket';
    
    const { data: ticketCache } = await supabase
      .from('cache_store')
      .select('value, expires_at')
      .eq('key', ticketCacheKey)
      .single();

    if (ticketCache && new Date(ticketCache.expires_at) > new Date()) {
      jsapiTicket = ticketCache.value;
      console.log('[JSSDK] Using cached jsapi_ticket');
    } else {
      // 通过代理获取新的 jsapi_ticket
      console.log('[JSSDK] Fetching new jsapi_ticket via proxy');
      
      const ticketUrl = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
      
      const ticketResponse = await fetch(`${proxyUrl}/wechat-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${proxyToken}`,
        },
        body: JSON.stringify({
          target_url: ticketUrl,
        }),
      });

      const ticketResult = await ticketResponse.json();
      console.log('[JSSDK] Ticket response:', JSON.stringify(ticketResult));
      
      // 处理代理返回的嵌套数据结构
      const ticketData = ticketResult.data || ticketResult;
      
      if (ticketData.errcode !== 0) {
        throw new Error(`WeChat ticket API error: ${ticketData.errmsg}`);
      }
      
      jsapiTicket = ticketData.ticket;
      
      // 缓存 jsapi_ticket（提前 5 分钟过期）
      const expiresAt = new Date(Date.now() + (ticketData.expires_in - 300) * 1000);
      await supabase
        .from('cache_store')
        .upsert({
          key: ticketCacheKey,
          value: jsapiTicket,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    }

    // 3. 生成签名
    const nonceStr = generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000);
    
    // 按字典序排列参数
    const signString = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    console.log('[JSSDK] Sign string:', signString);
    
    const signature = await sha1(signString);
    console.log('[JSSDK] Generated signature:', signature);

    return new Response(
      JSON.stringify({
        appId,
        timestamp,
        nonceStr,
        signature,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[JSSDK] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

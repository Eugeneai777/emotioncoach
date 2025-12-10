import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract user ID from authenticated JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 使用系统级配置的 AppID 和 AppSecret (Supabase Secrets)
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      throw new Error('System WeChat configuration not found. Please configure WECHAT_APP_ID and WECHAT_APP_SECRET in Supabase Secrets.');
    }

    // 优先使用系统级代理配置 (Supabase Secrets)
    const systemProxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const systemProxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    
    let response;
    let data;

    // 如果配置了系统级代理，则通过代理调用
    if (systemProxyUrl) {
      console.log('Using system proxy server for WeChat API call:', systemProxyUrl);
      
      const proxyUrl = `${systemProxyUrl}/wechat-proxy`;
      const proxyHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (systemProxyToken) {
        proxyHeaders['Authorization'] = `Bearer ${systemProxyToken}`;
      }
      
      response = await fetch(proxyUrl, {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify({
          target_url: tokenUrl,
          method: 'GET',
        }),
      });
      
      data = await response.json();
      
      // 检查代理返回的数据结构
      if (data.data) {
        data = data.data; // 代理服务器可能包装了响应
      }
    } else {
      // 直接调用微信 API
      console.log('Direct call to WeChat API (no proxy configured)');
      response = await fetch(tokenUrl);
      data = await response.json();
    }

    if (data.errcode) {
      throw new Error(`WeChat API error: ${data.errmsg || 'Unknown error'}`);
    }

    console.log('获取 access_token 成功, expires_in:', data.expires_in);

    return new Response(
      JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting WeChat access token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

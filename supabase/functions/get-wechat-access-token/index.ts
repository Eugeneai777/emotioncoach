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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('wechat_appid, wechat_appsecret, wechat_proxy_enabled, wechat_proxy_url, wechat_proxy_auth_token')
      .eq('id', userId)
      .single();

    if (error || !profile?.wechat_appid || !profile?.wechat_appsecret) {
      throw new Error('WeChat configuration not found');
    }

    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${profile.wechat_appid}&secret=${profile.wechat_appsecret}`;
    
    let response;
    let data;

    // Check if proxy is enabled
    if (profile.wechat_proxy_enabled && profile.wechat_proxy_url) {
      console.log('Using proxy server for WeChat API call');
      
      // Call through proxy
      const proxyUrl = `${profile.wechat_proxy_url}/wechat-proxy`;
      const proxyHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (profile.wechat_proxy_auth_token) {
        proxyHeaders['Authorization'] = `Bearer ${profile.wechat_proxy_auth_token}`;
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
    } else {
      // Direct call to WeChat API
      console.log('Direct call to WeChat API');
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

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 获取用户的企业微信配置
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('wecom_corp_id, wecom_corp_secret')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile');
    }

    const { wecom_corp_id, wecom_corp_secret } = profile;

    if (!wecom_corp_id || !wecom_corp_secret) {
      throw new Error('WeChat Work credentials not configured');
    }

    // 调用企业微信 API 获取 access_token
    const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${wecom_corp_id}&corpsecret=${wecom_corp_secret}`;
    
    console.log('Fetching access_token from WeChat Work API');
    
    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.errcode !== 0) {
      console.error('WeChat Work API error:', data);
      throw new Error(`Failed to get access_token: ${data.errmsg || 'Unknown error'}`);
    }

    console.log('Access token obtained successfully, expires in:', data.expires_in);

    return new Response(
      JSON.stringify({
        success: true,
        access_token: data.access_token,
        expires_in: data.expires_in,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-wecom-access-token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

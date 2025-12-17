import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token } = await req.json();
    
    if (!access_token) {
      return new Response(
        JSON.stringify({ error: '缺少访问令牌' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token and get parent info
    const { data: tokenData, error: tokenError } = await supabase
      .from('teen_access_tokens')
      .select('parent_user_id, teen_nickname, is_active')
      .eq('access_token', access_token)
      .maybeSingle();

    if (tokenError) {
      console.error('Token lookup error:', tokenError);
      return new Response(
        JSON.stringify({ error: '验证失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData || !tokenData.is_active) {
      return new Response(
        JSON.stringify({ error: '链接已失效' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check parent's quota
    const { data: quotaData, error: quotaError } = await supabase
      .from('user_accounts')
      .select('remaining_quota')
      .eq('user_id', tokenData.parent_user_id)
      .single();

    if (quotaError || !quotaData) {
      console.error('Quota check error:', quotaError);
      return new Response(
        JSON.stringify({ error: '账户状态异常' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (quotaData.remaining_quota < 8) {
      return new Response(
        JSON.stringify({ error: '账户余额不足，请联系爸妈充值' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token validated, parent:', tokenData.parent_user_id, 'quota:', quotaData.remaining_quota);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';
    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;

    const teenName = tokenData.teen_nickname || '你';

    // Create realtime session with teen-specific instructions
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview-2024-12-17",
        voice: "shimmer",
        instructions: `你是小星，${teenName}的AI朋友。100%保密，不说教不评判。先理解感受再探索，2-3句简短回复。多用"我懂""嗯嗯"。开场："嗨～我是小星，说什么都可以，我帮你保密💜"`,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        max_response_output_tokens: 150,
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 1200
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Teen realtime session created");

    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl,
      parent_user_id: tokenData.parent_user_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

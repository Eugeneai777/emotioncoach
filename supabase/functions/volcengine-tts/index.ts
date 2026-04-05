import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice_type } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const appId = Deno.env.get('DOUBAO_APP_ID');
    const accessToken = Deno.env.get('DOUBAO_ACCESS_TOKEN');

    if (!appId || !accessToken) {
      throw new Error('DOUBAO_APP_ID or DOUBAO_ACCESS_TOKEN not configured');
    }

    // 火山引擎 TTS V1 HTTP 非流式接口
    const selectedVoice = voice_type || 'zh_female_cancan_mars_bigtts';
    const reqId = crypto.randomUUID();

    console.log(`Generating TTS for: "${text.substring(0, 30)}..." voice=${selectedVoice}`);

    const body = {
      app: {
        appid: appId,
        token: accessToken,
        cluster: "volcano_tts",
      },
      user: {
        uid: "lovable_tts",
      },
      audio: {
        voice_type: selectedVoice,
        encoding: "mp3",
        speed_ratio: 1.0,
        volume_ratio: 1.0,
        pitch_ratio: 1.0,
      },
      request: {
        reqid: reqId,
        text: text,
        text_type: "plain",
        operation: "query",
        with_frontend: 1,
        frontend_type: "unitTson",
      },
    };

    const response = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer;${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Volcengine TTS error:', response.status, errorText);
      throw new Error(`Volcengine TTS error: ${response.status}`);
    }

    const result = await response.json();

    if (result.code !== 3000) {
      console.error('TTS API returned error code:', result.code, result.message);
      throw new Error(`TTS error: ${result.code} - ${result.message}`);
    }

    const audioContent = result.data;

    return new Response(
      JSON.stringify({ audioContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in volcengine-tts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

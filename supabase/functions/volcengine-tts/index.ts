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
    const { text, voice_type, cluster: reqCluster } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const appId = Deno.env.get('DOUBAO_APP_ID');
    const accessToken = Deno.env.get('DOUBAO_ACCESS_TOKEN');

    if (!appId || !accessToken) {
      throw new Error('DOUBAO_APP_ID or DOUBAO_ACCESS_TOKEN not configured');
    }

    // 温柔女声
    const selectedVoice = voice_type || 'zh_female_cancan_mars_bigtts';
    const reqId = crypto.randomUUID();

    console.log(`TTS request: voice=${selectedVoice}, text="${text.substring(0, 30)}..."`);
    console.log(`AppID prefix: ${appId.substring(0, 6)}..., Token prefix: ${accessToken.substring(0, 6)}...`);

    // 判断是否为大模型音色 (bigtts/mega)
    const isMegaVoice = selectedVoice.includes('bigtts') || selectedVoice.includes('mega');
    const cluster = isMegaVoice ? "volcano_mega_tts" : "volcano_tts";
    console.log(`Using cluster: ${cluster} (mega=${isMegaVoice})`);

    // 火山引擎 TTS V1 HTTP 非流式接口
    const body = {
      app: {
        appid: appId,
        token: accessToken,
        cluster: cluster,
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

    // 尝试方式1: V1 API with Bearer;token
    let response = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer;${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    console.log(`V1 API response status: ${response.status}`);

    // 如果V1失败，尝试方式2: 用 X-Api-App-Key / X-Api-Access-Key header
    if (!response.ok) {
      console.log('V1 failed, trying with X-Api headers...');
      response = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-App-Key": appId,
          "X-Api-Access-Key": accessToken,
        },
        body: JSON.stringify(body),
      });
      console.log(`V1 with X-Api headers response status: ${response.status}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('All TTS attempts failed:', errorText);
      throw new Error(`Volcengine TTS error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`TTS response code: ${result.code}, message: ${result.message}`);

    if (result.code !== 3000) {
      throw new Error(`TTS error: ${result.code} - ${result.message}`);
    }

    return new Response(
      JSON.stringify({ audioContent: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in volcengine-tts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

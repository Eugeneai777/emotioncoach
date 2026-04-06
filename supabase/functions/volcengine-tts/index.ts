import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function tryV3TTS(
  appId: string,
  accessToken: string,
  text: string,
  speaker: string,
  resourceId: string,
): Promise<{ ok: boolean; audioBase64?: string; error?: string }> {
  const body = {
    user: { uid: "lovable_tts" },
    req_params: {
      text,
      speaker,
      audio_params: { format: "mp3", sample_rate: 24000 },
    },
  };

  const response = await fetch("https://openspeech.bytedance.com/api/v3/tts/unidirectional", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-App-Id": appId,
      "X-Api-Access-Key": accessToken,
      "X-Api-Resource-Id": resourceId,
      "X-Api-Request-Id": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });

  console.log(`V3 [${resourceId}] status: ${response.status}`);

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`V3 [${resourceId}] failed:`, errText.slice(0, 200));
    return { ok: false, error: errText };
  }

  const responseText = await response.text();
  const audioChunks: string[] = [];

  for (const line of responseText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const chunk = JSON.parse(trimmed);
      if (chunk.code === 20000000) break;
      if (chunk.code === 0 && chunk.data) audioChunks.push(chunk.data);
      if (chunk.code !== 0 && chunk.code !== 20000000) {
        return { ok: false, error: `${chunk.code}: ${chunk.message}` };
      }
    } catch { /* skip */ }
  }

  if (audioChunks.length === 0) return { ok: false, error: 'No audio chunks' };
  return { ok: true, audioBase64: audioChunks.join('') };
}

async function tryV1TTS(
  appId: string,
  accessToken: string,
  text: string,
  voiceType: string,
  cluster: string,
): Promise<{ ok: boolean; audioBase64?: string; error?: string }> {
  const body = {
    app: { appid: appId, token: accessToken, cluster },
    user: { uid: "lovable_tts" },
    audio: { voice_type: voiceType, encoding: "mp3", speed_ratio: 1.0, volume_ratio: 1.0, pitch_ratio: 1.0 },
    request: { reqid: crypto.randomUUID(), text, text_type: "plain", operation: "query", with_frontend: 1, frontend_type: "unitTson" },
  };

  const response = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer;${accessToken}` },
    body: JSON.stringify(body),
  });

  console.log(`V1 [${cluster}] status: ${response.status}`);
  if (!response.ok) {
    const errText = await response.text();
    return { ok: false, error: errText };
  }

  const result = await response.json();
  if (result.code !== 3000) return { ok: false, error: `${result.code}: ${result.message}` };
  return { ok: true, audioBase64: result.data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice_type } = await req.json();
    if (!text) throw new Error('Text is required');

    const appId = Deno.env.get('DOUBAO_APP_ID');
    const accessToken = Deno.env.get('DOUBAO_ACCESS_TOKEN');
    if (!appId || !accessToken) throw new Error('DOUBAO_APP_ID or DOUBAO_ACCESS_TOKEN not configured');

    const selectedVoice = voice_type || 'zh_female_cancan_mars_bigtts';
    const isBigtts = selectedVoice.includes('bigtts') || selectedVoice.includes('mega');
    const appKey = Deno.env.get('DOUBAO_APP_KEY');
    console.log(`Credentials: appId=${appId?.slice(0,6)}..., token=${accessToken?.slice(0,6)}..., appKey=${appKey?.slice(0,6) || 'N/A'}...`);
    // Strategy: Try V3 with multiple resource IDs, then fallback to V1
    const attempts: Array<{ label: string; fn: () => Promise<{ ok: boolean; audioBase64?: string; error?: string }> }> = [];

    // V3 attempts
    const v3Resources = isBigtts
      ? ['seed-tts-2.0', 'seed-tts-1.0', 'seed-tts-1.0-concurr']
      : ['seed-tts-1.0', 'seed-tts-1.0-concurr'];

    for (const rid of v3Resources) {
      attempts.push({
        label: `V3/${rid}`,
        fn: () => tryV3TTS(appId, accessToken, text, selectedVoice, rid),
      });
    }

    // V1 fallback
    const v1Cluster = isBigtts ? 'volcano_mega_tts' : 'volcano_tts';
    attempts.push({
      label: `V1/${v1Cluster}`,
      fn: () => tryV1TTS(appId, accessToken, text, selectedVoice, v1Cluster),
    });

    let lastError = '';
    for (const attempt of attempts) {
      console.log(`Trying ${attempt.label}...`);
      const result = await attempt.fn();
      if (result.ok && result.audioBase64) {
        console.log(`✅ ${attempt.label} succeeded, base64 length: ${result.audioBase64.length}`);
        return new Response(
          JSON.stringify({ audioContent: result.audioBase64 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      lastError = `${attempt.label}: ${result.error}`;
      console.warn(`❌ ${attempt.label} failed`);
    }

    throw new Error(`所有TTS方式均失败。最后错误: ${lastError.slice(0, 200)}`);
  } catch (error) {
    console.error('Error in volcengine-tts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

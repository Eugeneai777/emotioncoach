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

    const selectedVoice = voice_type || 'zh_female_cancan_mars_bigtts';
    console.log(`TTS V3 request: voice=${selectedVoice}, text="${text.substring(0, 50)}..."`);

    // Determine resource ID based on voice type
    // Try multiple resource IDs if one fails
    const isBigtts = selectedVoice.includes('bigtts') || selectedVoice.includes('mega');
    const resourceIds = isBigtts
      ? ['seed-tts-2.0', 'volc.service_type.10029', 'seed-tts-1.0']
      : ['seed-tts-1.0', 'volc.service_type.10029'];

    // V3 HTTP Chunked API (supports bigtts/2.0 voices)
    const body = {
      user: { uid: "lovable_tts" },
      req_params: {
        text: text,
        speaker: selectedVoice,
        audio_params: {
          format: "mp3",
          sample_rate: 24000,
        },
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

    console.log(`V3 response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('V3 TTS failed:', errorText);
      throw new Error(`TTS V3 error: ${response.status} - ${errorText}`);
    }

    // V3 returns chunked JSON lines — collect all audio base64 data
    const responseText = await response.text();
    const audioChunks: string[] = [];
    let lastError: string | null = null;

    for (const line of responseText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const chunk = JSON.parse(trimmed);

        // code 20000000 = final success signal
        if (chunk.code === 20000000) {
          console.log('TTS V3 synthesis complete');
          break;
        }

        // code 0 = normal data chunk
        if (chunk.code === 0 && chunk.data) {
          audioChunks.push(chunk.data);
        }

        // Non-zero code (other than success) = error
        if (chunk.code !== 0 && chunk.code !== 20000000) {
          lastError = `TTS error: ${chunk.code} - ${chunk.message}`;
          console.error(lastError);
        }
      } catch {
        // Skip non-JSON lines
      }
    }

    if (audioChunks.length === 0) {
      throw new Error(lastError || 'No audio data received from TTS V3');
    }

    // Concatenate all base64 audio chunks
    const fullAudioBase64 = audioChunks.join('');
    console.log(`TTS V3 success: ${audioChunks.length} chunks, total base64 length: ${fullAudioBase64.length}`);

    return new Response(
      JSON.stringify({ audioContent: fullAudioBase64 }),
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

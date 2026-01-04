import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 预设音效提示词
const SOUND_PROMPTS: Record<string, string> = {
  rain: "soft rain falling on leaves, gentle pitter-patter, calming ambience for meditation",
  stream: "gentle stream flowing over smooth rocks in a peaceful forest, relaxing water sounds",
  ocean: "calm ocean waves gently rolling onto sandy beach, relaxing and peaceful",
  forest: "peaceful forest morning with birds chirping softly, gentle breeze through trees",
  fire: "cozy crackling fireplace, warm wood fire burning, relaxing ambient sounds",
  wind: "gentle breeze through bamboo forest, peaceful rustling leaves, calming nature sounds",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { soundType } = await req.json();
    
    if (!soundType || !SOUND_PROMPTS[soundType]) {
      return new Response(
        JSON.stringify({ error: 'Invalid sound type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 检查缓存
    const fileName = `ambient-${soundType}.mp3`;
    const { data: existingFile } = await supabase.storage
      .from('ambient-sounds')
      .createSignedUrl(fileName, 3600); // 1小时有效

    if (existingFile?.signedUrl) {
      console.log(`Using cached audio for ${soundType}`);
      return new Response(
        JSON.stringify({ audioUrl: existingFile.signedUrl, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 调用 ElevenLabs Sound Effects API
    console.log(`Generating new audio for ${soundType}`);
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: SOUND_PROMPTS[soundType],
        duration_seconds: 22, // ElevenLabs 最长支持 22 秒
        prompt_influence: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    // 保存到 Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('ambient-sounds')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // 即使上传失败，也返回音频（但不缓存）
    }

    // 获取签名 URL
    const { data: signedUrl } = await supabase.storage
      .from('ambient-sounds')
      .createSignedUrl(fileName, 3600);

    return new Response(
      JSON.stringify({ 
        audioUrl: signedUrl?.signedUrl || null, 
        cached: false,
        message: 'Audio generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in elevenlabs-sfx function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

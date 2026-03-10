import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { day_number } = await req.json();

    if (!day_number) {
      throw new Error('day_number is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the meditation script from DB
    const { data: meditation, error: fetchError } = await supabase
      .from('stress_meditations')
      .select('*')
      .eq('day_number', day_number)
      .eq('camp_type', 'emotion_stress_7')
      .single();

    if (fetchError || !meditation) {
      throw new Error(`Meditation not found for day ${day_number}`);
    }

    if (meditation.audio_url) {
      return new Response(
        JSON.stringify({ message: 'Audio already exists', audio_url: meditation.audio_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating TTS for day ${day_number}: ${meditation.title}`);

    // Clean the script: remove parenthetical stage directions, keep pauses as "..."
    const cleanScript = meditation.script
      .replace(/（停顿\d*秒?）/g, '...')
      .replace(/（停顿）/g, '...')
      .replace(/……/g, '...');

    // Use ElevenLabs TTS with Brian (warm Chinese male voice)
    const voiceId = 'nPczCjzI2devNBz1zQrb'; // Brian
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanScript,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 0.85, // Slower for meditation
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const fileName = `day-${day_number}.mp3`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('stress-meditations')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload audio');
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('stress-meditations')
      .getPublicUrl(fileName);

    const audioUrl = publicUrl.publicUrl;

    // Update DB with audio URL
    const { error: updateError } = await supabase
      .from('stress_meditations')
      .update({ audio_url: audioUrl, updated_at: new Date().toISOString() })
      .eq('id', meditation.id);

    if (updateError) {
      console.error('DB update error:', updateError);
    }

    console.log(`✅ Audio generated for day ${day_number}: ${audioUrl}`);

    return new Response(
      JSON.stringify({ success: true, audio_url: audioUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-stress-meditation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

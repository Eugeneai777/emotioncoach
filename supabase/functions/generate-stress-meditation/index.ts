import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
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

    // Use OpenAI TTS with shimmer voice (soft, calm female) at half speed
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: cleanScript,
        voice: 'shimmer',
        speed: 0.7,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      throw new Error(`OpenAI TTS API error: ${response.status}`);
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

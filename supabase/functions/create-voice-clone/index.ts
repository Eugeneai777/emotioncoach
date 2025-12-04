import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { audio_storage_path, voice_name } = await req.json();
    
    if (!audio_storage_path) {
      throw new Error('No audio storage path provided');
    }

    console.log('Downloading audio from storage:', audio_storage_path);

    // Download audio from storage
    const { data: audioData, error: downloadError } = await supabaseClient.storage
      .from('voice-recordings')
      .download(audio_storage_path);

    if (downloadError || !audioData) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download audio file');
    }

    console.log('Audio downloaded, size:', audioData.size);

    // Create FormData for ElevenLabs API
    const formData = new FormData();
    formData.append('files', audioData, 'voice_sample.webm');
    formData.append('name', voice_name || `User_${user.id.slice(0, 8)}_Voice`);
    formData.append('remove_background_noise', 'true');

    console.log('Creating voice clone with ElevenLabs...');

    // Call ElevenLabs API to create voice clone
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const voiceId = result.voice_id;

    console.log('Voice clone created successfully:', voiceId);

    // Save voice clone info to database
    const { error: upsertError } = await supabaseClient
      .from('user_voice_clones')
      .upsert({
        user_id: user.id,
        elevenlabs_voice_id: voiceId,
        voice_name: voice_name || `我的声音`,
        sample_storage_path: audio_storage_path,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      throw new Error('Failed to save voice clone info');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        voice_id: voiceId,
        message: '声音克隆创建成功'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in create-voice-clone:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

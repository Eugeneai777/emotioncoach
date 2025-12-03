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
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { samples } = await req.json();
    
    if (!samples || !Array.isArray(samples) || samples.length < 1) {
      throw new Error('At least 1 voice sample is required');
    }

    console.log(`Creating voice clone for user ${user.id} with ${samples.length} samples`);

    // Update status to creating
    await supabase
      .from('profiles')
      .update({ voice_clone_status: 'creating' })
      .eq('id', user.id);

    // Prepare form data for ElevenLabs
    const formData = new FormData();
    formData.append('name', `user_${user.id.substring(0, 8)}_voice`);
    formData.append('description', 'Panic relief personal voice clone');

    // Convert base64 samples to files
    for (let i = 0; i < samples.length; i++) {
      const base64Data = samples[i].replace(/^data:audio\/\w+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }
      const blob = new Blob([bytes], { type: 'audio/webm' });
      formData.append('files', blob, `sample_${i}.webm`);
    }

    // Call ElevenLabs Instant Voice Cloning API
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      
      // Reset status on failure
      await supabase
        .from('profiles')
        .update({ voice_clone_status: 'none' })
        .eq('id', user.id);
        
      throw new Error(`Voice cloning failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Voice clone created:', result);

    // Save voice ID to profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        cloned_voice_id: result.voice_id,
        voice_clone_status: 'ready'
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to save voice ID');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        voice_id: result.voice_id,
        message: 'Voice clone created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in clone-voice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

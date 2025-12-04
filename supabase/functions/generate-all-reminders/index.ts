import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 32 cognitive reminders
const cognitiveReminders = [
  "你是安全的。这只是身体的一个警报，它会过去的。",
  "慢慢呼吸。吸气...呼气...就是这样。",
  "你的身体正在保护你，即使感觉不舒服，这是正常的反应。",
  "这种感觉会过去的，就像之前每一次一样。",
  "把注意力放在脚底，感受地面的支撑。",
  "你已经度过了很多困难的时刻，这一次也会过去。",
  "数一数周围有几种颜色？",
  "这只是肾上腺素，它会在几分钟内消退。",
  "现在最糟糕的事情不会发生，你的大脑只是在发出虚假警报。",
  "想象一个让你感到平静的地方。",
  "你的身体知道如何恢复平静，相信它。",
  "这不是心脏病，这只是焦虑的感觉。",
  "握紧拳头5秒，然后慢慢松开，感受放松的感觉。",
  "你不会失控的，这只是暂时的感觉。",
  "告诉自己：我正在经历焦虑，但我是安全的。",
  "看看周围，找到5件红色的东西。",
  "你的呼吸可以帮助你，专注于呼吸。",
  "这种感觉虽然不舒服，但不会伤害你。",
  "想想上一次恐慌发作，你是怎么度过的？",
  "你比你想象的更坚强。",
  "把手放在心口，感受它的跳动，它在努力工作。",
  "告诉自己：这会过去的，一切都会好起来的。",
  "你现在能做的最好的事情就是照顾好自己。",
  "想象焦虑像一朵云，它会飘走的。",
  "你不需要对抗这种感觉，只需要让它存在。",
  "回想一个让你感到被爱的时刻。",
  "你的身体正在学习如何应对压力，这是成长。",
  "闻一闻周围的气味，这能帮助你回到当下。",
  "你已经很勇敢了，继续坚持。",
  "这种感觉就像海浪，它会退去的。",
  "你不是一个人，很多人都经历过这种感觉。",
  "深呼吸，你已经做得很好了。"
];

// Preset warm female voice (Sarah from ElevenLabs)
const PRESET_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

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

    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has a cloned voice
    const { data: voiceClone } = await supabase
      .from('user_voice_clones')
      .select('elevenlabs_voice_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const voiceIdToUse = voiceClone?.elevenlabs_voice_id || PRESET_VOICE_ID;
    const isClonedVoice = !!voiceClone?.elevenlabs_voice_id;

    console.log(`Generating all reminders for user ${user.id} with ${isClonedVoice ? 'cloned' : 'preset'} voice ${voiceIdToUse}`);

    const results = [];
    const errors = [];

    // Generate each reminder
    for (let i = 0; i < cognitiveReminders.length; i++) {
      try {
        console.log(`Generating reminder ${i + 1}/32...`);
        
        // Call ElevenLabs TTS API
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceIdToUse}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: cognitiveReminders[i],
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.3,
                use_speaker_boost: true
              }
            }),
          }
        );

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error(`TTS error for reminder ${i}:`, errorText);
          errors.push({ index: i, error: errorText });
          continue;
        }

        // Get audio data
        const audioBuffer = await ttsResponse.arrayBuffer();
        const audioData = new Uint8Array(audioBuffer);

        // Upload to storage
        const storagePath = `${user.id}/reminder_${i}.mp3`;
        const { error: uploadError } = await serviceSupabase.storage
          .from('voice-recordings')
          .upload(storagePath, audioData, {
            contentType: 'audio/mpeg',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for reminder ${i}:`, uploadError);
          errors.push({ index: i, error: uploadError.message });
          continue;
        }

        // Save to database
        const { error: dbError } = await serviceSupabase
          .from('user_voice_recordings')
          .upsert({
            user_id: user.id,
            reminder_index: i,
            storage_path: storagePath,
            duration_seconds: null,
            is_ai_generated: true
          }, {
            onConflict: 'user_id,reminder_index'
          });

        if (dbError) {
          console.error(`Database error for reminder ${i}:`, dbError);
          errors.push({ index: i, error: dbError.message });
          continue;
        }

        results.push({ index: i, success: true });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: unknown) {
        console.error(`Error generating reminder ${i}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ index: i, error: errorMessage });
      }
    }

    console.log(`Completed: ${results.length} success, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        generated: results.length,
        errors: errors.length,
        errorDetails: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-all-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

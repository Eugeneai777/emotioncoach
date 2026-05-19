// supabase/functions/coach-voice-library/index.ts
// 列出可用音色库 + 试听 URL（preset → ElevenLabs preview，cloned → storage signed URL）
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateAccessKey, corsHeaders } from '../_shared/coach-studio-auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { access_key } = (await req.json().catch(() => ({}))) as { access_key?: string };
    if (!validateAccessKey(access_key)) {
      return new Response(JSON.stringify({ error: '访问密钥无效' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const elevenKey = Deno.env.get('ELEVENLABS_API_KEY');

    const { data, error } = await supabase
      .from('coach_voice_clones')
      .select('id, coach_name, gender, source, display_order, description, elevenlabs_voice_id, sample_storage_path, sample_preview_url, created_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;

    const voices = await Promise.all((data || []).map(async (row) => {
      let sample_audio_url: string | null = null;

      if (row.source === 'preset') {
        if (row.sample_preview_url) {
          sample_audio_url = row.sample_preview_url;
        } else if (elevenKey && row.elevenlabs_voice_id) {
          // 首次访问：从 ElevenLabs 拿 preview_url 并回写缓存
          try {
            const r = await fetch(`https://api.elevenlabs.io/v1/voices/${row.elevenlabs_voice_id}`, {
              headers: { 'xi-api-key': elevenKey },
            });
            if (r.ok) {
              const v = await r.json();
              if (v?.preview_url) {
                sample_audio_url = v.preview_url;
                await supabase
                  .from('coach_voice_clones')
                  .update({ sample_preview_url: v.preview_url })
                  .eq('id', row.id);
              }
            }
          } catch (e) {
            console.warn('[library] elevenlabs preview fetch failed', row.id, e);
          }
        }
      } else if (row.source === 'cloned' && row.sample_storage_path) {
        const { data: signed } = await supabase.storage
          .from('voice-recordings')
          .createSignedUrl(row.sample_storage_path, 60 * 60);
        sample_audio_url = signed?.signedUrl || null;
      }

      return {
        id: row.id,
        coach_name: row.coach_name,
        gender: row.gender,
        source: row.source,
        display_order: row.display_order,
        description: row.description,
        sample_audio_url,
      };
    }));

    return new Response(JSON.stringify({ voices }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[coach-voice-library]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

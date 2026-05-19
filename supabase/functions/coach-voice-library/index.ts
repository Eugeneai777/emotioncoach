// supabase/functions/coach-voice-library/index.ts
// 列出可用音色库 + 试听 URL
// preset: 优先用缓存 sample_storage_path → 否则用 Doubao 按需合成中文 demo → 上传 storage → 回写缓存
// cloned: 走 ElevenLabs preview_url 或 storage 用户录音
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateAccessKey, corsHeaders } from '../_shared/coach-studio-auth.ts';
import { synthesizeDoubaoMp3 } from '../_shared/doubao-tts.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const DEMO_MALE =
  '兄弟，状态校准这件事，三十几岁之后，比拼命更重要。今晚做一件事，给自己留一份预警雷达。';
const DEMO_FEMALE =
  '姐妹，最近的状态我看见了。你不是不够好，是太久没把自己放在前面。今晚，给自己留一个温柔的小动作。';

async function getOrBuildPresetPreview(row: {
  id: string;
  gender: string | null;
  doubao_voice_type: string | null;
  sample_storage_path: string | null;
}): Promise<string | null> {
  // 已有缓存
  if (row.sample_storage_path) {
    const { data } = await supabase.storage
      .from('voice-recordings')
      .createSignedUrl(row.sample_storage_path, 60 * 60 * 24);
    if (data?.signedUrl) return data.signedUrl;
  }

  if (!row.doubao_voice_type) return null;

  try {
    const text = row.gender === 'male' ? DEMO_MALE : DEMO_FEMALE;
    const { mp3 } = await synthesizeDoubaoMp3(text, row.doubao_voice_type);
    const path = `coach-studio/previews/${row.id}.mp3`;
    const { error: upErr } = await supabase.storage
      .from('voice-recordings')
      .upload(path, mp3, { contentType: 'audio/mpeg', upsert: true });
    if (upErr) {
      console.warn('[library] upload preview failed', row.id, upErr.message);
      return null;
    }
    await supabase
      .from('coach_voice_clones')
      .update({ sample_storage_path: path, sample_preview_url: null })
      .eq('id', row.id);

    const { data } = await supabase.storage
      .from('voice-recordings')
      .createSignedUrl(path, 60 * 60 * 24);
    return data?.signedUrl || null;
  } catch (e) {
    console.warn('[library] doubao synth failed for', row.id, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { access_key } = (await req.json().catch(() => ({}))) as { access_key?: string };
    if (!validateAccessKey(access_key)) {
      return new Response(JSON.stringify({ error: '访问密钥无效' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const elevenKey = Deno.env.get('ELEVENLABS_API_KEY');

    const { data, error } = await supabase
      .from('coach_voice_clones')
      .select('id, coach_name, gender, source, display_order, description, elevenlabs_voice_id, doubao_voice_type, sample_storage_path, sample_preview_url, created_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;

    const voices = await Promise.all((data || []).map(async (row) => {
      let sample_audio_url: string | null = null;

      if (row.source === 'preset') {
        sample_audio_url = await getOrBuildPresetPreview(row);
      } else if (row.source === 'cloned') {
        if (row.sample_storage_path) {
          const { data: signed } = await supabase.storage
            .from('voice-recordings')
            .createSignedUrl(row.sample_storage_path, 60 * 60);
          sample_audio_url = signed?.signedUrl || null;
        } else if (row.sample_preview_url) {
          sample_audio_url = row.sample_preview_url;
        } else if (elevenKey && row.elevenlabs_voice_id) {
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

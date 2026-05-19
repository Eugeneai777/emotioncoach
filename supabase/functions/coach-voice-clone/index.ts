// supabase/functions/coach-voice-clone/index.ts
// 教练上传样本 → ElevenLabs voice clone → 入库
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateAccessKey, corsHeaders } from '../_shared/coach-studio-auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { access_key, coach_name, gender, audio_base64, audio_mime } = body || {};

    if (!validateAccessKey(access_key)) {
      return new Response(JSON.stringify({ error: '访问密钥无效' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!coach_name || !gender || !['male','female'].includes(gender) || !audio_base64) {
      return new Response(JSON.stringify({ error: '参数缺失：coach_name / gender / audio_base64' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1) 上传样本到 storage
    const audioBytes = Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0));
    const ext = (audio_mime || 'audio/webm').includes('mp3') ? 'mp3' : (audio_mime || 'audio/webm').includes('wav') ? 'wav' : 'webm';
    const samplePath = `coach-studio/samples/${coach_name}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('voice-recordings').upload(samplePath, audioBytes, { contentType: audio_mime || 'audio/webm', upsert: true });
    if (upErr) throw new Error(`样本上传失败: ${upErr.message}`);

    // 2) 调 ElevenLabs 克隆
    const form = new FormData();
    form.append('files', new Blob([audioBytes], { type: audio_mime || 'audio/webm' }), `${coach_name}.${ext}`);
    form.append('name', `coach_${coach_name}_${Date.now()}`);
    form.append('remove_background_noise', 'true');

    const elResp = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: form,
    });
    if (!elResp.ok) {
      const errTxt = await elResp.text();
      throw new Error(`ElevenLabs 克隆失败 ${elResp.status}: ${errTxt}`);
    }
    const { voice_id } = await elResp.json();

    // 3) upsert 入库（同名+source=cloned 唯一）
    const { data: row, error: dbErr } = await supabase
      .from('coach_voice_clones')
      .upsert({
        coach_name,
        gender,
        source: 'cloned',
        elevenlabs_voice_id: voice_id,
        sample_storage_path: samplePath,
        display_order: 10, // 教练真人优先展示
        is_active: true,
      }, { onConflict: 'coach_name,source' })
      .select('id, coach_name, gender, source')
      .single();
    if (dbErr) throw new Error(`入库失败: ${dbErr.message}`);

    return new Response(JSON.stringify({ success: true, clone: row, voice_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[coach-voice-clone]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

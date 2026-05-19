// supabase/functions/coach-voice-generate/index.ts
// 生成跟进语音：Doubao 中文 TTS（preset）/ ElevenLabs（cloned 兜底）→ 上传 storage → 返回 signed URL
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { validateAccessKey, corsHeaders } from '../_shared/coach-studio-auth.ts';
import { synthesizeDoubaoMp3 } from '../_shared/doubao-tts.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { access_key, voice_clone_id, template_key, hook_type, text_content, created_by_label } = await req.json();
    if (!validateAccessKey(access_key)) {
      return new Response(JSON.stringify({ error: '访问密钥无效' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!voice_clone_id || !template_key || !hook_type || !text_content) {
      return new Response(JSON.stringify({ error: '参数缺失：voice_clone_id / template_key / hook_type / text_content' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!['direct399', 'communityNurture'].includes(hook_type)) {
      return new Response(JSON.stringify({ error: 'hook_type 必须是 direct399 或 communityNurture' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (text_content.length > 2000) {
      return new Response(JSON.stringify({ error: '文本超长（>2000 字）' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: clone, error: cloneErr } = await supabase
      .from('coach_voice_clones')
      .select('id, coach_name, source, elevenlabs_voice_id, doubao_voice_type, is_active')
      .eq('id', voice_clone_id)
      .single();
    if (cloneErr || !clone) throw new Error('音色不存在');
    if (!clone.is_active) throw new Error('音色已禁用');

    // === 合成 mp3 ===
    let mp3: Uint8Array;
    if (clone.doubao_voice_type) {
      const r = await synthesizeDoubaoMp3(text_content, clone.doubao_voice_type);
      mp3 = r.mp3;
    } else if (clone.elevenlabs_voice_id) {
      // cloned 音色（用户上传录音）走 ElevenLabs 兜底
      const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
      if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY 未配置（克隆音色需要）');
      const ttsResp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${clone.elevenlabs_voice_id}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text_content,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.65, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true, speed: 1.0 },
          }),
        }
      );
      if (!ttsResp.ok) throw new Error(`ElevenLabs TTS 失败 ${ttsResp.status}: ${(await ttsResp.text()).slice(0, 200)}`);
      mp3 = new Uint8Array(await ttsResp.arrayBuffer());
    } else {
      throw new Error('该音色未配置 doubao_voice_type 或 elevenlabs_voice_id');
    }

    // === 上传 + 入库 + Signed URL ===
    const generationId = crypto.randomUUID();
    const audioPath = `coach-studio/generated/${generationId}.mp3`;
    const { error: upErr } = await supabase.storage
      .from('voice-recordings')
      .upload(audioPath, mp3, { contentType: 'audio/mpeg', upsert: false });
    if (upErr) throw new Error(`音频上传失败: ${upErr.message}`);

    const { data: gen, error: genErr } = await supabase
      .from('coach_voice_generations')
      .insert({
        id: generationId,
        voice_clone_id,
        coach_name: clone.coach_name,
        template_key,
        hook_type,
        text_content,
        audio_storage_path: audioPath,
        created_by_label: created_by_label || null,
      })
      .select('id, created_at')
      .single();
    if (genErr) throw new Error(`记录入库失败: ${genErr.message}`);

    const { data: signed, error: signErr } = await supabase.storage
      .from('voice-recordings')
      .createSignedUrl(audioPath, 60 * 60 * 24);
    if (signErr) throw new Error(`生成签名失败: ${signErr.message}`);

    return new Response(JSON.stringify({
      success: true,
      generation_id: gen.id,
      created_at: gen.created_at,
      audio_url: signed.signedUrl,
      audio_base64: base64Encode(mp3),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[coach-voice-generate]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

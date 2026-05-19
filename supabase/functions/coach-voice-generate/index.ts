// supabase/functions/coach-voice-generate/index.ts
// 生成跟进语音：ElevenLabs TTS → 上传 storage → 返回 signed URL
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { validateAccessKey, corsHeaders } from '../_shared/coach-studio-auth.ts';

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
    if (!['direct399','communityNurture'].includes(hook_type)) {
      return new Response(JSON.stringify({ error: 'hook_type 必须是 direct399 或 communityNurture' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (text_content.length > 2000) {
      return new Response(JSON.stringify({ error: '文本超长（>2000 字）' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1) 查 voice_id（前端不知道真实 ID）
    const { data: clone, error: cloneErr } = await supabase
      .from('coach_voice_clones')
      .select('id, coach_name, elevenlabs_voice_id, is_active')
      .eq('id', voice_clone_id)
      .single();
    if (cloneErr || !clone) throw new Error('音色不存在');
    if (!clone.is_active) throw new Error('音色已禁用');

    // 2) 调 ElevenLabs TTS
    const ttsResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${clone.elevenlabs_voice_id}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text_content,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true, speed: 1.0 },
        }),
      }
    );
    if (!ttsResp.ok) {
      const errTxt = await ttsResp.text();
      throw new Error(`TTS 失败 ${ttsResp.status}: ${errTxt}`);
    }
    const audioBuffer = await ttsResp.arrayBuffer();

    // 3) 上传 storage
    const generationId = crypto.randomUUID();
    const audioPath = `coach-studio/generated/${generationId}.mp3`;
    const { error: upErr } = await supabase.storage
      .from('voice-recordings')
      .upload(audioPath, new Uint8Array(audioBuffer), { contentType: 'audio/mpeg', upsert: false });
    if (upErr) throw new Error(`音频上传失败: ${upErr.message}`);

    // 4) 入库
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

    // 5) 返回 24h Signed URL
    const { data: signed, error: signErr } = await supabase.storage
      .from('voice-recordings')
      .createSignedUrl(audioPath, 60 * 60 * 24);
    if (signErr) throw new Error(`生成签名失败: ${signErr.message}`);

    return new Response(JSON.stringify({
      success: true,
      generation_id: gen.id,
      created_at: gen.created_at,
      audio_url: signed.signedUrl,
      audio_base64: base64Encode(new Uint8Array(audioBuffer)), // 前端可直接播放，避免 signed url 首次延迟
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[coach-voice-generate]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// supabase/functions/coach-voice-history/index.ts
// 最近 50 条生成记录 + 签名 URL
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateAccessKey, corsHeaders } from '../_shared/coach-studio-auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { access_key, limit } = (await req.json().catch(() => ({}))) as { access_key?: string; limit?: number };
    if (!validateAccessKey(access_key)) {
      return new Response(JSON.stringify({ error: '访问密钥无效' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const lim = Math.min(Math.max(1, limit || 50), 100);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('coach_voice_generations')
      .select('id, voice_clone_id, coach_name, template_key, hook_type, text_content, audio_storage_path, duration_seconds, created_by_label, created_at')
      .order('created_at', { ascending: false })
      .limit(lim);
    if (error) throw error;

    const items = await Promise.all((data || []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from('voice-recordings')
        .createSignedUrl(row.audio_storage_path, 60 * 60 * 24);
      return { ...row, audio_url: signed?.signedUrl || null };
    }));

    return new Response(JSON.stringify({ items }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[coach-voice-history]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

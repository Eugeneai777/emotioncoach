// supabase/functions/_shared/coach-studio-auth.ts
// 共享：教练语音工坊访问密钥校验

const DEFAULT_KEY = 'youjin2026sop';

export function validateAccessKey(providedKey: string | null | undefined): boolean {
  const envKey = Deno.env.get('COACH_STUDIO_ACCESS_KEY');
  const validKeys = (envKey || DEFAULT_KEY).split(',').map(k => k.trim()).filter(Boolean);
  return !!providedKey && validKeys.includes(providedKey);
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

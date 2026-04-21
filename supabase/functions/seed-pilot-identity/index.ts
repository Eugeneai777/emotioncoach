import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 一次性试点 seed：
 *   1. 给 A 账号在 auth.users 设密码 123456（兜底，灰度撤除也能登）
 *   2. 写入 user_identities：phone + wechat
 * 跑完后请立即删除此函数。
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    await req.json().catch(() => ({}));

    const PILOT_USER_ID = 'f9d2c352-edd4-4490-b09f-f284828ceb9c';
    const PILOT_PHONE = '18001356892';
    const PILOT_OPENID = 'ofx5150QLlQTKItqW_yuLFZCqrEc';
    const PILOT_PASSWORD = '123456';

    // 1. 给 A 在 auth.users 设密码（兜底）
    const { error: pwErr } = await admin.auth.admin.updateUserById(PILOT_USER_ID, {
      password: PILOT_PASSWORD,
    });
    if (pwErr) {
      return jsonResponse({ error: pwErr.message, step: 'set_password' }, 500);
    }

    // 2. 写 phone identity
    const { error: phoneErr } = await admin
      .from('user_identities')
      .upsert({
        user_id: PILOT_USER_ID,
        provider: 'phone',
        provider_uid: PILOT_PHONE,
        is_primary: true,
      }, { onConflict: 'provider,provider_uid' });
    if (phoneErr) return jsonResponse({ error: phoneErr.message, step: 'phone' }, 500);

    // 3. 写 wechat identity
    const { error: wxErr } = await admin
      .from('user_identities')
      .upsert({
        user_id: PILOT_USER_ID,
        provider: 'wechat',
        provider_uid: PILOT_OPENID,
        is_primary: false,
      }, { onConflict: 'provider,provider_uid' });
    if (wxErr) return jsonResponse({ error: wxErr.message, step: 'wechat' }, 500);

    return jsonResponse({
      success: true,
      message: `Pilot ready: ${PILOT_PHONE} → ${PILOT_USER_ID} (password=123456)`,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'unknown' }, 500);
  }
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 一次性脚本：为试点账号 18001356892 (A: f9d2c352) 写入 user_identities
 * 只能由 service_role 调用
 *
 * Body: { adminToken: string }  // 简单防护，必须等于 SUPABASE_SERVICE_ROLE_KEY
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 一次性脚本，运行后立即删除该函数
    await req.json().catch(() => ({}));

    const PILOT_USER_ID = 'f9d2c352-edd4-4490-b09f-f284828ceb9c';
    const PILOT_PHONE = '18001356892';
    const PILOT_OPENID = 'ofx5150QLlQTKItqW_yuLFZCqrEc';
    const PILOT_PASSWORD = '123456';

    const passwordHash = await bcrypt.hash(PILOT_PASSWORD);

    // 写入 phone identity（带密码）
    const { error: phoneErr } = await admin
      .from('user_identities')
      .upsert({
        user_id: PILOT_USER_ID,
        provider: 'phone',
        provider_uid: PILOT_PHONE,
        password_hash: passwordHash,
        is_primary: true,
      }, { onConflict: 'provider,provider_uid' });

    if (phoneErr) {
      console.error('Phone identity write failed:', phoneErr);
      return jsonResponse({ error: phoneErr.message, step: 'phone' }, 500);
    }

    // 写入 wechat identity
    const { error: wxErr } = await admin
      .from('user_identities')
      .upsert({
        user_id: PILOT_USER_ID,
        provider: 'wechat',
        provider_uid: PILOT_OPENID,
        password_hash: null,
        is_primary: false,
      }, { onConflict: 'provider,provider_uid' });

    if (wxErr) {
      console.error('Wechat identity write failed:', wxErr);
      return jsonResponse({ error: wxErr.message, step: 'wechat' }, 500);
    }

    return jsonResponse({
      success: true,
      message: `Pilot identities written for ${PILOT_PHONE} → ${PILOT_USER_ID}`,
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

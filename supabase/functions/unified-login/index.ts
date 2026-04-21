import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 统一登录 edge function（灰度试点）
 * 支持通过 user_identities 表查找主账号并签发 magic link
 *
 * 灰度名单存储在 app_settings.pilot_unified_login_phones
 * 仅在灰度名单中的手机号才被允许走此链路（双重保险，前端也会判断）
 *
 * Body: { phone: string, password: string, country_code?: string }
 * Returns: { success: true, magicLink: string, tokenHash: string, userId: string }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return jsonResponse({ error: 'phone and password are required' }, 400);
    }

    // 1. 校验灰度名单（双重保险）
    const { data: settingRow } = await admin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'pilot_unified_login_phones')
      .maybeSingle();

    const pilotList: string[] = Array.isArray(settingRow?.setting_value)
      ? settingRow.setting_value as string[]
      : [];

    if (!pilotList.includes(phone)) {
      console.log('[unified-login] Phone not in pilot list:', phone);
      return jsonResponse({ error: 'not_in_pilot' }, 403);
    }

    // 2. 在 user_identities 找匹配
    const { data: identity, error: identityErr } = await admin
      .from('user_identities')
      .select('user_id, password_hash')
      .eq('provider', 'phone')
      .eq('provider_uid', phone)
      .maybeSingle();

    if (identityErr) {
      console.error('[unified-login] Identity lookup failed:', identityErr);
      return jsonResponse({ error: '查询失败' }, 500);
    }

    if (!identity || !identity.password_hash) {
      console.log('[unified-login] Identity not found for phone:', phone);
      return jsonResponse({ error: '手机号或密码错误' }, 401);
    }

    // 3. 校验密码
    const isValid = await bcrypt.compare(password, identity.password_hash);
    if (!isValid) {
      console.log('[unified-login] Password mismatch for phone:', phone);
      return jsonResponse({ error: '手机号或密码错误' }, 401);
    }

    // 4. 拿到主账号 user_id，查它的 auth.users.email
    const { data: userInfo, error: userErr } = await admin.auth.admin.getUserById(identity.user_id);
    if (userErr || !userInfo?.user) {
      console.error('[unified-login] User not found:', userErr);
      return jsonResponse({ error: '账号不存在' }, 404);
    }

    const userEmail = userInfo.user.email;
    if (!userEmail) {
      return jsonResponse({ error: '账号无 email，无法签发 token' }, 500);
    }

    // 5. 用 admin.generateLink 签发 magiclink
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('[unified-login] Generate link failed:', linkErr);
      return jsonResponse({ error: '签发登录令牌失败' }, 500);
    }

    console.log('[unified-login] Login success for user:', identity.user_id);

    return jsonResponse({
      success: true,
      magicLink: linkData.properties.action_link,
      tokenHash: linkData.properties.hashed_token,
      userId: identity.user_id,
    });
  } catch (err) {
    console.error('[unified-login] Unexpected error:', err);
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 统一登录 edge function（一账号多登录方式 - 灰度试点）
 *
 * 流程：
 * 1. 校验灰度名单（pilot_unified_login_phones）
 * 2. 在 user_identities 找 phone → user_id
 * 3. 拿到 user_id 对应的 auth.users.email
 * 4. 用 anon client 调用 signInWithPassword({email, password}) 验证密码
 *    （复用 Supabase 内置密码 hash，最安全）
 * 5. 验证通过后用 service_role 重新签发 magicLink 给前端
 *
 * Body: { phone, password, country_code? }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return jsonResponse({ error: 'phone and password are required' }, 400);
    }

    // 1. 灰度名单校验
    const { data: settingRow } = await admin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'pilot_unified_login_phones')
      .maybeSingle();

    const pilotList: string[] = Array.isArray(settingRow?.setting_value)
      ? settingRow.setting_value as string[]
      : [];

    if (!pilotList.includes(phone)) {
      console.log('[unified-login] phone not in pilot list:', phone);
      return jsonResponse({ error: 'not_in_pilot' }, 403);
    }

    // 2. user_identities 查找
    const { data: identity, error: identityErr } = await admin
      .from('user_identities')
      .select('user_id')
      .eq('provider', 'phone')
      .eq('provider_uid', phone)
      .maybeSingle();

    if (identityErr) {
      console.error('[unified-login] identity lookup failed:', identityErr);
      return jsonResponse({ error: '查询失败' }, 500);
    }
    if (!identity) {
      return jsonResponse({ error: '手机号或密码错误' }, 401);
    }

    // 3. 拿主账号 email
    const { data: userInfo, error: userErr } = await admin.auth.admin.getUserById(identity.user_id);
    if (userErr || !userInfo?.user?.email) {
      console.error('[unified-login] user lookup failed:', userErr);
      return jsonResponse({ error: '账号不存在' }, 404);
    }
    const userEmail = userInfo.user.email;

    // 4. 用 anon client 验证密码（复用 Supabase 内置密码哈希）
    const anon = createClient(supabaseUrl, anonKey);
    const { error: signInErr } = await anon.auth.signInWithPassword({
      email: userEmail,
      password,
    });
    if (signInErr) {
      console.log('[unified-login] password verify failed:', signInErr.message);
      return jsonResponse({ error: '手机号或密码错误' }, 401);
    }

    // 5. 签发 magic link 给前端
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('[unified-login] generate link failed:', linkErr);
      return jsonResponse({ error: '签发登录令牌失败' }, 500);
    }

    console.log('[unified-login] login success for user:', identity.user_id);

    return jsonResponse({
      success: true,
      tokenHash: linkData.properties.hashed_token,
      userId: identity.user_id,
    });
  } catch (err) {
    console.error('[unified-login] unexpected:', err);
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

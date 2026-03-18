import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateServiceRole } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Accept both service role and cron secret (for internal/scheduled calls)
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

    if (!appId || !appSecret) {
      throw new Error('WeChat AppID or AppSecret not configured');
    }

    // Helper to call WeChat API (with optional proxy)
    const fetchWechatApi = async (url: string) => {
      if (proxyUrl) {
        const proxyHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (proxyToken) proxyHeaders['Authorization'] = `Bearer ${proxyToken}`;
        const res = await fetch(`${proxyUrl}/wechat-proxy`, {
          method: 'POST',
          headers: proxyHeaders,
          body: JSON.stringify({ target_url: url, method: 'GET' }),
        });
        const data = await res.json();
        return data.data || data;
      }
      const res = await fetch(url);
      return res.json();
    };

    // 1. Get access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const tokenData = await fetchWechatApi(tokenUrl);
    if (tokenData.errcode) {
      throw new Error(`Failed to get access token: ${tokenData.errmsg}`);
    }
    const accessToken = tokenData.access_token;

    // 2. Paginate through /cgi-bin/user/get to collect all openids
    const allOpenIds: string[] = [];
    let nextOpenId = '';
    let total = 0;

    do {
      const url = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&next_openid=${nextOpenId}`;
      const data = await fetchWechatApi(url);

      if (data.errcode) {
        throw new Error(`WeChat user/get error: ${data.errmsg}`);
      }

      total = data.total || 0;
      const openids = data.data?.openid || [];
      allOpenIds.push(...openids);
      nextOpenId = data.next_openid || '';

      console.log(`[fetch-followers] Fetched ${openids.length}, total so far: ${allOpenIds.length}/${total}`);
    } while (nextOpenId && allOpenIds.length < total);

    console.log(`[fetch-followers] Done. Total followers: ${allOpenIds.length}`);

    return new Response(
      JSON.stringify({ success: true, total: allOpenIds.length, openids: allOpenIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[fetch-followers] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

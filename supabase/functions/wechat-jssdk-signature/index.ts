import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * 微信 JS-SDK 签名接口
 * 用于获取 wx.config 所需的签名参数
 * 
 * 请求参数:
 * - url: 当前页面的完整 URL（不含 hash）
 * 
 * 返回参数:
 * - appId: 微信公众号 AppID
 * - timestamp: 时间戳
 * - nonceStr: 随机字符串
 * - signature: 签名
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing url parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appId = Deno.env.get("WECHAT_APP_ID");
    const appSecret = Deno.env.get("WECHAT_APP_SECRET");
    const proxyUrl = Deno.env.get("WECHAT_PROXY_URL");
    const proxyToken = Deno.env.get("WECHAT_PROXY_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!appId || !appSecret) {
      throw new Error("WECHAT_APP_ID or WECHAT_APP_SECRET not configured");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 获取 access_token（优先从缓存读取）
    const accessToken = await getAccessToken(
      supabase,
      appId,
      appSecret,
      proxyUrl,
      proxyToken
    );

    // 2. 获取 jsapi_ticket（优先从缓存读取）
    const jsapiTicket = await getJsapiTicket(
      supabase,
      accessToken,
      proxyUrl,
      proxyToken
    );

    // 3. 生成签名
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = generateNonceStr();
    const signature = await generateSignature(jsapiTicket, nonceStr, timestamp, url);

    console.log("[JSSDK] Signature generated for URL:", url);

    return new Response(
      JSON.stringify({
        appId,
        timestamp,
        nonceStr,
        signature,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[JSSDK] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * 获取 access_token（带缓存）
 */
async function getAccessToken(
  supabase: any,
  appId: string,
  appSecret: string,
  proxyUrl?: string,
  proxyToken?: string
): Promise<string> {
  const cacheKey = "wechat_access_token";

  // 尝试从缓存获取
  const { data: cached } = await supabase
    .from("cache_store")
    .select("value, expires_at")
    .eq("key", cacheKey)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    console.log("[JSSDK] Using cached access_token");
    return cached.value;
  }

  // 请求新的 access_token
  console.log("[JSSDK] Fetching new access_token");
  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

  let response;
  if (proxyUrl && proxyToken) {
    response = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: proxyToken,
        targetUrl: tokenUrl,
        method: "GET",
      }),
    });
  } else {
    response = await fetch(tokenUrl);
  }

  const result = await response.json();

  if (result.errcode) {
    throw new Error(`Failed to get access_token: ${result.errmsg}`);
  }

  const accessToken = result.access_token;
  const expiresIn = result.expires_in || 7200;

  // 缓存 access_token（提前 5 分钟过期）
  const expiresAt = new Date(Date.now() + (expiresIn - 300) * 1000).toISOString();
  await supabase.from("cache_store").upsert({
    key: cacheKey,
    value: accessToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return accessToken;
}

/**
 * 获取 jsapi_ticket（带缓存）
 */
async function getJsapiTicket(
  supabase: any,
  accessToken: string,
  proxyUrl?: string,
  proxyToken?: string
): Promise<string> {
  const cacheKey = "wechat_jsapi_ticket";

  // 尝试从缓存获取
  const { data: cached } = await supabase
    .from("cache_store")
    .select("value, expires_at")
    .eq("key", cacheKey)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    console.log("[JSSDK] Using cached jsapi_ticket");
    return cached.value;
  }

  // 请求新的 jsapi_ticket
  console.log("[JSSDK] Fetching new jsapi_ticket");
  const ticketUrl = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;

  let response;
  if (proxyUrl && proxyToken) {
    response = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: proxyToken,
        targetUrl: ticketUrl,
        method: "GET",
      }),
    });
  } else {
    response = await fetch(ticketUrl);
  }

  const result = await response.json();

  if (result.errcode !== 0) {
    throw new Error(`Failed to get jsapi_ticket: ${result.errmsg}`);
  }

  const ticket = result.ticket;
  const expiresIn = result.expires_in || 7200;

  // 缓存 jsapi_ticket（提前 5 分钟过期）
  const expiresAt = new Date(Date.now() + (expiresIn - 300) * 1000).toISOString();
  await supabase.from("cache_store").upsert({
    key: cacheKey,
    value: ticket,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return ticket;
}

/**
 * 生成随机字符串
 */
function generateNonceStr(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成 JS-SDK 签名
 * 算法: SHA1(jsapi_ticket=xxx&noncestr=xxx&timestamp=xxx&url=xxx)
 */
async function generateSignature(
  ticket: string,
  nonceStr: string,
  timestamp: number,
  url: string
): Promise<string> {
  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}

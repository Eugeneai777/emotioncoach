import { corsHeaders } from "../_shared/cors.ts";

// Volcengine HMAC-SHA256 Signature (NOT AWS4)
async function hmacSHA256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? key.buffer : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function getDateTimeNow(): string {
  return new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
}

async function getSignatureKey(
  secretKey: string, dateStamp: string, region: string, service: string
): Promise<ArrayBuffer> {
  // Volcengine: NO "AWS4" prefix — use secret key directly
  const kDate = await hmacSHA256(new TextEncoder().encode(secretKey), dateStamp);
  const kRegion = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  return await hmacSHA256(kService, "request");
}

interface SignParams {
  method: string;
  host: string;
  path: string;
  queryString: string;
  body: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
}

async function signVolcengine(params: SignParams): Promise<Record<string, string>> {
  const xDate = getDateTimeNow();
  const dateStamp = xDate.substring(0, 8);

  // Volcengine signed headers: host + x-date (content-type is EXCLUDED)
  const signedHeaders = "host;x-date";
  const canonicalHeaders = `host:${params.host}\nx-date:${xDate}\n`;

  const bodyHash = await sha256Hex(params.body);

  const canonicalRequest = [
    params.method,
    params.path,
    params.queryString,
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${params.region}/${params.service}/request`;
  const stringToSign = [
    "HMAC-SHA256",  // Volcengine uses HMAC-SHA256, NOT AWS4-HMAC-SHA256
    xDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(params.secretAccessKey, dateStamp, params.region, params.service);
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  const authorization = `HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    Authorization: authorization,
    "X-Date": xDate,
  };
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const accessKeyId = Deno.env.get("VOLCENGINE_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("VOLCENGINE_SECRET_ACCESS_KEY");

  if (!accessKeyId || !secretAccessKey) {
    return new Response(
      JSON.stringify({ error: "VOLCENGINE_ACCESS_KEY_ID 或 VOLCENGINE_SECRET_ACCESS_KEY 未配置" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { action, ...params } = await req.json();
    const host = "visual.volcengineapi.com";
    const region = "cn-north-1";
    const service = "cv";

    if (action === "submit") {
      const { image_url, audio_url, resolution } = params;

      if (!image_url || !audio_url) {
        return new Response(
          JSON.stringify({ error: "image_url 和 audio_url 为必填参数" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reqKey = "jimeng_realman_avatar_picture_omni_v15";
      const body = JSON.stringify({
        req_key: reqKey,
        binary_data_base64: [],
        image_urls: [image_url],
        audio_urls: [audio_url],
        logo_info: { add_logo: false },
        extra: JSON.stringify({
          resolution: resolution || 720,
          seed: -1,
        }),
      });

      const queryString = "Action=CVSubmitTask&Version=2022-08-31";
      const path = "/";

      const sigHeaders = await signVolcengine({
        method: "POST",
        host,
        path,
        queryString,
        body,
        accessKeyId,
        secretAccessKey,
        region,
        service,
      });

      const finalHeaders = {
        "Content-Type": "application/json",
        Host: host,
        ...sigHeaders,
      };

      console.log(`[jimeng] submit: image=${image_url.slice(0, 60)}, audio=${audio_url.slice(0, 60)}`);

      const res = await fetch(`https://${host}${path}?${queryString}`, {
        method: "POST",
        headers: finalHeaders,
        body,
      });

      const data = await res.json();
      console.log(`[jimeng] submit response:`, JSON.stringify(data).slice(0, 500));

      if (data.code && data.code !== 10000) {
        return new Response(
          JSON.stringify({ error: `提交失败: ${data.message || data.code}`, detail: data }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle Volcengine ResponseMetadata errors
      if (data.ResponseMetadata?.Error) {
        return new Response(
          JSON.stringify({ error: `提交失败: ${data.ResponseMetadata.Error.Message}`, detail: data }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ task_id: data.data?.task_id, status: "submitted", raw: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "query") {
      const { task_id } = params;

      if (!task_id) {
        return new Response(
          JSON.stringify({ error: "task_id 为必填参数" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = JSON.stringify({
        req_key: "jimeng_realman_avatar_picture_omni_v15",
        task_id,
      });

      const queryString = "Action=CVGetResult&Version=2022-08-31";
      const path = "/";

      const sigHeaders = await signVolcengine({
        method: "POST",
        host,
        path,
        queryString,
        body,
        accessKeyId,
        secretAccessKey,
        region,
        service,
      });

      const finalHeaders = {
        "Content-Type": "application/json",
        Host: host,
        ...sigHeaders,
      };

      const res = await fetch(`https://${host}${path}?${queryString}`, {
        method: "POST",
        headers: finalHeaders,
        body,
      });

      const data = await res.json();
      console.log(`[jimeng] query task=${task_id}:`, JSON.stringify(data).slice(0, 500));

      const respData = data.data || {};
      let status = "unknown";
      if (respData.status === "done" || respData.resp_data) {
        status = "done";
      } else if (respData.status) {
        status = respData.status;
      }

      // Handle error in ResponseMetadata
      if (data.ResponseMetadata?.Error) {
        return new Response(
          JSON.stringify({ error: data.ResponseMetadata.Error.Message, task_id, status: "error", raw: data }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let videoUrl = null;
      if (status === "done" && respData.resp_data) {
        try {
          const parsed = typeof respData.resp_data === "string"
            ? JSON.parse(respData.resp_data)
            : respData.resp_data;
          videoUrl = parsed?.video_url || parsed?.output_video_url || null;
        } catch {
          videoUrl = respData.resp_data;
        }
      }

      return new Response(
        JSON.stringify({ task_id, status, video_url: videoUrl, raw: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "未知 action，支持: submit, query" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[jimeng] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

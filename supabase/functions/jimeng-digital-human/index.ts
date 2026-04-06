import { corsHeaders } from "../_shared/cors.ts";

// AWS V4 Signature helpers using Web Crypto API
async function hmacSHA256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
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

async function getSignatureKey(
  secretKey: string, dateStamp: string, region: string, service: string
): Promise<ArrayBuffer> {
  const kDate = await hmacSHA256(new TextEncoder().encode("AWS4" + secretKey).buffer, dateStamp);
  const kRegion = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  return await hmacSHA256(kService, "aws4_request");
}

interface SignParams {
  method: string;
  host: string;
  path: string;
  queryString: string;
  headers: Record<string, string>;
  body: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
}

async function signV4(params: SignParams): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const signedHeaderKeys = Object.keys(params.headers).map(k => k.toLowerCase()).sort();
  const signedHeaders = signedHeaderKeys.join(";");

  const canonicalHeaders = signedHeaderKeys
    .map(k => `${k}:${params.headers[Object.keys(params.headers).find(h => h.toLowerCase() === k)!].trim()}`)
    .join("\n") + "\n";

  const payloadHash = await sha256Hex(params.body);

  const canonicalRequest = [
    params.method,
    params.path,
    params.queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${params.region}/${params.service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(params.secretAccessKey, dateStamp, params.region, params.service);
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  const authorization = `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    Authorization: authorization,
    "X-Amz-Date": amzDate,
    "X-Content-Sha256": payloadHash,
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

    // Action: submit — 提交数字人视频生成任务
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

      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Host: host,
      };

      const sigHeaders = await signV4({
        method: "POST",
        host,
        path,
        queryString,
        headers: requestHeaders,
        body,
        accessKeyId,
        secretAccessKey,
        region,
        service,
      });

      const finalHeaders = { ...requestHeaders, ...sigHeaders };

      console.log(`[jimeng-digital-human] submit: image=${image_url.slice(0, 60)}, audio=${audio_url.slice(0, 60)}`);

      const res = await fetch(`https://${host}${path}?${queryString}`, {
        method: "POST",
        headers: finalHeaders,
        body,
      });

      const data = await res.json();
      console.log(`[jimeng-digital-human] submit response:`, JSON.stringify(data).slice(0, 500));

      if (data.code && data.code !== 10000) {
        return new Response(
          JSON.stringify({ error: `提交失败: ${data.message || data.code}`, detail: data }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ task_id: data.data?.task_id, status: "submitted", raw: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: query — 查询任务状态
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

      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Host: host,
      };

      const sigHeaders = await signV4({
        method: "POST",
        host,
        path,
        queryString,
        headers: requestHeaders,
        body,
        accessKeyId,
        secretAccessKey,
        region,
        service,
      });

      const finalHeaders = { ...requestHeaders, ...sigHeaders };

      const res = await fetch(`https://${host}${path}?${queryString}`, {
        method: "POST",
        headers: finalHeaders,
        body,
      });

      const data = await res.json();
      console.log(`[jimeng-digital-human] query task=${task_id}:`, JSON.stringify(data).slice(0, 500));

      // Parse status
      const respData = data.data || {};
      let status = "unknown";
      if (respData.status === "done" || respData.resp_data) {
        status = "done";
      } else if (respData.status) {
        status = respData.status; // in_queue, generating, etc.
      }

      let videoUrl = null;
      if (status === "done" && respData.resp_data) {
        try {
          const parsed = typeof respData.resp_data === "string"
            ? JSON.parse(respData.resp_data)
            : respData.resp_data;
          videoUrl = parsed?.video_url || parsed?.output_video_url || null;
        } catch {
          // resp_data may contain video URL directly
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
    console.error("[jimeng-digital-human] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

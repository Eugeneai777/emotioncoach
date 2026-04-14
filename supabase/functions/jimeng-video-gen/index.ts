import { corsHeaders } from "../_shared/cors.ts";

// Volcengine HMAC-SHA256 Signature
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
  const signedHeaders = "host;x-date";
  const canonicalHeaders = `host:${params.host}\nx-date:${xDate}\n`;
  const bodyHash = await sha256Hex(params.body);

  const canonicalRequest = [
    params.method, params.path, params.queryString,
    canonicalHeaders, signedHeaders, bodyHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${params.region}/${params.service}/request`;
  const stringToSign = [
    "HMAC-SHA256", xDate, credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(params.secretAccessKey, dateStamp, params.region, params.service);
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  return {
    Authorization: `HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "X-Date": xDate,
  };
}

const REQ_KEY = "jimeng_ti2v_v30_pro";
const HOST = "visual.volcengineapi.com";
const REGION = "cn-north-1";
const SERVICE = "cv";
const PATH = "/";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const accessKeyId = Deno.env.get("VOLCENGINE_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("VOLCENGINE_SECRET_ACCESS_KEY");

  if (!accessKeyId || !secretAccessKey) {
    return new Response(
      JSON.stringify({ error: "Volcengine 凭证未配置" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { action, ...params } = await req.json();

    if (action === "submit") {
      const { prompt, aspect_ratio = "9:16", duration = 5, image_urls } = params;

      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "prompt 为必填参数" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // frames: 121 = 5s, 241 = 10s
      const frames = duration === 10 ? 241 : 121;

      const submitPayload: Record<string, unknown> = {
        req_key: REQ_KEY,
        prompt,
        aspect_ratio,
        frames,
        seed: -1,
      };

      // Optional: image-to-video with first frame
      if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
        submitPayload.image_urls = image_urls;
      }

      const body = JSON.stringify(submitPayload);
      const queryString = "Action=CVSync2AsyncSubmitTask&Version=2022-08-31";

      const sigHeaders = await signVolcengine({
        method: "POST", host: HOST, path: PATH, queryString, body,
        accessKeyId, secretAccessKey, region: REGION, service: SERVICE,
      });

      console.log(`[jimeng-video] submit: prompt=${prompt.slice(0, 80)}, aspect=${aspect_ratio}, frames=${frames}`);

      const res = await fetch(`https://${HOST}${PATH}?${queryString}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Host: HOST, ...sigHeaders },
        body,
      });

      const data = await res.json();
      console.log(`[jimeng-video] submit response: code=${data?.code}, message=${data?.message}`);

      if (data.ResponseMetadata?.Error) {
        return new Response(
          JSON.stringify({ error: `提交失败: ${data.ResponseMetadata.Error.Message}`, status: "failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (data.code !== 10000 || !data.data?.task_id) {
        return new Response(
          JSON.stringify({ error: `提交失败: ${data.message || "未知错误"}`, status: "failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ task_id: data.data.task_id, status: "submitted" }),
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

      const body = JSON.stringify({ req_key: REQ_KEY, task_id });
      const queryString = "Action=CVSync2AsyncGetResult&Version=2022-08-31";

      const sigHeaders = await signVolcengine({
        method: "POST", host: HOST, path: PATH, queryString, body,
        accessKeyId, secretAccessKey, region: REGION, service: SERVICE,
      });

      const res = await fetch(`https://${HOST}${PATH}?${queryString}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Host: HOST, ...sigHeaders },
        body,
      });

      const data = await res.json();
      const respData = data?.data || {};
      const taskStatus = respData?.status || "unknown";
      const videoUrl = respData?.video_url || respData?.output_video_url || null;

      console.log(`[jimeng-video] query task=${task_id}: code=${data?.code}, status=${taskStatus}`);

      if (data.ResponseMetadata?.Error) {
        return new Response(
          JSON.stringify({ error: data.ResponseMetadata.Error.Message, task_id, status: "failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (data.code !== 10000) {
        return new Response(
          JSON.stringify({ error: data.message || `API 错误 (code: ${data.code})`, task_id, status: "failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ task_id, status: taskStatus, video_url: videoUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "未知 action，支持: submit, query" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[jimeng-video] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

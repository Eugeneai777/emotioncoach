import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MODEL = "openai/gpt-image-2";
const FALLBACK_MODEL = "google/gemini-3-pro-image-preview";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY 未配置");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "未登录" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anon = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anon.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "登录已失效，请重新登录" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { prompt, model } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 2) {
      return new Response(JSON.stringify({ error: "请提供有效的 prompt（至少2个字符）" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callModel = async (m: string) => {
      console.log(`[generate-gpt-image] Calling model: ${m}`);
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
    };

    const requested = (model && typeof model === "string" ? model : DEFAULT_MODEL).trim();
    let usedModel = requested;
    let aiResp = await callModel(requested);

    // Fallback if model not available
    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error(`[generate-gpt-image] ${requested} failed [${aiResp.status}]:`, errText);

      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI 请求频率超限，请稍后重试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度不足，请充值后重试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const looksLikeModelMissing =
        aiResp.status === 400 || aiResp.status === 404 ||
        /model|not.found|unsupported|unknown/i.test(errText);

      if (looksLikeModelMissing && requested !== FALLBACK_MODEL) {
        console.log(`[generate-gpt-image] Falling back to ${FALLBACK_MODEL}`);
        usedModel = FALLBACK_MODEL;
        aiResp = await callModel(FALLBACK_MODEL);
        if (!aiResp.ok) {
          const t2 = await aiResp.text();
          console.error(`[generate-gpt-image] fallback failed:`, t2);
          throw new Error(`AI 调用失败 [${aiResp.status}]: ${t2.slice(0, 300)}`);
        }
      } else {
        throw new Error(`AI 调用失败 [${aiResp.status}]: ${errText.slice(0, 300)}`);
      }
    }

    const aiData = await aiResp.json();
    const imageDataUrl: string | undefined =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      console.error("[generate-gpt-image] No image returned:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("AI 未返回图片数据");
    }

    const match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) throw new Error("无效的图片数据格式");
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = `gpt-image/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("community-images")
      .upload(fileName, bytes, { contentType: `image/${match[1]}`, upsert: false });

    if (uploadErr) {
      console.error("[generate-gpt-image] upload error:", uploadErr);
      throw new Error(`图片上传失败: ${uploadErr.message}`);
    }

    const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        imageUrl: urlData.publicUrl,
        fileName,
        modelUsed: usedModel,
        fellBack: usedModel !== requested,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[generate-gpt-image] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

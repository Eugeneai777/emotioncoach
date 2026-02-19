import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `你是专业的社区帖子排版优化助手。请优化用户的帖子内容排版，使其更易读、美观。

规则：
1. 合理分段，每段不超过 3-4 句话
2. 修正标点符号（如漏掉的句号、逗号）
3. 纠正明显的错别字
4. 在合适的位置添加 1-3 个相关的 Emoji（不要过多）
5. 严格保持原文含义和语气不变
6. 不要添加标题或额外的内容
7. 直接返回优化后的文本，不要任何解释或 markdown 格式`;

async function callAI(content: string): Promise<string> {
  // Try Lovable AI gateway first
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (LOVABLE_API_KEY) {
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content },
          ],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const result = data.choices?.[0]?.message?.content || "";
        if (result) {
          console.log("[beautify-post] Lovable AI success");
          return result;
        }
      } else {
        const errText = await resp.text();
        console.warn("[beautify-post] Lovable AI failed:", resp.status, errText);
      }
    } catch (e) {
      console.warn("[beautify-post] Lovable AI exception:", e);
    }
  }

  // Fallback: OpenAI (proxy or direct)
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const OPENAI_PROXY_URL = Deno.env.get("OPENAI_PROXY_URL");
  if (!OPENAI_API_KEY) {
    throw new Error("AI 服务不可用：未配置备用 API Key");
  }

  const openaiBase = OPENAI_PROXY_URL
    ? OPENAI_PROXY_URL.replace(/\/$/, "")
    : "https://api.openai.com";

  console.log("[beautify-post] Falling back to OpenAI via:", openaiBase);

  const resp = await fetch(`${openaiBase}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("[beautify-post] OpenAI fallback error:", resp.status, errText);
    if (resp.status === 429) throw new Error("rate_limit");
    if (resp.status === 402) throw new Error("quota_exceeded");
    throw new Error("openai_error");
  }

  const data = await resp.json();
  const result = data.choices?.[0]?.message?.content || "";
  console.log("[beautify-post] OpenAI fallback success, length:", result.length);
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "内容不能为空" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[beautify-post] Processing content, length:", content.length);

    let beautified = await callAI(content);

    // 清理可能的 markdown 包裹
    beautified = beautified.replace(/^```[\s\S]*?\n/, "").replace(/\n```$/, "").trim();

    console.log("[beautify-post] Success, output length:", beautified.length);

    return new Response(
      JSON.stringify({ beautified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[beautify-post] Error:", error);
    const msg = error instanceof Error ? error.message : "未知错误";
    const userMsg =
      msg === "rate_limit" ? "AI 请求过于频繁，请稍后再试" :
      msg === "quota_exceeded" ? "AI 额度不足，请联系管理员" :
      "AI 服务暂时不可用，请稍后重试";
    return new Response(
      JSON.stringify({ error: userMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

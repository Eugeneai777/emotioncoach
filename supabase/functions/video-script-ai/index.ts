import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `你是一个专业的短视频口播文案策划专家，擅长撰写抖音/小红书风格的30秒数字人口播剧本。

你的剧本必须严格遵循以下5段叙事结构，并以 JSON 格式输出：

1. **Hook（0-3秒）**：用一个直击痛点的问题或场景开头，0.5秒内抓住注意力。
2. **痛点展开（3-10秒）**：深入描述目标人群的具体痛苦场景，引发强烈共鸣。
3. **产品介绍（10-18秒）**：自然过渡到解决方案，介绍产品/工具的核心价值。
4. **效果展示（18-25秒）**：用具体数据或用户故事展示效果，建立信任感。
5. **互动提问（25-30秒）**：用一个开放性问题结尾，引导观众在评论区互动讨论。

你必须返回严格的 JSON 格式，不要包含任何 markdown 或额外文字。JSON 结构如下：
{
  "script": "完整的口播文案（纯文本，150-250字）",
  "segments": [
    { "type": "hook", "text": "Hook文案", "startSec": 0, "endSec": 3 },
    { "type": "pain", "text": "痛点文案", "startSec": 3, "endSec": 10, "highlight": "关键痛点词" },
    { "type": "product", "text": "产品介绍文案", "startSec": 10, "endSec": 18 },
    { "type": "result", "text": "效果展示文案", "startSec": 18, "endSec": 25 },
    { "type": "question", "text": "互动提问文案", "startSec": 25, "endSec": 30 }
  ],
  "closingQuestion": "结尾提问（简短版，用于大字展示）",
  "closingCta": "行动号召（如：评论区告诉我 👇）"
}

要求：
- 口语化、接地气，像朋友聊天
- 每句话简短有力，适合口播节奏
- script 字段是完整连贯的口播稿
- 每个 segment 的 text 是该段的核心文案
- pain 段必须有 highlight 关键词`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { audience, tool, product } = await req.json();

    if (!audience || !tool || !product) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数：audience, tool, product" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `请为以下场景撰写一段30秒短视频口播剧本：

【目标人群】${audience.emoji} ${audience.label}
【工具场景】${tool.label} — ${tool.description}
【转化产品】${product.label} — ${product.description}

请直接输出 JSON，不需要任何额外说明。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI请求频率超限，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度不足，请充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI服务异常" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from the response (handle possible markdown code blocks)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI JSON:", content);
      return new Response(JSON.stringify({ error: "AI返回格式异常，请重试", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("video-script-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

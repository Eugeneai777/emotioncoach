import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, template } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!template) throw new Error("缺少测评模板数据");
    if (!messages || messages.length === 0) throw new Error("缺少对话消息");

    const systemPrompt = `你是一位专业的心理测评设计专家（劲老师），风格温暖、专业、善于洞察。用户正在编辑一份测评模板，你需要帮助优化。

**当前测评模板（JSON）：**
\`\`\`json
${JSON.stringify(template, null, 2)}
\`\`\`

**你的工作方式：**
1. 如果用户发送"请分析"或类似请求，主动审视当前测评并给出 3-5 条具体优化建议（如题目措辞、维度覆盖、结果描述等）
2. 理解用户的优化需求，给出简要修改说明
3. 然后输出修改后的完整模板 JSON，用 \`\`\`json 和 \`\`\` 包裹

**主动建议维度：**
- 题目质量：是否有歧义、是否过长、措辞是否口语化易懂
- 维度设计：是否覆盖核心方面、各维度题目数是否均衡
- 结果模式：描述是否温暖有力、建议是否可执行
- 计分合理性：正反向计分分布、分数区间是否合理
- AI分析提示词：是否足够引导个性化分析

**重要规则：**
- 始终保持模板结构不变（assessment_key, dimensions, questions, result_patterns 等字段）
- 每次修改后都要返回完整的模板 JSON
- 用温暖专业的语气交流，像一位经验丰富的同事
- 修改说明简洁，控制在 3-5 句话
- 如果用户的修改不合理，礼貌地建议更好的方案`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 服务异常" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("refine-assessment error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

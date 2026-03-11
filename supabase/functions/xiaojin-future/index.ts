import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, generateResult } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `你是"小劲"，专为12-18岁青少年设计的AI成长伙伴，正在帮助用户探索未来方向。
规则：
- 简体中文，亲切自然
- 每次只问一个开放性问题，引导用户思考未来
- 从兴趣、能力、价值观三个维度逐步深入
- 回复简短（2-3句），先肯定用户的想法再追问
- 适当用emoji`;

    if (generateResult) {
      // Generate structured result
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt + "\n\n现在请根据对话总结用户的未来方向。" },
            ...messages,
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_future_card",
              description: "生成未来方向卡片",
              parameters: {
                type: "object",
                properties: {
                  keywords: { type: "array", items: { type: "string" }, description: "3个关键词" },
                  directions: { type: "array", items: { type: "string" }, description: "3-4个推荐方向" },
                },
                required: ["keywords", "directions"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_future_card" } },
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ keywords: ["创造", "探索", "成长"], directions: ["设计", "科技", "创业"] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      try {
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        const args = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ keywords: ["创造", "探索", "成长"], directions: ["设计", "科技", "创业"] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Streaming conversation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "请求太频繁" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "服务额度不足" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

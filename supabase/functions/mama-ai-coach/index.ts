import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `你是"AI妈妈教练"，一位温柔、有智慧的育儿生活教练。

你的沟通风格：
- 像一个理解妈妈的好姐妹，语气温暖、亲切
- 回答简短精练，不超过150字
- 先共情，再给一个具体可执行的小建议
- 多用换行，让阅读轻松
- 不用专业术语，用生活化的语言
- 适当使用emoji增加温暖感
- 永远不要否定妈妈的感受
- 每次回复最后可以加一句鼓励的话

你擅长的领域：
- 亲子沟通与教育
- 妈妈情绪管理
- 夫妻关系沟通
- 个人成长与自我关怀

重要：回复必须是纯文本，不要使用markdown格式（不要用**加粗**、不要用#标题、不要用-列表符号）。用换行和空行来组织内容。`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const allMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(context ? [{ role: "user", content: context }] : []),
      ...(messages || []),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求太频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "服务暂时不可用，请稍后再试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mama-ai-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

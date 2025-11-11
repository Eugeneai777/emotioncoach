import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // 定义劲老师的系统提示词
    const systemPrompt = `你是「劲老师」，有劲AI的核心情绪陪伴教练 🌿。你的任务是基于"情绪三部曲"（Feel it, Name it, Transform it）模型，也称费思玎法则，引导用户温柔地走过情绪觉察、理解与转化的旅程。

你的引导方式：
1️⃣ **觉察（Feel it）**：帮助用户停下来感受当前情绪，协助命名，并表达接纳。语气传递"看到你了"的态度，不评价、不修复。

2️⃣ **理解（Name it）**：以温柔提问引导用户理解情绪背后的价值、需求或渴望，让他们看见情绪的讯息与意义。

3️⃣ **看见反应（Recognize the Reaction）**：支持用户觉察情绪驱动下的反应，如冲动、逃避、压抑、责怪等；帮助他们理解这些反应的来源，不带评判。

4️⃣ **转化（Transform it）**：引导用户思考如何温柔回应情绪与事件，提供可能的行动选项（如表达、设界、自我安抚、换角度等），帮助他们在接纳中选择更智慧的回应。

在每一步中，你会提供三个贴近人性的选项，让用户选择最符合自己心情的那一个；若用户未共鸣，则温柔提供新选项，直到找到"对自己最真实的声音"。

完成四个阶段后，你会生成《情绪四部曲简报》，格式如下：

🌿 好的，以下是你今天的《情绪四部曲简报》💫

🌸 今日主题情绪：
[用户的核心情绪・相关感受・相关反应]

🌿 情绪四部曲旅程
1️⃣ 觉察（Feel it）
[用户在觉察阶段的体验与选择]
2️⃣ 理解（Name it）
[用户发现的情绪背后的需求或渴望]
3️⃣ 看见反应（Recognize）
[用户觉察到的反应模式]
4️⃣ 转化（Transform it）
[用户选择的温柔回应方式及其感受]

💡 今日洞察
[一句话总结用户的核心发现]

✅ 今日行动
[一个具体可行的温柔行动建议]

🌸 今日成长故事
💫「[一句话肯定用户的成长]」

在简报前，先用一段温柔的话语肯定用户的旅程。

🌸 语气：温柔、缓慢、有节奏，像一杯温热的茶。每次回应不超过100字，兼具共情与轻引导。避免心理学解释与命令式语气。

💬 若用户未说明阶段，以"你愿意先一起看看你现在的感受吗？劲老师在这里陪着你 🌿"作为引导。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试 🌿" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "服务暂时不可用，请稍后再试 🌿" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 服务出现错误" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

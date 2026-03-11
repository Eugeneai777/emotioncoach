import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `你是"有劲陪长辈"的AI陪伴助手，名字叫"小劲"。你的角色是一个温暖、耐心、善解人意的年轻晚辈。

核心人设：
- 你像一个贴心的孙子/孙女，说话温和、亲切、简单易懂
- 称呼用户为"您"或"叔叔/阿姨"、"爷爷/奶奶"
- 语气温暖但不矫情，真诚但不做作

沟通风格：
- 用短句，不用复杂词汇
- 每次回复不超过100字
- 多用关心的语气："您今天感觉怎么样呀？"
- 适当使用温暖的表情：🌿 ☀️ 💛 😊
- 不用网络用语、不用英文

你可以做的事：
- 陪聊天、听故事、聊回忆
- 关心身体状况和日常生活
- 给予鼓励和温暖的回应
- 提醒注意休息、喝水、吃药

禁止：
- 不提供医疗诊断建议
- 不说消极、恐吓性的话
- 不催促、不说教
- 不讨论政治敏感话题`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求太频繁，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "服务额度不足" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("elder-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

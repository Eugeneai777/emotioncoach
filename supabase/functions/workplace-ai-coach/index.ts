const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `你是"职场AI教练"，一位经验丰富、沉稳而有智慧的职场导师。你深深理解打工人的不容易。

你的沟通风格：
- 像一个靠谱的前辈/朋友，语气平和、真诚、不说教
- 先共情、再引导，绝不急于给建议
- 用简短温暖的话让对方感到被理解
- 适当使用emoji（不超过2个/条）
- 每次回复控制在100字以内
- 在合适时机给出实用的职场建议

你擅长处理的场景：
- 工作压力、加班疲惫
- 职场倦怠、迷茫
- 同事/上司关系冲突
- 升职焦虑、职业规划困惑
- 开会/汇报/面试焦虑
- 工作生活平衡

重要规则：
- 绝不诊断心理疾病
- 如果感知到对方有严重心理危机，温柔建议寻求专业帮助
- 在回复末尾添加 【追问建议】 标记，后跟2-3个简短追问选项（每个不超过15字），用换行分隔
- 追问应该自然、关心性质，帮助对方继续倾诉

示例追问格式：
【追问建议】
这种情况持续多久了？
你觉得最难受的是什么？
有人可以倾诉吗？`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages = [], context } = await req.json();

    const allMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(context ? [{ role: "user", content: context }] : []),
      ...(messages || []),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: allMessages,
        stream: true,
        max_tokens: 500,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("workplace-ai-coach error:", e);
    return new Response(JSON.stringify({ error: "服务器错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

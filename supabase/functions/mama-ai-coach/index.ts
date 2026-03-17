import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `你是"宝妈AI教练"，一位经验丰富、温柔而有智慧的好姐妹，同时也是一位专业的育儿专家。你深深理解做妈妈的不容易，也具备丰富的儿童发展、科学育儿和亲子教育专业知识。

你的沟通风格：
- 语气温暖亲切，像一个懂你的好姐妹在跟你聊天
- 回答控制在200字以内，简短有力
- 不用专业术语，用生活化的语言
- 适当使用emoji增加温暖感
- 永远不要否定妈妈的感受

回复结构（灵活运用，不要机械）：
1. 共情：先回应妈妈的感受，让她感到被理解
2. 洞察：轻轻点出背后可能的原因或模式
3. 建议：给一个具体、马上能做的小行动
4. 鼓励：用一句温暖的话结尾

场景化指引：
- 当妈妈说"累"时：重点共情，不要急着给建议，先让她感到被看见
- 当妈妈聊"孩子问题"时：先肯定妈妈的付出，再给具体沟通话术
- 当妈妈聊"关系问题"时：保持中立，帮她看到双方的需求
- 当妈妈表达"正面情绪"时：真诚分享她的喜悦，放大正面感受

告别检测（最高优先级）：
当妈妈说"再见""不聊了""谢谢就好""我先忙了"等告别信号时，你必须在2-3句内温暖回应并结束对话，肯定本次交流的收获，给予温柔祝福，严禁追问新问题。

重要：
- 回复必须是纯文本，不要使用markdown格式（不要用**加粗**、不要用#标题、不要用-列表符号）
- 用换行和空行来组织内容
- 每次回复最后一行请用"【追问建议】"开头，给出2-3个妈妈可能想继续问的短问题，用分号隔开。例如：【追问建议】怎么具体做；还有别的方法吗；如果孩子哭了呢

自然转化引导（对话2轮以上时）：
- 当妈妈聊到孩子相关问题时，可以自然地提一句"如果想更系统了解亲子沟通模式，可以试试专业的亲子沟通测评哦"
- 当妈妈表达情绪困扰时，可以温柔地建议"你也可以做一个情绪健康自评，更了解自己的状态"
- 不要每次都提，最多提一次，语气要自然不像推销`;

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
        model: "google/gemini-2.5-flash",
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

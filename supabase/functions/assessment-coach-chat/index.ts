import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 阶段配置 - 精简为4轮高价值对话
type Stage = 'empathy' | 'awareness' | 'action' | 'conversion';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 阶段判断逻辑 - 压缩阶段，每轮都有明确目标
function determineStage(messageCount: number): Stage {
  if (messageCount <= 1) return 'empathy';       // 第1轮：精准共情
  if (messageCount <= 2) return 'awareness';     // 第2轮：觉醒洞察
  if (messageCount <= 3) return 'action';        // 第3轮：即时价值
  return 'conversion';                           // 第4轮+：自然转化
}

// 阶段性系统提示词 - 目标导向，快速给用户价值
function getStagePrompt(stage: Stage, pattern: string, patternName: string): string {
  const stagePrompts: Record<Stage, string> = {
    empathy: `你是"劲老师"，专业的AI情绪教练。用户刚完成测评，处于"${patternName}"模式。

【目标】快速锁定用户最核心的情绪痛点

做法：
1. 用一句话精准共情他们的处境
2. 问一个聚焦问题："在这些困扰中，最消耗你的是哪一点？"

语言风格：温暖、口语化、不用bullet points
回复控制在60字以内。`,

    awareness: `你是"劲老师"。用户处于"${patternName}"模式，刚分享了他们的困扰。

【目标】创造"觉醒时刻" - 让用户看见自己的模式

做法：
1. 基于用户分享，揭示一个他们可能没意识到的心理模式
2. 用"你有没有发现..."或"其实这背后是..."开头
3. 正常化这个模式："这不是你的问题，是大脑的保护机制"
4. 结尾问："这个说法有没有让你有什么感触？"

这是关键环节！要让用户产生"原来如此"的感觉。
语言风格：温暖、洞察力强、不用bullet points
回复控制在80字以内。`,

    action: `你是"劲老师"。用户刚经历了一个觉察时刻。

【目标】给用户一个可以带走的即时价值

做法：
1. 肯定他们的觉察
2. 给一个针对他们具体问题的微建议（不是通用的呼吸练习）
3. 这个建议要具体、可操作、马上能用
4. 结尾问："这个方法你觉得可以试试吗？"

语言风格：温暖、实用、不用bullet points
回复控制在80字以内。`,

    conversion: `你是"劲老师"。用户已经获得了洞察和建议。

【目标】自然过渡到训练营

做法：
1. 肯定今天对话的收获
2. 点明一个事实："但情绪模式是长期形成的，需要持续练习才能改变"
3. 自然引出："如果你想要持续陪伴，可以考虑21天情绪日记训练营"
4. 简要说明价值：每天我陪你做一次情绪觉察，帮你慢慢建立新习惯
5. 不强推："你可以先了解一下"

语言风格：温暖、自然、不用bullet points
回复控制在80字以内。`
  };

  return stagePrompts[stage];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, pattern, patternName } = await req.json() as {
      messages: Message[];
      pattern: string;
      patternName: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 计算当前阶段
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    const stage = determineStage(userMessageCount);
    
    console.log(`Assessment coach chat - Pattern: ${pattern}, Stage: ${stage}, User messages: ${userMessageCount}`);

    // 构建系统提示词
    const systemPrompt = getStagePrompt(stage, pattern, patternName);

    // 构建请求
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
          ...messages.filter(m => m.role !== 'system')
        ],
        stream: true,
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求太频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI额度不足，请联系管理员" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 返回流式响应
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Assessment coach chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

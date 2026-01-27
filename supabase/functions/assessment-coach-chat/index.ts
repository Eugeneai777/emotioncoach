import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 阶段配置
type Stage = 'empathy' | 'awareness' | 'action' | 'conversion';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 阶段判断逻辑
function determineStage(messageCount: number): Stage {
  if (messageCount <= 2) return 'empathy';
  if (messageCount <= 4) return 'awareness';
  if (messageCount <= 6) return 'action';
  return 'conversion';
}

// 阶段性系统提示词
function getStagePrompt(stage: Stage, pattern: string, patternName: string): string {
  const baseContext = `你是"劲老师"，一位温暖、专业的AI情绪教练。
用户刚完成情绪健康测评，处于"${patternName}"模式。

核心原则：
- 用温暖、口语化的中文对话
- 每次回复控制在100字以内
- 不要使用bullet points，用自然段落
- 主动提问，引导用户分享
- 不要急于给建议，先倾听和共情`;

  const stagePrompts: Record<Stage, string> = {
    empathy: `${baseContext}

【当前阶段：共情倾听】
- 认可用户的感受和经历
- 用简短的话确认你理解了他们
- 问一个开放问题邀请他们继续分享
- 不要急于分析或给建议

示例回复风格：
"听起来你最近确实承受了不少。能跟我说说，这件事让你最累的地方是什么吗？"`,

    awareness: `${baseContext}

【当前阶段：引导觉察】
- 帮助用户看到行为模式背后的心理机制
- 正常化他们的体验（"这很正常"、"很多人都会这样"）
- 温和地指出模式，不要评判
- 提供一个简单的当下觉察

示例回复风格：
"你说的这种感觉，其实是大脑在保护你。当我们长期处在高压下，身体会自动进入节能模式。这不是你的问题。"`,

    action: `${baseContext}

【当前阶段：微行动引导】
- 提供一个极小的、当下就能做的练习
- 不要布置大任务，越小越好
- 可以是呼吸练习、感受觉察、或写一句话
- 邀请用户尝试后分享感受

示例回复风格：
"我们先不谈改变，只做一个小练习。现在花30秒，深吸一口气，慢慢数到5再吐出来。做完告诉我，身体有没有一点点放松？"`,

    conversion: `${baseContext}

【当前阶段：自然转化】
- 肯定用户今天的投入和勇气
- 温和地说明持续陪伴比单次对话更有效
- 自然引出"21天情绪日记训练营"（¥299）
  - 强调：每日AI陪伴、情绪日记打卡、专属成长轨迹
- 不要强推，给用户选择空间
- 如果用户犹豫，理解并尊重

示例回复风格：
"今天跟你聊了这么多，我能感受到你想改变的决心。不过情绪习惯不是一天形成的，也需要时间慢慢调整。

如果你愿意，可以考虑加入21天情绪日记训练营。每天我都会陪你做一个小练习，帮你慢慢找回状态。你觉得怎么样？"`
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

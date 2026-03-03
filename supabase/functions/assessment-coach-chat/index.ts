import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Stage = 'empathy' | 'awareness' | 'action' | 'conversion';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function determineStage(messageCount: number): Stage {
  if (messageCount <= 1) return 'empathy';
  if (messageCount <= 2) return 'awareness';
  if (messageCount <= 3) return 'action';
  return 'conversion';
}

// 情绪教练阶段提示词
function getEmotionStagePrompt(stage: Stage, pattern: string, patternName: string): string {
  const farewellRule = `\n【结束规则】如果用户表示想结束对话（如"今天先聊到这"、"谢谢"、"再见"、"不聊了"等），温暖告别即可，不要追问任何问题，回复2-3句结尾加祝福。`;

  const stagePrompts: Record<Stage, string> = {
    empathy: `你是"劲老师"，专业的AI情绪教练。用户刚完成测评，处于"${patternName}"模式。

【目标】快速锁定用户最核心的情绪痛点

做法：
1. 用一句话精准共情他们的处境
2. 问一个聚焦问题："在这些困扰中，最消耗你的是哪一点？"

语言风格：温暖、口语化、不用bullet points
回复控制在60字以内。${farewellRule}`,

    awareness: `你是"劲老师"。用户处于"${patternName}"模式，刚分享了他们的困扰。

【目标】创造"觉醒时刻" - 让用户看见自己的模式

做法：
1. 基于用户分享，揭示一个他们可能没意识到的心理模式
2. 用"你有没有发现..."或"其实这背后是..."开头
3. 正常化这个模式："这不是你的问题，是大脑的保护机制"
4. 结尾问："这个说法有没有让你有什么感触？"

语言风格：温暖、洞察力强、不用bullet points
回复控制在80字以内。${farewellRule}`,

    action: `你是"劲老师"。用户刚经历了一个觉察时刻。

【目标】给用户一个可以带走的即时价值

做法：
1. 肯定他们的觉察
2. 给一个针对他们具体问题的微建议（不是通用的呼吸练习）
3. 这个建议要具体、可操作、马上能用
4. 结尾问："这个方法你觉得可以试试吗？"

语言风格：温暖、实用、不用bullet points
回复控制在80字以内。${farewellRule}`,

    conversion: `你是"劲老师"。用户已经获得了洞察和建议。

【目标】自然过渡到训练营

做法：
1. 肯定今天对话的收获
2. 点明一个事实："但情绪模式是长期形成的，需要持续练习才能改变"
3. 自然引出："如果你想要持续陪伴，可以考虑21天情绪日记训练营"
4. 简要说明价值：每天我陪你做一次情绪觉察，帮你慢慢建立新习惯
5. 不强推："你可以先了解一下"

语言风格：温暖、自然、不用bullet points
回复控制在80字以内。${farewellRule}`
  };

  return stagePrompts[stage];
}

// 觉醒教练阶段提示词
function getMidlifeStagePrompt(stage: Stage, patternName: string, midlifeContext: string): string {
  const farewellRule = `\n【结束规则】如果用户表示想结束对话，温暖告别即可，不要追问任何问题，回复2-3句结尾加祝福。`;

  const stagePrompts: Record<Stage, string> = {
    empathy: `你是"劲老师"，专业的AI觉醒教练。用户刚完成中场觉醒力测评，人格类型为「${patternName}」。

${midlifeContext}

【目标】快速锁定用户最核心的中场困境

做法：
1. 用一句话精准共情他们的处境——他们可能正在经历人生的"卡住"感
2. 基于他们的测评数据，点出最突出的维度
3. 问一个聚焦问题："在你的生活中，什么时刻让你最强烈地感到'不是这样的'？"

语言风格：温暖、有洞察力、口语化
回复控制在80字以内。${farewellRule}`,

    awareness: `你是"劲老师"。用户是「${patternName}」类型，刚分享了他们的中场困境。

${midlifeContext}

【目标】创造"觉醒时刻" - 让用户看见自己的深层模式

做法：
1. 基于用户分享和测评数据，揭示他们可能没意识到的模式
2. 用"你有没有想过..."或"其实这背后是..."开头
3. 将困境重新定义为"觉醒信号"——这不是危机，是转变的前兆
4. 结尾问："听到这个，你内心有什么感觉？"

语言风格：温暖、深刻、不用bullet points
回复控制在100字以内。${farewellRule}`,

    action: `你是"劲老师"。用户刚经历了一个觉醒时刻。

${midlifeContext}

【目标】给用户一个具体的突破方向

做法：
1. 肯定他们的觉察——"看见"本身就是最大的勇气
2. 基于他们最需突破的维度，给出一个具体的微行动建议
3. 不是泛泛的"多运动多读书"，而是针对他们具体模式的精准建议
4. 结尾问："你愿意这周试试吗？"

语言风格：温暖、实用、有方向感
回复控制在100字以内。${farewellRule}`,

    conversion: `你是"劲老师"。用户已经获得了觉醒洞察和行动建议。

${midlifeContext}

【目标】自然引导到更深入的觉醒之旅

做法：
1. 肯定今天对话的意义——"觉醒不是一次顿悟，是持续的自我探索"
2. 点明：中场觉醒是一个需要陪伴的旅程
3. 自然引出训练营或持续陪伴的选项
4. 不强推："你可以先感受一下今天的收获"

语言风格：温暖、自然、有力量感
回复控制在80字以内。${farewellRule}`
  };

  return stagePrompts[stage];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, pattern, patternName, fromAssessment, midlifeData } = await req.json() as {
      messages: Message[];
      pattern: string;
      patternName: string;
      fromAssessment?: string;
      midlifeData?: {
        personalityType?: string;
        dimensions?: Array<{ dimension: string; score: number }>;
        aiAnalysis?: any;
      };
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userMessageCount = messages.filter(m => m.role === 'user').length;
    const stage = determineStage(userMessageCount);
    const isMidlife = fromAssessment === 'midlife_awakening';
    
    console.log(`Assessment coach chat - Pattern: ${pattern}, Stage: ${stage}, Midlife: ${isMidlife}, User messages: ${userMessageCount}`);

    // 🛡️ 异步风险扫描
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && lastUserMsg.content.length > 5) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const authHeader = req.headers.get('Authorization');
        let userId = 'anonymous';
        if (authHeader) {
          try {
            const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
            const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || '';
            const client = createClient(supabaseUrl, anonKey, {
              global: { headers: { Authorization: authHeader } }
            });
            const { data: { user } } = await client.auth.getUser();
            if (user) userId = user.id;
          } catch { /* ignore */ }
        }

        fetch(`${supabaseUrl}/functions/v1/scan-risk-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            content: lastUserMsg.content,
            user_id: userId,
            content_source: 'ai_conversation',
            source_detail: isMidlife ? `觉醒教练对话 (${patternName})` : `测评教练对话 (${patternName})`,
            platform: 'web',
            page: '/assessment-coach',
          }),
        }).then(r => r.text()).catch(() => {});
      }
    }

    // 构建系统提示词
    let systemPrompt: string;
    if (isMidlife && midlifeData) {
      // 构建觉醒教练上下文
      const dims = midlifeData.dimensions || [];
      const dimSummary = dims.map(d => `${d.dimension}: ${d.score}分（觉醒度${100 - d.score}）`).join('、');
      const weakDims = [...dims].sort((a, b) => b.score - a.score).slice(0, 2);
      const weakSummary = weakDims.map(d => d.dimension).join('和');
      
      const midlifeContext = `【测评数据】
人格类型：${midlifeData.personalityType || patternName}
六维得分：${dimSummary}
最需突破：${weakSummary}
${midlifeData.aiAnalysis?.coreInsight ? `AI洞察：${midlifeData.aiAnalysis.coreInsight}` : ''}`;
      
      systemPrompt = getMidlifeStagePrompt(stage, patternName, midlifeContext);
    } else {
      systemPrompt = getEmotionStagePrompt(stage, pattern, patternName);
    }

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

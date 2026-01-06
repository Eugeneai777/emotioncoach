import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      reactionPattern, 
      dominantPoor, 
      dominantEmotionBlock, 
      dominantBeliefBlock,
      scores,
      healthScore,
      followUpInsights, // 单题追问
      deepFollowUpAnswers // 新增：深度追问回答（用户原话）
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Map codes to Chinese names for better AI understanding
    const patternNames: Record<string, string> = {
      harmony: "和谐型（人与财富双向靠近）",
      chase: "追逐型（人追钱，钱后退）",
      avoid: "逃避型（钱靠近，你退缩）",
      trauma: "创伤型（钱触发强烈身心反应）"
    };

    const poorNames: Record<string, string> = {
      mouth: "嘴穷（诅咒式表达）",
      hand: "手穷（乞丐心态）",
      eye: "眼穷（狭隘视角）",
      heart: "心穷（受害者思维）"
    };

    const emotionNames: Record<string, string> = {
      anxiety: "金钱焦虑",
      scarcity: "匮乏恐惧",
      comparison: "比较自卑",
      shame: "羞耻厌恶",
      guilt: "消费内疚"
    };

    const beliefNames: Record<string, string> = {
      lack: "匮乏感",
      linear: "线性思维",
      stigma: "金钱污名",
      unworthy: "不配得感",
      relationship: "关系恐惧"
    };

    const healthZone = healthScore <= 40 ? "和谐健康区" : 
                       healthScore <= 70 ? "需要关注区" :
                       healthScore <= 85 ? "需要调整区" : "高风险区";

    // 收集用户原话
    const userOriginalWords: string[] = [];
    
    // 从深度追问中提取用户原话
    if (deepFollowUpAnswers && deepFollowUpAnswers.length > 0) {
      deepFollowUpAnswers.forEach((answer: { question: string; answer: string }) => {
        userOriginalWords.push(`「${answer.answer}」`);
      });
    }
    
    // 从单题追问中提取
    if (followUpInsights && followUpInsights.length > 0) {
      followUpInsights.forEach((insight: { selectedOption: string }) => {
        if (insight.selectedOption && insight.selectedOption !== "跳过") {
          userOriginalWords.push(`「${insight.selectedOption}」`);
        }
      });
    }

    const hasUserWords = userOriginalWords.length > 0;
    const userWordsSection = hasUserWords 
      ? `\n\n【用户的原话】（必须在结果中回馈这些词，产生共振感）\n${userOriginalWords.join('、')}`
      : '';

    const systemPrompt = `你是一位专业的财富心理分析师，擅长洞察人与金钱关系背后的深层心理模式。

你的分析风格：
1. 温暖、专业、有洞察力
2. 帮助用户看到问题的根源，同时给予希望
3. **核心要求**：必须使用用户的原话来回馈他们的感受，让他们感到被深度理解

${hasUserWords ? `
【重要】用户在追问中表达了这些词：${userOriginalWords.join('、')}
你必须在分析中引用这些原话，例如：
- "你说的'${userOriginalWords[0] || '...'}'其实是..."
- "当你感到'...'时，这背后是..."
这会让用户感到：这个结果是专门为我写的。
` : ''}`;

    // 构建深度追问部分
    let deepFollowUpSection = '';
    if (deepFollowUpAnswers && deepFollowUpAnswers.length > 0) {
      deepFollowUpSection = `\n【用户深度追问回答】（这些是用户的真实表达，请在分析中回馈）\n`;
      deepFollowUpAnswers.forEach((answer: { question: string; answer: string }, index: number) => {
        deepFollowUpSection += `${index + 1}. 问题：「${answer.question}」\n   用户回答：「${answer.answer}」\n`;
      });
    }

    // 构建单题追问部分
    let followUpSection = '';
    if (followUpInsights && followUpInsights.length > 0) {
      followUpSection = `\n【用户单题追问回答】\n`;
      followUpInsights.forEach((insight: { questionId: number; questionText: string; selectedOption: string }, index: number) => {
        followUpSection += `${index + 1}. 关于「${insight.questionText}」，用户表示：${insight.selectedOption}\n`;
      });
    }

    const userPrompt = `请分析以下财富卡点测评结果：

【测评概况】
- 财富心理健康度：${healthScore}/100 （${healthZone}）
- 财富反应模式：${patternNames[reactionPattern] || reactionPattern}

【主导卡点】
- 行为层主导：${poorNames[dominantPoor] || dominantPoor}
- 情绪层主导：${emotionNames[dominantEmotionBlock] || dominantEmotionBlock}
- 信念层主导：${beliefNames[dominantBeliefBlock] || dominantBeliefBlock}

【三层得分】
- 行为层：${scores.behavior}/50
- 情绪层：${scores.emotion}/50
- 信念层：${scores.belief}/50
${deepFollowUpSection}${followUpSection}${userWordsSection}

请生成以下内容（必须以JSON格式返回）：

{
  "mirrorStatement": "镜像陈述（80字内，必须引用用户原话，让用户感觉：'这说的就是我'。格式：'你不是...，而是...'）",
  "coreStuckPoint": "核心卡点定义（30字内，一句话精准定义用户的核心卡住点）",
  "unlockKey": "解锁钥匙（30字内，突破这个卡点的关键）",
  "rootCauseAnalysis": "根因分析（200字内，深入分析这些卡点组合背后的深层心理根源${hasUserWords ? '，必须引用用户原话' : ''}）",
  "combinedPatternInsight": "组合模式洞察（100字内，分析这几个主导卡点之间的关联性和相互强化模式）",
  "breakthroughPath": ["第一步具体行动（50字内）", "第二步具体行动（50字内）", "第三步具体行动（50字内）"],
  "avoidPitfalls": ["需要避开的坑1（30字内）", "需要避开的坑2（30字内）"],
  "firstStep": "推荐立即执行的第一步（具体可执行，30字内${hasUserWords ? '，针对用户表达的场景' : ''}）",
  "encouragement": "个性化的鼓励语（温暖积极，针对用户的情况，50字内）"
}

请只返回JSON，不要有其他文字。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
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
        return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI分析服务暂时不可用");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI返回内容为空");
    }

    // Parse JSON from response (handle possible markdown code blocks)
    let parsedContent;
    try {
      // Remove potential markdown code blocks
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI响应格式解析失败");
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-wealth-blocks error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "AI分析服务暂时不可用" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

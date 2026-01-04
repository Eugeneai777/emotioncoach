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
      followUpInsights // 新增：追问回答数据
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

    const systemPrompt = `你是一位专业的财富心理分析师，擅长洞察人与金钱关系背后的深层心理模式。你的分析风格温暖、专业、有洞察力，能够帮助用户看到问题的根源，同时给予他们希望和可行的行动方向。

请基于用户的财富卡点测评结果，生成个性化的深度解读。注意：
1. 分析要深入、有洞察力，而不是泛泛而谈
2. 语言要温暖有共情，不让用户感到被批判
3. 建议要具体可执行，不要空洞
4. 考虑各个卡点之间的关联性和相互影响
5. 如果用户提供了具体场景信息（追问回答），请在分析中结合这些场景给出更精准的建议`;

    // 构建追问洞察部分
    let followUpSection = '';
    if (followUpInsights && followUpInsights.length > 0) {
      followUpSection = `\n【用户提供的具体场景】\n`;
      followUpInsights.forEach((insight: { questionId: number; questionText: string; selectedOption: string }, index: number) => {
        followUpSection += `${index + 1}. 关于「${insight.questionText}」，用户表示这种情况主要出现在：${insight.selectedOption}\n`;
      });
      followUpSection += `\n请基于这些具体场景，给出更有针对性的分析和建议。`;
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
${followUpSection}

请生成以下内容（必须以JSON格式返回）：

{
  "rootCauseAnalysis": "根因分析（200字内，深入分析这些卡点组合背后的深层心理根源，可能的成长经历影响${followUpInsights?.length ? '，结合用户提供的场景' : ''}）",
  "combinedPatternInsight": "组合模式洞察（100字内，分析这几个主导卡点之间的关联性和相互强化模式）",
  "breakthroughPath": ["第一步具体行动（50字内）", "第二步具体行动（50字内）", "第三步具体行动（50字内）"],
  "avoidPitfalls": ["需要避开的坑1（30字内）", "需要避开的坑2（30字内）"],
  "firstStep": "推荐立即执行的第一步（具体可执行，30字内${followUpInsights?.length ? '，针对用户提到的场景' : ''}）",
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

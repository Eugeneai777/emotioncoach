import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 因子中文名称映射
const factorNames: Record<string, { name: string; emoji: string; description: string }> = {
  somatization: { name: '躯体化', emoji: '🫀', description: '身体不适感，如头痛、胸闷等' },
  obsessive: { name: '强迫症状', emoji: '🔄', description: '反复检查、无法摆脱的想法' },
  interpersonal: { name: '人际敏感', emoji: '👥', description: '自卑、过分在意他人评价' },
  depression: { name: '抑郁', emoji: '😢', description: '情绪低落、兴趣减退' },
  anxiety: { name: '焦虑', emoji: '😰', description: '紧张、担忧、恐惧' },
  hostility: { name: '敌对', emoji: '😤', description: '易怒、冲动' },
  phobic: { name: '恐怖', emoji: '😨', description: '对特定事物的害怕' },
  paranoid: { name: '偏执', emoji: '🤔', description: '多疑、被害感' },
  psychoticism: { name: '精神病性', emoji: '🌀', description: '思维控制感、幻觉' },
  other: { name: '其他', emoji: '💤', description: '睡眠、饮食等' }
};

// 严重程度配置
const severityConfig: Record<string, { label: string; color: string }> = {
  normal: { label: '心理状态良好', color: 'green' },
  mild: { label: '轻度心理困扰', color: 'yellow' },
  moderate: { label: '中度心理困扰', color: 'orange' },
  severe: { label: '需要专业关注', color: 'red' }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      factorScores,
      totalScore,
      positiveCount,
      positiveScoreAvg,
      gsi,
      severityLevel,
      primarySymptom,
      secondarySymptom
    } = await req.json();

    console.log('[analyze-scl90] Input:', { 
      gsi, 
      severityLevel, 
      primarySymptom, 
      secondarySymptom,
      totalScore,
      positiveCount
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 识别高分因子（≥2.0）
    const highFactors = Object.entries(factorScores || {})
      .filter(([_, score]) => (score as number) >= 2.0)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([key, score]) => ({
        key,
        name: factorNames[key]?.name || key,
        score,
        description: factorNames[key]?.description || ''
      }));

    const primaryInfo = primarySymptom ? factorNames[primarySymptom] : null;
    const secondaryInfo = secondarySymptom ? factorNames[secondarySymptom] : null;

    const systemPrompt = `你是一位专业、温暖的心理咨询师。你正在为刚完成 SCL-90 心理健康自评量表的用户提供个性化解读。

你的沟通风格：
1. 温暖、接纳、不带评判
2. 专业但不生硬，用通俗易懂的语言
3. 给出希望和具体可行的建议
4. 强调这是自我筛查工具，不能替代专业诊断

重要提醒：
- SCL-90 是标准化心理健康筛查工具
- 因子均分 ≥2.0 表示该维度需要关注
- 严重程度判定基于总均分(GSI)和阳性项目数
- 如果严重程度为 severe，必须强调寻求专业帮助的重要性`;

    // 构建因子得分展示
    const factorScoresDisplay = Object.entries(factorScores || {})
      .map(([key, score]) => 
        `- ${factorNames[key]?.name || key}: ${score}${(score as number) >= 2.0 ? ' ⚠️' : ''}`
      ).join('\n');

    // 构建高分因子列表
    const highFactorsDisplay = highFactors.length > 0 
      ? highFactors.map(f => `- ${f.name}: ${f.score}分`).join('\n') 
      : '无';

    const userPrompt = `请分析以下 SCL-90 测评结果：

【总体指标】
- 总分：${totalScore}/450
- 总均分(GSI)：${gsi}
- 阳性项目数：${positiveCount}/90
- 阳性症状均分：${positiveScoreAvg}
- 严重程度：${severityConfig[severityLevel]?.label || severityLevel}

【10因子得分】
${factorScoresDisplay}

【主要突出因子】
${primaryInfo ? `主要：${primaryInfo.name}（${primaryInfo.description}）` : '无明显突出因子'}
${secondaryInfo ? `次要：${secondaryInfo.name}（${secondaryInfo.description}）` : ''}

【高分因子列表】（≥2.0分）
${highFactorsDisplay}

请生成以下内容（必须以JSON格式返回）：

{
  "overallAssessment": "整体心理健康评估（80字内，基于总均分和阳性项目数给出整体判断）",
  "severityExplanation": "严重程度解读（50字内，用温和的语言解释当前状态意味着什么）",
  "primarySymptomAnalysis": "主要症状因子深度分析（120字内，解释这个因子的表现和可能原因${primaryInfo ? `，针对${primaryInfo.name}` : ''}）",
  ${secondaryInfo ? `"secondarySymptomAnalysis": "次要症状因子分析（80字内，针对${secondaryInfo.name}）",` : ''}
  ${highFactors.length > 1 ? `"symptomConnection": "症状之间的关联性分析（80字内，解释这些症状如何相互影响）",` : ''}
  "copingStrategies": ["具体应对策略1（针对${primaryInfo?.name || '整体状态'}）", "具体应对策略2", "具体应对策略3"${severityLevel !== 'normal' ? ', "具体应对策略4"' : ''}],
  "immediateAction": "立即可执行的第一步（30字内，简单具体可操作）",
  "professionalAdvice": "是否需要专业帮助的建议（50字内${severityLevel === 'severe' ? '，必须强烈建议寻求专业帮助' : ''}）",
  ${severityLevel === 'severe' ? `"warningNote": "重要提醒（40字内，包含心理援助热线信息）",` : ''}
  "encouragement": "个性化鼓励语（40字内，温暖、给予希望）",
  "affirmation": "自我肯定语（一句话，用户可以对自己说的积极话语）",
  "campInvite": {
    "headline": "针对${primaryInfo?.name || '情绪健康'}的个性化邀请标题（15字内，突出情绪管理和自我觉察）",
    "reason": "为什么21天情绪日记训练营能帮助这位用户（基于测评结果中的${primaryInfo?.name || '情绪'}症状特点，强调情绪觉察、模式识别和自我关怀，50字内）",
    "expectedBenefits": [
      "针对用户${primaryInfo?.name || '情绪'}问题的具体改善收益",
      "通过情绪日记如何识别和理解自己的情绪模式",
      "21天习惯养成后在日常生活中的长期积极改变"
    ],
    "urgency": "温和的行动提示（20字内，如：开启你的情绪觉察之旅）"
  }
}

请只返回JSON，不要有其他文字。`;

    console.log('[analyze-scl90] Calling AI gateway...');

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
        console.error('[analyze-scl90] Rate limited');
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error('[analyze-scl90] Payment required');
        return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[analyze-scl90] AI gateway error:", response.status, errorText);
      throw new Error("AI分析服务暂时不可用");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[analyze-scl90] Empty AI response');
      throw new Error("AI返回内容为空");
    }

    console.log('[analyze-scl90] Raw AI response length:', content.length);

    // Parse JSON from response
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      // Remove trailing commas before closing brackets/braces
      jsonStr = jsonStr.replace(/,(\s*[\]\}])/g, '$1');
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[analyze-scl90] Failed to parse AI response:", content.substring(0, 500));
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let extracted = jsonMatch[0].replace(/,(\s*[\]\}])/g, '$1');
          parsedContent = JSON.parse(extracted);
        } catch {
          throw new Error("AI响应格式解析失败");
        }
      } else {
        throw new Error("AI响应格式解析失败");
      }
    }

    // Ensure campInvite exists with defaults
    if (!parsedContent.campInvite) {
      parsedContent.campInvite = {
        headline: "情绪需要一个出口",
        reason: "通过每日情绪记录，帮助你更好地觉察和管理情绪变化。",
        expectedBenefits: [
          "追踪情绪变化规律",
          "识别情绪触发点",
          "建立健康的情绪管理习惯"
        ],
        urgency: "每天10分钟，开启自我觉察之旅"
      };
    }

    console.log('[analyze-scl90] Analysis generated successfully');

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[analyze-scl90] Error:", error);
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

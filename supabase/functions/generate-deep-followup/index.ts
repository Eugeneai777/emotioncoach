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
      healthScore
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Map codes to Chinese names
    const patternNames: Record<string, string> = {
      harmony: "和谐型",
      chase: "追逐型（人追钱）",
      avoid: "逃避型（钱来了你退）",
      trauma: "创伤型（钱触发强烈反应）"
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

    // 识别最不稳定的2-3个卡点
    const allBlocks = [
      { type: 'poor', name: poorNames[dominantPoor] || dominantPoor, score: scores.behavior },
      { type: 'emotion', name: emotionNames[dominantEmotionBlock] || dominantEmotionBlock, score: scores.emotion },
      { type: 'belief', name: beliefNames[dominantBeliefBlock] || dominantBeliefBlock, score: scores.belief }
    ];

    const sortedBlocks = allBlocks.sort((a, b) => b.score - a.score);
    const topBlocks = sortedBlocks.slice(0, 2);

    const systemPrompt = `你是一位专业的财富心理分析师。用户刚完成了财富卡点测评，现在需要生成3-5个深度追问，帮助更精准地理解他们的卡点。

追问设计原则：
1. 问题要具体、场景化，不要抽象
2. 每个问题针对用户最不稳定的卡点
3. 选项要能区分不同的心理模式
4. 语言温暖，不带评判
5. 追问之间要有层次递进

重要：
- 追问是为了收集用户的**原话**和**具体场景**
- 这些原话会在后续分析中回馈给用户，产生共振感
- 问题要引导用户说出内心真实感受`;

    const userPrompt = `用户测评结果：
- 反应模式：${patternNames[reactionPattern] || reactionPattern}
- 健康度：${healthScore}/100
- 行为层主导：${poorNames[dominantPoor] || dominantPoor}（${scores.behavior}/50分）
- 情绪层主导：${emotionNames[dominantEmotionBlock] || dominantEmotionBlock}（${scores.emotion}/50分）
- 信念层主导：${beliefNames[dominantBeliefBlock] || dominantBeliefBlock}（${scores.belief}/50分）

最需要深挖的卡点：
1. ${topBlocks[0]?.name}
2. ${topBlocks[1]?.name}

请生成3-5个深度追问（必须以JSON格式返回）：

{
  "deepFollowUps": [
    {
      "question": "追问问题（具体场景化，引导用户说出内心感受）",
      "options": ["选项1", "选项2", "选项3", "其他（自由输入）"],
      "targetBlock": "针对的卡点类型",
      "intent": "追问意图（内部使用，帮助后续分析）"
    }
  ]
}

示例追问类型：
- 如果是追逐型+金钱焦虑："当你拼命工作却还是感觉不够时，你内心更强烈的是：害怕、愤怒、还是绝望？"
- 如果是逃避型+不配得感："当有赚钱机会靠近你时，你第一反应是：这不适合我、我不够格、还是太麻烦了？"
- 如果是创伤型+匮乏感："想到钱的时候，你身体哪个部位会有反应？胸口发紧、胃部不适、还是头脑一片空白？"

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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI服务暂时不可用");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI返回内容为空");
    }

    // Parse JSON from response
    let parsedContent;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // 返回默认追问
      parsedContent = {
        deepFollowUps: [
          {
            question: "当你想到钱的时候，身体哪个部位最先有反应？",
            options: ["胸口发紧", "胃部不适", "肩膀僵硬", "头脑发懵"],
            targetBlock: "body",
            intent: "识别身体反应模式"
          },
          {
            question: "最近一次拒绝赚钱机会时，你内心的声音是什么？",
            options: ["我不配", "太麻烦了", "害怕失败", "其他"],
            targetBlock: "belief",
            intent: "识别限制性信念"
          },
          {
            question: "谈钱时，你更害怕的是？",
            options: ["被拒绝", "暴露真实想法", "破坏关系", "显得贪婪"],
            targetBlock: "emotion",
            intent: "识别核心恐惧"
          }
        ]
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-deep-followup error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "生成追问失败" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

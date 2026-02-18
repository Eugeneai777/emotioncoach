import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      totalScore,
      level,
      categoryScores,
      strongestCategory,
      weakestCategory,
      followUpInsights,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categoryNames: Record<string, string> = {
      career: "职场生命力",
      brand: "个人品牌力",
      resilience: "情绪韧性",
      finance: "财务掌控力",
      relationship: "关系经营力",
    };

    const levelNames: Record<string, string> = {
      dormant: "蛰伏期",
      awakening: "觉醒期",
      blooming: "绽放期",
      leading: "引领期",
    };

    // 收集用户原话
    let userWordsSection = "";
    if (followUpInsights && followUpInsights.length > 0) {
      const words = followUpInsights
        .filter((i: { selectedOption: string }) => i.selectedOption && i.selectedOption !== "跳过")
        .map((i: { questionText: string; selectedOption: string }) => `关于「${i.questionText}」，她说：「${i.selectedOption}」`);
      if (words.length > 0) {
        userWordsSection = `\n\n【用户原话】（请在分析中引用，产生共鸣）\n${words.join("\n")}`;
      }
    }

    const scoreDetails = Object.entries(categoryScores)
      .map(([k, v]) => `- ${categoryNames[k] || k}：${v}/100`)
      .join("\n");

    const systemPrompt = `你是一位专业的女性成长导师，专注35岁以上女性的职场发展和个人竞争力提升。

你的风格：
1. 温暖而有力量，不居高临下，不说教
2. 善于发现女性被忽视的优势
3. 给出的建议具体可执行，而不是空洞的鸡汤
4. 理解35+女性面临的特殊挑战：年龄偏见、家庭平衡、职场天花板
5. 所有回复使用简体中文

${userWordsSection ? `【重要】用户在追问中分享了真实想法，你必须在分析中引用这些原话，让她感到被理解和看见。` : ""}`;

    const userPrompt = `请为这位35+女性生成一份竞争力深度分析报告：

【总体情况】
- 竞争力总分：${totalScore}/100
- 竞争力阶段：${levelNames[level] || level}
- 最强维度：${categoryNames[strongestCategory] || strongestCategory}
- 最需突破：${categoryNames[weakestCategory] || weakestCategory}

【五维得分】
${scoreDetails}
${userWordsSection}

请以 Markdown 格式输出分析报告。要求简洁有力，每个段落不超过120字，避免冗长。

## 👑 你的竞争力画像
（2-3句话精准描述她是什么类型的35+女性，温暖有力）

## 💪 你的隐藏优势
（基于最强维度，挖掘2-3个她可能没意识到的优势，每点一句话）

## 🔓 突破口在这里
（基于最弱维度，分析根因并给出具体突破方向，2-3点，每点一句话）

## 🎯 3个行动建议
（具体可执行的行动步骤，每步一句话说清：做什么+怎么做）

## 💌 写给你的话
（2-3句温暖有力量的鼓励，让她感受到35+不是终点而是新起点）

注意：不要返回 JSON，直接返回 Markdown 格式的文本。每段精炼，拒绝废话。`;

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
          { role: "user", content: userPrompt },
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
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("AI返回内容为空");
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-competitiveness error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "AI分析服务暂时不可用",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

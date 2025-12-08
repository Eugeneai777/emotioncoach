import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, answers, briefingContext, rawContent, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user content based on mode
    let userContent = '';
    if (mode === 'guided' || mode === 'briefing') {
      // For briefing mode, combine briefing context with user input
      if (mode === 'briefing' && briefingContext) {
        userContent = `用户基于历史简报创作故事，以下是简报记录和用户的补充描述：

【简报背景 - 问题】
${briefingContext.problem}

【用户补充 - 问题】
${answers.problem}

【简报背景 - 转折】
${briefingContext.turning}

【用户补充 - 转折】
${answers.turning}

【简报背景 - 成长】
${briefingContext.growth}

【用户补充 - 成长】
${answers.growth}

【简报背景 - 反思】
${briefingContext.reflection}

【用户补充 - 反思】
${answers.reflection}`;
      } else {
        userContent = `用户通过四个阶段回答了以下问题：

【问题】阶段：${answers.problem}
【转折】阶段：${answers.turning}
【成长】阶段：${answers.growth}
【反思】阶段：${answers.reflection}`;
      }
    } else {
      userContent = `用户提供了以下原始叙述：

${rawContent}`;
    }

    // Add context if available
    if (context?.emotionTheme) {
      userContent += `\n\n情绪主题：${context.emotionTheme}`;
    }
    if (context?.campName) {
      userContent += `\n训练营：${context.campName} 第${context.day}天`;
    }

    const systemPrompt = (mode === 'guided' || mode === 'briefing')
      ? `你是一位温柔有洞察力的故事教练。用户${mode === 'briefing' ? '基于历史简报并' : ''}刚刚完成了英雄之旅的四个阶段回答，请帮助他们把这些素材整理成一个完整、动人的故事。
${mode === 'briefing' ? '\n注意：用户提供了简报背景和自己的补充描述，请将两者有机结合，以用户的补充描述为主，简报背景为辅助，创作出一个连贯完整的故事。' : ''}

你的任务：
1. 保留用户的核心表达和真实感受
2. 为每个部分创作：
   - 一个简短有力的小标题（5-10字）
   - 一个有悬念感的副标题（15-25字）
   - 润色后的正文（保留用户原意，增加画面感和情感层次，50-80字）

3. 同时生成 3 个适合小红书的爆款标题：
   - 紧扣故事核心情感和洞察
   - 使用 1-2 个恰当的 emoji
   - 15-25 字，有悬念感和情绪张力
   - 风格：真诚、有力量、不鸡汤
   - 可使用技巧：数字法、反问法、对比法、情感共鸣法

标题示例：
- 🌱 Day5 | 原来90%的焦虑，都是在担心不存在的事
- 💭 第5天：从"我不行"到"我可以试试"的距离
- ✨ 终于明白，允许自己慢下来也是一种勇敢

要求：
- 语言风格：温柔真挚，像朋友间的分享
- 不要改变用户的核心意思，只是让表达更流畅、更有感染力`
      : `你是一位温柔有洞察力的故事教练。用户提供了一段未整理的叙述，请帮助他们按照英雄之旅框架整理成结构化的故事。

请将内容整理为四个部分：
【问题】- 故事中的困境、挑战或情绪起点
【转折】- 关键的改变时刻或决定
【成长】- 获得的新理解或力量
【反思】- 总结和未来展望

每个部分包含：
- 小标题（5-10字）
- 悬念副标题（15-25字）
- 正文（50-80字，细腻真实，保留用户语气）

同时生成 3 个适合小红书的爆款标题：
- 紧扣故事核心情感和洞察
- 使用 1-2 个恰当的 emoji
- 15-25 字，有悬念感和情绪张力
- 风格：真诚、有力量、不鸡汤

标题示例：
- 🌱 Day5 | 原来90%的焦虑，都是在担心不存在的事
- 💭 第5天：从"我不行"到"我可以试试"的距离
- ✨ 终于明白，允许自己慢下来也是一种勇敢`;

    // 扣费
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/deduct-quota`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: 'story_creation',
            source: 'generate_story_coach',
            metadata: { mode }
          })
        });
        console.log(`✅ 故事创作扣费成功`);
      } catch (e) {
        console.error('扣费失败:', e);
      }
    }

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
          { role: "user", content: userContent }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_story_with_titles",
              description: "Create a structured story with four sections and suggested titles",
              parameters: {
                type: "object",
                properties: {
                  story: {
                    type: "object",
                    properties: {
                      problem: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "5-10字小标题" },
                          subtitle: { type: "string", description: "15-25字悬念副标题" },
                          content: { type: "string", description: "50-80字正文" }
                        },
                        required: ["title", "subtitle", "content"]
                      },
                      turning: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "5-10字小标题" },
                          subtitle: { type: "string", description: "15-25字悬念副标题" },
                          content: { type: "string", description: "50-80字正文" }
                        },
                        required: ["title", "subtitle", "content"]
                      },
                      growth: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "5-10字小标题" },
                          subtitle: { type: "string", description: "15-25字悬念副标题" },
                          content: { type: "string", description: "50-80字正文" }
                        },
                        required: ["title", "subtitle", "content"]
                      },
                      reflection: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "5-10字小标题" },
                          subtitle: { type: "string", description: "15-25字悬念副标题" },
                          content: { type: "string", description: "50-80字正文" }
                        },
                        required: ["title", "subtitle", "content"]
                      }
                    },
                    required: ["problem", "turning", "growth", "reflection"]
                  },
                  suggestedTitles: {
                    type: "array",
                    items: { type: "string" },
                    description: "3个小红书爆款标题，15-25字，含emoji",
                    minItems: 3,
                    maxItems: 3
                  },
                  emotionTag: {
                    type: "string",
                    description: "从故事内容中提取的核心情绪标签，如：焦虑、愤怒、委屈、喜悦、悲伤、恐惧、孤独、感动等，必须是2-4个字的标准情绪词"
                  }
                },
                required: ["story", "suggestedTitles", "emotionTag"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_story_with_titles" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Story coach error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate story";
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionId, questionText, questionCategory, userScore, previousAnswers } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // 根据题目类别生成不同的追问策略
    const categoryContext: Record<string, string> = {
      behavior: '行为习惯层面',
      emotion: '情绪感受层面',
      belief: '信念认知层面'
    };

    const systemPrompt = `你是一位温暖专业的财富心理分析专家。用户正在进行财富卡点测评，刚刚对一道题选择了高分（表示符合）。

你的任务是生成一个温和的追问，帮助我们更深入理解用户的具体情况，从而给出更精准的建议。

追问原则：
1. 语气温暖、接纳、不评判
2. 追问要具体、易回答
3. 提供3-4个快速选项，方便用户快速选择
4. 选项要涵盖常见场景，同时留有"其他"选项
5. 不要让用户感到被审问或质疑

当前题目类别：${categoryContext[questionCategory] || '综合'}`;

    const userPrompt = `题目：「${questionText}」
用户得分：${userScore}/5（符合程度${userScore === 5 ? '非常高' : '较高'}）

请生成一个追问，帮助我们了解这种情况通常在什么场景下出现。

请严格按以下JSON格式输出：
{
  "followUpQuestion": "一句温和的追问（不超过25字）",
  "quickOptions": ["选项1", "选项2", "选项3", "其他"],
  "contextHint": "一句简短说明，告诉用户为什么问这个（不超过20字）"
}`;

    console.log('Generating follow-up question for:', { questionId, questionCategory, userScore });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // 解析JSON响应
    let result;
    try {
      // 清理可能的markdown代码块
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // 返回默认追问
      result = {
        followUpQuestion: "这种情况通常在什么时候出现？",
        quickOptions: ["工作中", "家庭中", "社交中", "其他"],
        contextHint: "帮助我们给你更精准的建议"
      };
    }

    console.log('Generated follow-up:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-question-followup:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      // 返回默认追问，确保功能降级可用
      fallback: {
        followUpQuestion: "可以分享一下具体场景吗？",
        quickOptions: ["工作相关", "家庭相关", "人际相关", "其他"],
        contextHint: "这将帮助我们更好地理解你"
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

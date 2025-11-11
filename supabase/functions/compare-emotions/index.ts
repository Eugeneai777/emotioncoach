import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "未授权访问" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "身份验证失败" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { briefing_1, briefing_2 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const promptText = `你是一位温柔的情绪成长导师。用户想要对比两个不同时期的情绪梳理简报，以了解自己的成长。

**较早期简报**（${new Date(briefing_1.date).toLocaleDateString('zh-CN')}）：
- 情绪主题：${briefing_1.emotion_theme}
- 情绪强度：${briefing_1.intensity || '未记录'}/10
- 洞察：${briefing_1.insight || '未记录'}
- 反应觉察：${briefing_1.stage_3 || '未记录'}
- 转化行动：${briefing_1.stage_4 || '未记录'}

**较近期简报**（${new Date(briefing_2.date).toLocaleDateString('zh-CN')}）：
- 情绪主题：${briefing_2.emotion_theme}
- 情绪强度：${briefing_2.intensity || '未记录'}/10
- 洞察：${briefing_2.insight || '未记录'}
- 反应觉察：${briefing_2.stage_3 || '未记录'}
- 转化行动：${briefing_2.stage_4 || '未记录'}

请对比分析用户的情绪处理能力提升，用温柔、鼓励的语气指出具体的成长。

以JSON格式返回：
{
  "emotional_growth": [
    "2-3个情绪认知和觉察能力的成长点，每条30-50字"
  ],
  "coping_evolution": [
    "2-3个应对方式的演变和提升，每条30-50字"
  ],
  "intensity_change": "对情绪强度变化的分析和解读（60-80字）",
  "key_improvements": [
    "3-4个最显著的关键提升点，每条20-40字"
  ],
  "encouraging_summary": "一段温暖、具体的鼓励总结，肯定用户的成长和努力（100-120字）"
}

要求：
- 对比要具体，指出明确的变化和进步
- 即使变化不大，也要找到积极的成长点
- 语气温柔、不评判、充满接纳和肯定
- 强调用户的努力和勇气
- 如果情绪强度上升，也要从成长角度解读（如更诚实面对情绪等）

请确保返回纯JSON格式。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: promptText }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("AI对比分析失败:", response.status);
      return new Response(JSON.stringify({ error: "分析服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const insightText = aiResponse.choices[0].message.content;
    
    let insight;
    try {
      insight = JSON.parse(insightText);
    } catch {
      const jsonMatch = insightText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insight = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI返回的分析结果");
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      insight
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("对比分析错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "分析过程出现错误，请稍后再试 🌿" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

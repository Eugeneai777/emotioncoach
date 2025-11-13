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

    // 获取用户的所有简报
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id);

    if (convError) {
      console.error('获取对话失败:', convError);
      return new Response(JSON.stringify({ error: "获取数据失败" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conversationIds = conversations?.map(c => c.id) || [];

    if (conversationIds.length === 0) {
      return new Response(JSON.stringify({ 
        error: "暂无足够数据进行分析，请先完成几次情绪梳理 🌿" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: briefings, error: briefError } = await supabase
      .from('briefings')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (briefError) {
      console.error('获取简报失败:', briefError);
      return new Response(JSON.stringify({ error: "获取数据失败" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!briefings || briefings.length < 3) {
      return new Response(JSON.stringify({ 
        error: "暂无足够数据进行分析，请至少完成3次情绪梳理 🌿" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 准备分析数据
    const briefingSummaries = briefings.map((b, idx) => `
简报${idx + 1}:
情绪主题: ${b.emotion_theme}
觉察阶段: ${b.stage_1_content}
理解阶段: ${b.stage_2_content}
反应觉察: ${b.stage_3_content}
转化行动: ${b.stage_4_content}
    `).join('\n---\n');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const analysisPrompt = `你是一位专业的情绪分析师。请分析以下用户的情绪梳理简报记录，识别出用户的情绪模式。

${briefingSummaries}

请从以下维度进行分析，并以JSON格式返回结果：

{
  "common_triggers": ["触发场景1", "触发场景2", "触发场景3"],
  "common_emotions": ["常见情绪1", "常见情绪2", "常见情绪3"],
  "reaction_patterns": ["反应模式1", "反应模式2"],
  "coping_strategies": ["应对方式1", "应对方式2", "应对方式3"],
  "growth_insights": "一段温柔的成长洞察总结（80-120字）",
  "recommendations": ["建议1", "建议2", "建议3"]
}

要求：
- common_triggers: 识别最常见的情绪触发场景或情境
- common_emotions: 用户最常出现的情绪类型
- reaction_patterns: 用户在情绪驱动下的常见反应模式
- coping_strategies: 用户已经尝试或成功使用的应对方式
- growth_insights: 温柔、鼓励的语气总结用户的情绪成长旅程
- recommendations: 基于分析的温柔建议

请确保返回纯JSON格式，不要包含任何其他文字。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI分析失败:", response.status, errorText);
      return new Response(JSON.stringify({ error: "分析服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;
    
    // 提取JSON内容
    let analysis;
    try {
      // 尝试直接解析
      analysis = JSON.parse(analysisText);
    } catch {
      // 如果失败，尝试提取JSON块
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI返回的分析结果");
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      analysis,
      briefing_count: briefings.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("分析错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "分析过程出现错误，请稍后再试 🌿" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

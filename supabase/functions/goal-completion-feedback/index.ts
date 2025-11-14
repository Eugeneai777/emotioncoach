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

    const { goal_id } = await req.json();
    if (!goal_id) {
      return new Response(JSON.stringify({ error: "缺少目标ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 获取已完成的目标信息
    const { data: goal, error: goalError } = await supabase
      .from('emotion_goals')
      .select('*')
      .eq('id', goal_id)
      .single();

    if (goalError || !goal) {
      throw new Error("无法找到目标");
    }

    // 获取用户所有目标的历史
    const { data: allGoals } = await supabase
      .from('emotion_goals')
      .select('*')
      .order('created_at', { ascending: false });

    // 获取最近的简报数据
    const { data: recentBriefings } = await supabase
      .from('briefings')
      .select(`
        *,
        conversations!inner(user_id)
      `)
      .eq('conversations.user_id', user.id)
      .gte('created_at', goal.start_date)
      .lte('created_at', goal.end_date)
      .order('created_at', { ascending: false });

    // 统计分析
    const totalGoals = allGoals?.length || 0;
    const completedGoals = allGoals?.filter(g => !g.is_active).length || 0;
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const briefingsInPeriod = recentBriefings?.length || 0;
    const targetCount = goal.target_count;
    const actualRate = Math.round((briefingsInPeriod / targetCount) * 100);

    // 计算平均情绪强度
    const avgIntensity = recentBriefings && recentBriefings.length > 0
      ? Math.round(
          recentBriefings
            .filter((b: any) => b.emotion_intensity)
            .reduce((sum: number, b: any) => sum + (b.emotion_intensity || 0), 0) / 
          recentBriefings.filter((b: any) => b.emotion_intensity).length
        )
      : null;

    const analysisData = {
      goal_type: goal.goal_type,
      target_count: targetCount,
      actual_count: briefingsInPeriod,
      completion_rate: actualRate,
      user_completion_history: completionRate,
      total_goals_completed: completedGoals,
      avg_intensity_during_goal: avgIntensity,
      consecutive_goals: allGoals?.slice(0, 3).every((g: any) => !g.is_active) ? 3 : 
                        allGoals?.slice(0, 2).every((g: any) => !g.is_active) ? 2 : 1
    };

    console.log("完成分析数据:", JSON.stringify(analysisData, null, 2));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY未配置");

    const prompt = `你是一位温柔、鼓励的情绪健康教练，用户刚刚完成了一个情绪管理目标。请基于用户的坚持情况给出真诚的反馈和建议。

用户完成情况：
- 目标类型：${analysisData.goal_type === 'weekly' ? '每周' : '每月'}目标
- 目标次数：${analysisData.target_count}次
- 实际完成：${analysisData.actual_count}次（${analysisData.completion_rate}%）
- 历史完成率：${analysisData.user_completion_history}%（共完成${analysisData.total_goals_completed}个目标）
- 连续完成：${analysisData.consecutive_goals}个目标
- 期间平均情绪强度：${analysisData.avg_intensity_during_goal || '未知'}

请生成：
1. 一段温暖的鼓励语（50-80字），肯定用户的坚持和成长
2. 一个具体的成就总结（30-50字）
3. 3个下一步建议，每个包含：
   - 建议类型（continue/elevate/adjust）
   - 具体建议内容
   - 为什么这样建议

返回JSON格式：
{
  "encouragement": "温暖鼓励的话",
  "achievement_summary": "成就总结",
  "next_steps": [
    {
      "type": "continue",
      "suggestion": "具体建议",
      "reasoning": "为什么这样建议"
    }
  ],
  "celebration_message": "一句话庆祝语（15-25字）"
}

要求：
- 根据实际完成率调整语气：超额完成要热烈祝贺，刚好完成要温柔肯定，未完成也要鼓励和理解
- 如果连续完成多个目标，要特别肯定这种坚持
- 建议要具体可行，而不是空洞的鼓励
- 语气温柔、真诚、不做作

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
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI反馈生成失败:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "额度不足，请在工作区充值后再试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "反馈服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const feedbackText = aiResponse.choices[0].message.content;
    
    console.log("AI返回:", feedbackText);

    let feedback;
    try {
      feedback = JSON.parse(feedbackText);
    } catch {
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI返回的反馈");
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      ...feedback,
      stats: analysisData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("生成完成反馈错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "生成反馈过程出现错误，请稍后再试 🌿" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

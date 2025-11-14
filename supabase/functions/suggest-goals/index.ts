import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify authentication
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

    // 获取用户的简报数据
    const { data: briefings, error: briefingsError } = await supabase
      .from('briefings')
      .select(`
        *,
        conversations!inner(user_id)
      `)
      .eq('conversations.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (briefingsError) {
      console.error("获取简报失败:", briefingsError);
      throw briefingsError;
    }

    // 获取用户的标签统计
    const { data: tagStats, error: tagStatsError } = await supabase
      .from('briefing_tags')
      .select(`
        tag_id,
        tags!inner(name, color),
        briefings!inner(
          emotion_intensity,
          created_at,
          conversations!inner(user_id)
        )
      `)
      .eq('briefings.conversations.user_id', user.id);

    if (tagStatsError) {
      console.error("获取标签统计失败:", tagStatsError);
    }

    // 统计标签频率
    const tagFrequency: Record<string, number> = {};
    const tagIntensities: Record<string, number[]> = {};
    
    if (tagStats) {
      tagStats.forEach((item: any) => {
        const tagName = item.tags?.name;
        if (tagName) {
          tagFrequency[tagName] = (tagFrequency[tagName] || 0) + 1;
          if (item.briefings?.emotion_intensity) {
            if (!tagIntensities[tagName]) {
              tagIntensities[tagName] = [];
            }
            tagIntensities[tagName].push(item.briefings.emotion_intensity);
          }
        }
      });
    }

    // 准备分析数据
    const analysisData = {
      briefings_count: briefings?.length || 0,
      recent_emotions: briefings?.slice(0, 5).map((b: any) => ({
        theme: b.emotion_theme,
        intensity: b.emotion_intensity,
        keywords: b.intensity_keywords,
        date: b.created_at
      })) || [],
      top_tags: Object.entries(tagFrequency)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([tag, count]) => ({
          name: tag,
          count,
          avg_intensity: tagIntensities[tag]?.length > 0 
            ? Math.round(tagIntensities[tag].reduce((a, b) => a + b, 0) / tagIntensities[tag].length)
            : null
        })),
      intensity_trend: briefings?.slice(0, 5).map((b: any) => b.emotion_intensity).filter(Boolean) || []
    };

    console.log("分析数据:", JSON.stringify(analysisData, null, 2));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY未配置");

    const prompt = `你是一位专业的情绪健康教练，基于用户的情绪简报历史和标签数据，为用户提供个性化的目标设定建议。

用户数据分析：
- 总简报数：${analysisData.briefings_count}
- 最常出现的情绪标签：${analysisData.top_tags.map(t => `${t.name}(${t.count}次${t.avg_intensity ? `, 平均强度${t.avg_intensity}` : ''})`).join(', ')}
- 最近情绪：${analysisData.recent_emotions.map(e => `${e.theme}(强度${e.intensity || '未知'})`).join(', ')}
- 最近强度趋势：${analysisData.intensity_trend.join(', ')}

请根据以上数据，生成3-4个具体可行的目标建议。每个建议应该包括：
1. 目标类型（weekly 或 monthly）
2. 目标数量（每周/月完成几次情绪梳理）
3. 目标描述（为什么建议这个目标，如何帮助用户改善情绪健康）
4. 优先级（high/medium/low）

返回JSON格式：
{
  "suggestions": [
    {
      "goal_type": "weekly",
      "target_count": 3,
      "description": "建议描述",
      "priority": "high",
      "reasoning": "为什么推荐这个目标"
    }
  ],
  "summary": "整体分析总结（50-80字）"
}

要求：
- 基于用户的实际数据提供建议
- 如果用户情绪强度较高或负面标签多，建议更频繁的梳理
- 如果用户已经在坚持，给予肯定并建议保持或适当提升
- 目标要具体、可衡量、可实现
- 语气温柔、鼓励

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
      console.error("AI建议生成失败:", response.status, errorText);
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
      return new Response(JSON.stringify({ error: "建议服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const suggestionsText = aiResponse.choices[0].message.content;
    
    console.log("AI返回:", suggestionsText);

    let suggestions;
    try {
      // 尝试直接解析
      suggestions = JSON.parse(suggestionsText);
    } catch {
      // 如果解析失败，尝试提取JSON
      const jsonMatch = suggestionsText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI返回的建议");
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      ...suggestions,
      user_data: analysisData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("生成目标建议错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "生成建议过程出现错误，请稍后再试 🌿" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

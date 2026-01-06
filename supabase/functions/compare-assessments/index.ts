import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { current_assessment_id, previous_assessment_id } = await req.json();

    if (!current_assessment_id) {
      return new Response(JSON.stringify({ error: 'current_assessment_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch current assessment
    const { data: current, error: currentError } = await supabaseClient
      .from('wealth_block_assessments')
      .select('*')
      .eq('id', current_assessment_id)
      .eq('user_id', user.id)
      .single();

    if (currentError || !current) {
      return new Response(JSON.stringify({ error: 'Current assessment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch previous assessment
    let previous = null;
    if (previous_assessment_id) {
      const { data } = await supabaseClient
        .from('wealth_block_assessments')
        .select('*')
        .eq('id', previous_assessment_id)
        .eq('user_id', user.id)
        .single();
      previous = data;
    } else if (current.previous_assessment_id) {
      const { data } = await supabaseClient
        .from('wealth_block_assessments')
        .select('*')
        .eq('id', current.previous_assessment_id)
        .eq('user_id', user.id)
        .single();
      previous = data;
    }

    // If no previous assessment, return basic analysis
    if (!previous) {
      return new Response(JSON.stringify({
        hasComparison: false,
        current: {
          behavior_score: current.behavior_score,
          emotion_score: current.emotion_score,
          belief_score: current.belief_score,
          total_score: current.total_score,
          created_at: current.created_at,
        },
        analysis: {
          overall_change: null,
          highlight: "这是你的首次测评，建议21天后重测观察变化",
          breakthrough_signals: [],
          still_working: null,
          next_focus: "完成21天财富卡点训练后重测，对比你的成长"
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate changes
    const behaviorChange = current.behavior_score - previous.behavior_score;
    const emotionChange = current.emotion_score - previous.emotion_score;
    const beliefChange = current.belief_score - previous.belief_score;
    const totalChange = current.total_score - previous.total_score;

    const behaviorChangePct = previous.behavior_score > 0 
      ? ((behaviorChange / previous.behavior_score) * 100).toFixed(1)
      : 0;
    const emotionChangePct = previous.emotion_score > 0 
      ? ((emotionChange / previous.emotion_score) * 100).toFixed(1)
      : 0;
    const beliefChangePct = previous.belief_score > 0 
      ? ((beliefChange / previous.belief_score) * 100).toFixed(1)
      : 0;
    const overallChangePct = previous.total_score > 0
      ? ((totalChange / previous.total_score) * 100).toFixed(1)
      : 0;

    // Generate AI analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const analysisPrompt = `你是财富心理分析师。请分析用户两次财富卡点测评的变化。

【上次测评】(${previous.created_at})
- 行为层：${previous.behavior_score}分
- 情绪层：${previous.emotion_score}分
- 信念层：${previous.belief_score}分
- 反应模式：${previous.reaction_pattern || '未知'}
- 主导四穷：${previous.dominant_poor || '未知'}

【本次测评】(${current.created_at})
- 行为层：${current.behavior_score}分 (${behaviorChange >= 0 ? '+' : ''}${behaviorChange})
- 情绪层：${current.emotion_score}分 (${emotionChange >= 0 ? '+' : ''}${emotionChange})
- 信念层：${current.belief_score}分 (${beliefChange >= 0 ? '+' : ''}${beliefChange})
- 反应模式：${current.reaction_pattern || '未知'}
- 主导四穷：${current.dominant_poor || '未知'}

请输出JSON格式分析（不要markdown标记）：
{
  "highlight": "最大的进步点，用第二人称表述，20字以内",
  "still_working": "仍需关注的点，用鼓励的语气，20字以内",
  "breakthrough_signals": ["突破信号1", "突破信号2"],
  "next_focus": "下阶段建议，30字以内",
  "encouragement": "一句鼓励的话，15字以内"
}`;

    let aiAnalysis = {
      highlight: "你正在持续成长中",
      still_working: null as string | null,
      breakthrough_signals: [] as string[],
      next_focus: "继续保持觉察练习",
      encouragement: "每一步都算数"
    };

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'user', content: analysisPrompt }
            ],
            max_tokens: 500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
          aiAnalysis = JSON.parse(cleanedContent);
        }
      } catch (e) {
        console.error('AI analysis error:', e);
      }
    }

    // Identify breakthrough signals based on changes
    const breakthroughSignals = [...(aiAnalysis.breakthrough_signals || [])];
    if (behaviorChange < -5) breakthroughSignals.push("行为模式开始松动");
    if (emotionChange < -5) breakthroughSignals.push("情绪层开始流动");
    if (beliefChange < -5) breakthroughSignals.push("旧信念被质疑");
    if (current.reaction_pattern !== previous.reaction_pattern) {
      breakthroughSignals.push("反应模式发生转变");
    }

    return new Response(JSON.stringify({
      hasComparison: true,
      current: {
        behavior_score: current.behavior_score,
        emotion_score: current.emotion_score,
        belief_score: current.belief_score,
        total_score: current.total_score,
        reaction_pattern: current.reaction_pattern,
        dominant_poor: current.dominant_poor,
        created_at: current.created_at,
        version: current.version || 1,
      },
      previous: {
        behavior_score: previous.behavior_score,
        emotion_score: previous.emotion_score,
        belief_score: previous.belief_score,
        total_score: previous.total_score,
        reaction_pattern: previous.reaction_pattern,
        dominant_poor: previous.dominant_poor,
        created_at: previous.created_at,
        version: previous.version || 1,
      },
      changes: {
        behavior: {
          absolute: behaviorChange,
          percent: parseFloat(behaviorChangePct as string),
        },
        emotion: {
          absolute: emotionChange,
          percent: parseFloat(emotionChangePct as string),
        },
        belief: {
          absolute: beliefChange,
          percent: parseFloat(beliefChangePct as string),
        },
        overall: {
          absolute: totalChange,
          percent: parseFloat(overallChangePct as string),
        }
      },
      analysis: {
        overall_change: `${overallChangePct}%`,
        highlight: aiAnalysis.highlight,
        still_working: aiAnalysis.still_working,
        breakthrough_signals: breakthroughSignals.slice(0, 3),
        next_focus: aiAnalysis.next_focus,
        encouragement: aiAnalysis.encouragement,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in compare-assessments:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

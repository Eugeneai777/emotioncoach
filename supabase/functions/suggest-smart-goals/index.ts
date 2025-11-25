import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log('Fetching user data for:', userId);

    // Aggregate all user data
    const [
      briefingsResult,
      tagsResult,
      habitsResult,
      habitLogsResult,
      energyLogsResult,
      sleepLogsResult,
      exerciseLogsResult,
      meditationSessionsResult,
      breathingSessionsResult,
      gratitudeEntriesResult,
      userValuesResult,
      visionItemsResult,
      quickLogsResult,
      existingGoalsResult
    ] = await Promise.all([
      supabase.from('briefings')
        .select('*, conversation:conversations!inner(user_id), briefing_tags(tag_id)')
        .eq('conversation.user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false }),
      
      supabase.from('tags')
        .select('*')
        .eq('user_id', userId),
      
      supabase.from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true),
      
      supabase.from('habit_logs')
        .select('*, habit:habits!inner(user_id)')
        .eq('habit.user_id', userId)
        .gte('logged_at', thirtyDaysAgo.toISOString()),
      
      supabase.from('energy_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', thirtyDaysAgo.toISOString()),
      
      supabase.from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', thirtyDaysAgo.toISOString()),
      
      supabase.from('exercise_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', thirtyDaysAgo.toISOString()),
      
      supabase.from('meditation_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      supabase.from('breathing_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      supabase.from('gratitude_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      supabase.from('user_values')
        .select('*')
        .eq('user_id', userId),
      
      supabase.from('vision_items')
        .select('*')
        .eq('user_id', userId),
      
      supabase.from('emotion_quick_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      supabase.from('emotion_goals')
        .select('*, tag:tags(name)')
        .eq('user_id', userId)
        .eq('is_active', true)
    ]);

    const briefings = briefingsResult.data || [];
    const tags = tagsResult.data || [];
    const habits = habitsResult.data || [];
    const habitLogs = habitLogsResult.data || [];
    const energyLogs = energyLogsResult.data || [];
    const sleepLogs = sleepLogsResult.data || [];
    const exerciseLogs = exerciseLogsResult.data || [];
    const meditationSessions = meditationSessionsResult.data || [];
    const breathingSessions = breathingSessionsResult.data || [];
    const gratitudeEntries = gratitudeEntriesResult.data || [];
    const userValues = userValuesResult.data || [];
    const visionItems = visionItemsResult.data || [];
    const quickLogs = quickLogsResult.data || [];
    const existingGoals = existingGoalsResult.data || [];

    // Calculate tag usage in last 7 days
    const recentBriefings = briefings.filter(b => new Date(b.created_at) >= sevenDaysAgo);
    const tagUsageMap = new Map<string, { count: number; name: string; sentiment: string; intensities: (number | null)[] }>();
    
    recentBriefings.forEach(briefing => {
      const tagIds = briefing.briefing_tags?.map((bt: any) => bt.tag_id) || [];
      tagIds.forEach((tagId: string) => {
        const tag = tags.find(t => t.id === tagId);
        if (tag) {
          const existing = tagUsageMap.get(tagId) || { 
            count: 0, 
            name: tag.name, 
            sentiment: tag.sentiment || 'neutral', 
            intensities: [] as (number | null)[]
          };
          existing.count++;
          if (briefing.emotion_intensity != null) {
            existing.intensities.push(briefing.emotion_intensity);
          }
          tagUsageMap.set(tagId, existing);
        }
      });
    });

    // Calculate averages and trends
    const allIntensities = [...briefings.map(b => b.emotion_intensity).filter(i => i != null), ...quickLogs.map(q => q.emotion_intensity)];
    const avgIntensity = allIntensities.length > 0 ? allIntensities.reduce((a, b) => a + b, 0) / allIntensities.length : 0;
    const highIntensityDays = allIntensities.filter(i => i >= 7).length;
    
    const daysSinceLastBriefing = briefings.length > 0 
      ? Math.floor((new Date().getTime() - new Date(briefings[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    const weeklyBriefingCount = recentBriefings.length;
    
    const avgSleepQuality = sleepLogs.length > 0 
      ? sleepLogs.reduce((sum, log) => sum + (log.quality_score || 0), 0) / sleepLogs.length 
      : 0;
    
    const weeklyExerciseCount = exerciseLogs.filter(e => new Date(e.logged_at || e.created_at) >= sevenDaysAgo).length;
    const weeklyMeditationCount = meditationSessions.filter(m => new Date(m.created_at) >= sevenDaysAgo).length;
    const weeklyBreathingCount = breathingSessions.filter(b => new Date(b.created_at) >= sevenDaysAgo).length;
    const weeklyGratitudeCount = gratitudeEntries.filter(g => new Date(g.created_at) >= sevenDaysAgo).length;

    // Build analysis data
    const analysisData = {
      emotion: {
        briefing_count_30d: briefings.length,
        briefing_count_7d: weeklyBriefingCount,
        quick_log_count_7d: quickLogs.filter(q => new Date(q.created_at) >= sevenDaysAgo).length,
        avg_intensity: Math.round(avgIntensity * 10) / 10,
        high_intensity_days: highIntensityDays,
        days_since_last: daysSinceLastBriefing,
        top_tags: Array.from(tagUsageMap.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([id, data]) => ({
            id,
            name: data.name,
            count: data.count,
            sentiment: data.sentiment,
            avg_intensity: data.intensities.length > 0 
              ? Math.round(data.intensities.reduce((a, b) => a! + b!, 0)! / data.intensities.length * 10) / 10 
              : null
          }))
      },
      lifestyle: {
        sleep_count: sleepLogs.length,
        avg_sleep_quality: Math.round(avgSleepQuality * 10) / 10,
        exercise_count_7d: weeklyExerciseCount,
        energy_logs_count: energyLogs.length,
        habits_count: habits.length,
        habit_completion_rate: habits.length > 0 
          ? Math.round((habitLogs.filter(l => l.completed).length / (habits.length * 30)) * 100) 
          : 0
      },
      mindfulness: {
        meditation_count_7d: weeklyMeditationCount,
        breathing_count_7d: weeklyBreathingCount,
        total_meditation_minutes: meditationSessions.reduce((sum, s) => sum + s.duration, 0)
      },
      growth: {
        gratitude_count_7d: weeklyGratitudeCount,
        values_count: userValues.length,
        vision_count: visionItems.length
      },
      existing_goals: existingGoals.map(g => ({
        type: g.goal_type,
        category: g.goal_category,
        target_tag: g.target_tag_id ? tags.find(t => t.id === g.target_tag_id)?.name : null
      }))
    };

    console.log('Analysis data prepared:', JSON.stringify(analysisData, null, 2));

    // Call Lovable AI to generate goal suggestions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `你是一位专业的AI生活教练。基于用户的全维度健康数据，请为用户生成3-5个个性化、可执行的目标建议。

**用户数据分析：**
${JSON.stringify(analysisData, null, 2)}

**目标推荐原则：**
1. 优先推荐对用户改进空间最大的维度
2. 目标必须具体、可衡量、可执行
3. 考虑用户当前状态和数据趋势
4. 避免推荐已存在的目标类型
5. 为每个目标提供清晰的数据依据和预期收益

**请按以下JSON格式返回建议（只返回JSON，不要其他内容）：**
{
  "analysis_summary": "简要总结用户当前状态（2-3句话）",
  "goal_suggestions": [
    {
      "id": "suggestion_1",
      "category": "emotion|lifestyle|mindfulness|growth",
      "goal_type": "weekly|monthly",
      "goal_category": "frequency|intensity_average|tag_reduction|tag_increase|meditation_frequency|exercise_frequency|habit_completion",
      "title": "目标标题（10字以内）",
      "description": "详细描述为什么推荐这个目标（30字以内）",
      "target_count": 3,
      "target_tag_id": "如果是tag相关目标，填写tag的id，否则null",
      "target_tag_name": "如果是tag相关目标，填写tag名称，否则null",
      "priority": "high|medium|low",
      "reasoning": "推荐理由（结合具体数据说明，30字以内）",
      "expected_benefit": "预期收益（20字以内）",
      "difficulty": "easy|medium|hard",
      "data_basis": {
        "key_metrics": "关键指标及当前值"
      }
    }
  ]
}

**目标类型说明：**
- frequency: 情绪梳理频率目标（适用于梳理次数少的情况）
- intensity_average: 情绪强度控制目标（适用于强度波动大的情况）
- tag_reduction: 减少负面标签目标（适用于负面标签频繁的情况）
- tag_increase: 增加正面标签目标（适用于需要培养正面情绪的情况）
- meditation_frequency: 冥想练习频率目标
- exercise_frequency: 运动频率目标
- habit_completion: 习惯完成率目标

请确保返回的是有效的JSON格式。`;

    console.log('Calling Lovable AI for goal suggestions...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('AI服务请求过于频繁，请稍后再试');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI服务额度不足，请联系管理员');
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI服务调用失败');
    }

    const aiData = await aiResponse.json();
    console.log('AI response received:', JSON.stringify(aiData, null, 2));

    let aiContent = aiData.choices[0].message.content;
    
    // Try to extract JSON from the response
    let suggestionsData;
    try {
      // Try direct parse first
      suggestionsData = JSON.parse(aiContent);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        suggestionsData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object in the text
        const jsonObjectMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          suggestionsData = JSON.parse(jsonObjectMatch[0]);
        } else {
          throw new Error('无法解析AI返回的数据');
        }
      }
    }

    console.log('Parsed suggestions data:', JSON.stringify(suggestionsData, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        ...suggestionsData,
        user_data: analysisData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in suggest-smart-goals function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '未知错误',
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

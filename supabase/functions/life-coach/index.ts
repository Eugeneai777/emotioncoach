import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`🤖 AI生活教练分析 - 用户: ${user.id}`);

    // 获取最近30天的数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 并行查询所有数据源
    const [
      briefingsData,
      emotionLogsData,
      habitsData,
      habitLogsData,
      energyLogsData,
      sleepLogsData,
      exerciseLogsData,
      meditationData,
      breathingData,
      gratitudeData,
      valuesData,
      visionData,
    ] = await Promise.all([
      supabase.from('briefings').select('*').eq('conversation_id', user.id).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }),
      supabase.from('emotion_quick_logs').select('*').eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('habit_logs').select('*').gte('logged_at', sevenDaysAgo.toISOString()),
      supabase.from('energy_logs').select('*').eq('user_id', user.id).gte('logged_at', sevenDaysAgo.toISOString()),
      supabase.from('sleep_logs').select('*').eq('user_id', user.id).gte('logged_at', sevenDaysAgo.toISOString()),
      supabase.from('exercise_logs').select('*').eq('user_id', user.id).gte('logged_at', sevenDaysAgo.toISOString()),
      supabase.from('meditation_sessions').select('*').eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('breathing_sessions').select('*').eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('gratitude_entries').select('*').eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('user_values').select('*').eq('user_id', user.id),
      supabase.from('vision_items').select('*').eq('user_id', user.id),
    ]);

    const briefings = briefingsData.data || [];
    const emotionLogs = emotionLogsData.data || [];
    const habits = habitsData.data || [];
    const habitLogs = habitLogsData.data || [];
    const energyLogs = energyLogsData.data || [];
    const sleepLogs = sleepLogsData.data || [];
    const exerciseLogs = exerciseLogsData.data || [];
    const meditationSessions = meditationData.data || [];
    const breathingSessions = breathingData.data || [];
    const gratitudeEntries = gratitudeData.data || [];
    const userValues = valuesData.data || [];
    const visionItems = visionData.data || [];

    // 计算情绪维度得分
    const lastBriefing = briefings[0];
    const daysSinceLastBriefing = lastBriefing 
      ? Math.floor((Date.now() - new Date(lastBriefing.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    const avgEmotionIntensity = emotionLogs.length > 0
      ? emotionLogs.reduce((sum, log) => sum + log.emotion_intensity, 0) / emotionLogs.length
      : 5;

    const recentEmotionThemes = briefings.slice(0, 5).map(b => b.emotion_theme);
    
    const emotionScore = Math.max(0, Math.min(100, 
      100 - (daysSinceLastBriefing * 5) - (avgEmotionIntensity > 7 ? 20 : 0)
    ));

    const emotionStatus = emotionScore >= 70 ? '良好' : emotionScore >= 50 ? '需关注' : '需提升';
    const emotionTrend = emotionLogs.length >= 2 
      ? (emotionLogs[0].emotion_intensity < emotionLogs[emotionLogs.length - 1].emotion_intensity ? 'up' : 'down')
      : 'stable';

    // 计算生活习惯维度得分
    const totalHabits = habits.length;
    const completedHabits = habitLogs.filter(log => log.completed).length;
    const habitCompletionRate = totalHabits > 0 ? completedHabits / (totalHabits * 7) : 0;

    const avgSleepQuality = sleepLogs.length > 0
      ? sleepLogs.reduce((sum, log) => sum + (log.quality_score || 0), 0) / sleepLogs.length
      : 0;

    const exerciseFrequency = exerciseLogs.length;

    const lifestyleScore = Math.round(
      habitCompletionRate * 50 + (avgSleepQuality / 10) * 30 + Math.min(exerciseFrequency * 5, 20)
    );

    const lifestyleStatus = lifestyleScore >= 70 ? '良好' : lifestyleScore >= 50 ? '一般' : '需改善';

    // 计算身心调节维度得分
    const mindfulnessScore = Math.min(100, 
      meditationSessions.length * 10 + breathingSessions.length * 8
    );

    const mindfulnessStatus = mindfulnessScore >= 70 ? '良好' : mindfulnessScore >= 40 ? '需提升' : '需关注';

    // 计算自我成长维度得分
    const growthScore = Math.min(100,
      gratitudeEntries.length * 10 + 
      (userValues.length > 0 ? 30 : 0) +
      (visionItems.length > 0 ? 20 : 0)
    );

    const growthStatus = growthScore >= 70 ? '稳定' : growthScore >= 50 ? '成长中' : '需引导';

    // 计算整体得分
    const overallScore = Math.round(
      (emotionScore * 0.35 + lifestyleScore * 0.30 + mindfulnessScore * 0.20 + growthScore * 0.15)
    );

    // 生成智能推荐
    const recommendations = [];

    // 优先级1：情绪关注
    if (daysSinceLastBriefing >= 3 || avgEmotionIntensity >= 7) {
      recommendations.push({
        type: 'emotion_coach',
        priority: 'high',
        title: '今天来做一次情绪梳理吧',
        reason: daysSinceLastBriefing >= 3 
          ? `你已经${daysSinceLastBriefing}天没有做情绪日记了${avgEmotionIntensity >= 7 ? '，近期情绪强度偏高' : ''}` 
          : '检测到情绪强度较高，建议进行情绪梳理',
        action_text: '开始情绪梳理',
        action_route: '/',
      });
    }

    // 优先级2：呼吸练习
    if (avgEmotionIntensity >= 7 && breathingSessions.length < 3) {
      recommendations.push({
        type: 'breathing',
        priority: 'medium',
        title: '试试4-7-8呼吸法',
        reason: '检测到焦虑情绪，呼吸练习可以帮助平复',
        action_text: '开始练习',
        action_route: '/energy-studio',
        tool_id: 'breathing',
      });
    }

    // 优先级3：冥想练习
    if (meditationSessions.length < 2) {
      recommendations.push({
        type: 'meditation',
        priority: 'medium',
        title: '每日冥想10分钟',
        reason: '本周冥想次数较少，建立正念习惯',
        action_text: '开始冥想',
        action_route: '/energy-studio',
        tool_id: 'meditation',
      });
    }

    // 优先级4：习惯追踪
    if (habitCompletionRate < 0.6 && totalHabits > 0) {
      recommendations.push({
        type: 'habit',
        priority: 'medium',
        title: '坚持你的好习惯',
        reason: `本周习惯完成率${Math.round(habitCompletionRate * 100)}%，还可以更好`,
        action_text: '查看习惯',
        action_route: '/energy-studio',
        tool_id: 'habit',
      });
    }

    // 优先级5：运动打卡
    if (exerciseFrequency < 3) {
      recommendations.push({
        type: 'exercise',
        priority: 'low',
        title: '增加运动频率',
        reason: `本周运动${exerciseFrequency}次，建议至少3次`,
        action_text: '记录运动',
        action_route: '/energy-studio',
        tool_id: 'exercise',
      });
    }

    // 优先级6：感恩日记
    if (gratitudeEntries.length < 5) {
      recommendations.push({
        type: 'gratitude',
        priority: 'low',
        title: '写下今天的感恩',
        reason: '感恩练习能提升幸福感',
        action_text: '开始记录',
        action_route: '/energy-studio',
        tool_id: 'gratitude',
      });
    }

    // 生成跨维度洞察
    const insights = [];

    if (briefings.length > 3 && sleepLogs.length > 3) {
      const briefingDates = briefings.map(b => new Date(b.created_at).toDateString());
      const sleepQualities = sleepLogs.filter(s => 
        briefingDates.includes(new Date(s.logged_at).toDateString())
      );
      
      if (sleepQualities.length > 0) {
        const avgQualityWithBriefing = sleepQualities.reduce((sum, s) => sum + (s.quality_score || 0), 0) / sleepQualities.length;
        const avgQualityOverall = avgSleepQuality;
        
        if (avgQualityWithBriefing > avgQualityOverall) {
          insights.push({
            insight: `你在做情绪梳理的日子，睡眠质量平均提升${Math.round((avgQualityWithBriefing - avgQualityOverall) / avgQualityOverall * 100)}%`,
            suggestion: '建议在睡前1小时进行情绪梳理',
          });
        }
      }
    }

    if (gratitudeEntries.length > 0 && energyLogs.length > 0) {
      insights.push({
        insight: '写感恩日记后，第二天的能量水平通常更高',
        suggestion: '尝试将感恩日记作为晚间习惯',
      });
    }

    if (exerciseLogs.length > 0 && energyLogs.length > 0) {
      insights.push({
        insight: '运动日的平均能量水平明显更高',
        suggestion: '在低能量日尝试进行轻度运动',
      });
    }

    // 生成生活总结
    let lifeSummary = '';
    if (overallScore >= 80) {
      lifeSummary = '你这周的整体状态非常好！继续保持这样的生活节奏 ✨';
    } else if (overallScore >= 60) {
      lifeSummary = '你这周整体状态不错，但在一些方面还可以更好 🌱';
    } else {
      lifeSummary = '看起来你最近有些辛苦，让我们一起找到改善的方向 💪';
    }

    // 生成鼓励语
    const encouragements = [
      '你正在变得更了解自己，这是最美好的成长 🌱',
      '每一次觉察都是进步，为你的坚持点赞 ⭐',
      '生活是一场修行，你已经在路上了 🚀',
      '今天的你，比昨天更懂得照顾自己 💝',
    ];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    const result = {
      overall_score: overallScore,
      life_summary: lifeSummary,
      dimensions: {
        emotion: {
          score: emotionScore,
          status: emotionStatus,
          last_briefing_days_ago: daysSinceLastBriefing,
          recent_emotion_themes: recentEmotionThemes,
          avg_intensity: Math.round(avgEmotionIntensity * 10) / 10,
          trend: emotionTrend,
        },
        lifestyle: {
          score: lifestyleScore,
          status: lifestyleStatus,
          habit_completion_rate: Math.round(habitCompletionRate * 100) / 100,
          exercise_frequency: `${exerciseFrequency}次/周`,
          sleep_quality_avg: Math.round(avgSleepQuality * 10) / 10,
        },
        mindfulness: {
          score: mindfulnessScore,
          status: mindfulnessStatus,
          meditation_this_week: meditationSessions.length,
          breathing_this_week: breathingSessions.length,
        },
        growth: {
          score: growthScore,
          status: growthStatus,
          gratitude_count_week: gratitudeEntries.length,
          has_clear_values: userValues.length > 0,
          has_vision: visionItems.length > 0,
        },
      },
      smart_recommendations: recommendations.slice(0, 5),
      cross_dimension_insights: insights,
      encouragement,
    };

    console.log(`✅ 分析完成 - 整体得分: ${overallScore}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ AI生活教练错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

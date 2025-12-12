import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 获取所有用户
    const { data: users } = await supabase.auth.admin.listUsers();

    if (!users) {
      return new Response(JSON.stringify({ error: "无法获取用户列表" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const user of users.users) {
      const userId = user.id;
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 获取最近7天的打卡数据
      const { data: recentBriefings } = await supabase
        .from('briefings')
        .select('*, conversations!inner(user_id)')
        .eq('conversations.user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      const { data: recentQuickLogs } = await supabase
        .from('emotion_quick_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // 计算打卡次数
      const checkinCount = (recentBriefings?.length || 0) + (recentQuickLogs?.length || 0);

      // 获取最后打卡时间
      const lastBriefing = recentBriefings?.[0];
      const lastQuickLog = recentQuickLogs?.[0];
      const lastCheckinAt = lastBriefing || lastQuickLog 
        ? new Date(Math.max(
            new Date(lastBriefing?.created_at || 0).getTime(),
            new Date(lastQuickLog?.created_at || 0).getTime()
          ))
        : null;

      const daysSinceLastCheckin = lastCheckinAt 
        ? Math.floor((today.getTime() - lastCheckinAt.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      // 分析情绪趋势
      const { data: monthlyBriefings } = await supabase
        .from('briefings')
        .select('emotion_intensity, emotion_theme, created_at, conversations!inner(user_id)')
        .eq('conversations.user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('emotion_intensity', 'is', null)
        .order('created_at', { ascending: true });

      let emotionTrend = 'stable';
      let avgEmotionIntensity = null;
      let dominantEmotions: string[] = [];

      if (monthlyBriefings && monthlyBriefings.length > 0) {
        // 计算平均强度
        const intensities = monthlyBriefings.map(b => b.emotion_intensity).filter(i => i !== null);
        avgEmotionIntensity = intensities.length > 0 
          ? intensities.reduce((sum, i) => sum + i, 0) / intensities.length 
          : null;

        // 分析趋势（最近7天 vs 前7天）
        const recentIntensities = intensities.slice(-7);
        const previousIntensities = intensities.slice(-14, -7);
        
        if (recentIntensities.length >= 3 && previousIntensities.length >= 3) {
          const recentAvg = recentIntensities.reduce((sum, i) => sum + i, 0) / recentIntensities.length;
          const previousAvg = previousIntensities.reduce((sum, i) => sum + i, 0) / previousIntensities.length;
          
          if (recentAvg < previousAvg - 1) {
            emotionTrend = 'improving';
          } else if (recentAvg > previousAvg + 1) {
            emotionTrend = 'declining';
          } else {
            const variance = recentIntensities.reduce((sum, i) => sum + Math.pow(i - recentAvg, 2), 0) / recentIntensities.length;
            if (variance > 4) {
              emotionTrend = 'volatile';
            }
          }
        }

        // 找出主要情绪
        const emotionCounts: Record<string, number> = {};
        monthlyBriefings.forEach(b => {
          if (b.emotion_theme) {
            emotionCounts[b.emotion_theme] = (emotionCounts[b.emotion_theme] || 0) + 1;
          }
        });
        dominantEmotions = Object.entries(emotionCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([emotion]) => emotion);
      }

      // 获取活跃目标
      const { data: activeGoals } = await supabase
        .from('emotion_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      const activeGoalsCount = activeGoals?.length || 0;

      // 分析目标状态（简化版，实际应调用目标计算函数）
      let goalsOnTrack = 0;
      let goalsAtRisk = 0;
      
      if (activeGoals) {
        for (const goal of activeGoals) {
          const goalStart = new Date(goal.start_date);
          const goalEnd = new Date(goal.end_date);
          const now = new Date();
          const totalDays = (goalEnd.getTime() - goalStart.getTime()) / (24 * 60 * 60 * 1000);
          const elapsedDays = (now.getTime() - goalStart.getTime()) / (24 * 60 * 60 * 1000);
          const expectedProgress = Math.min(100, (elapsedDays / totalDays) * 100);
          
          // 简单判断：如果已过期或进度严重滞后
          if (now > goalEnd || expectedProgress > 50) {
            goalsAtRisk++;
          } else {
            goalsOnTrack++;
          }
        }
      }

      // 分层不活跃提醒阈值
      const inactivityThresholds = {
        mild: 3,      // 3天未使用 - 温柔提醒
        moderate: 7,  // 7天未使用 - 关心询问
        severe: 14    // 14天未使用 - 关怀回访
      };

      // 根据不活跃天数设置提醒级别
      let inactivityLevel: string | null = null;
      if (daysSinceLastCheckin !== null) {
        if (daysSinceLastCheckin >= inactivityThresholds.severe) {
          inactivityLevel = 'severe';
        } else if (daysSinceLastCheckin >= inactivityThresholds.moderate) {
          inactivityLevel = 'moderate';
        } else if (daysSinceLastCheckin >= inactivityThresholds.mild) {
          inactivityLevel = 'mild';
        }
      }

      // 判断需要什么类型的关注
      const needsEncouragement = checkinCount >= 5 || emotionTrend === 'improving';
      const needsReminder = daysSinceLastCheckin !== null && daysSinceLastCheckin >= inactivityThresholds.mild;
      const needsCare = emotionTrend === 'declining' || (avgEmotionIntensity !== null && avgEmotionIntensity >= 7);

      // 计算成长指标（包含不活跃级别）
      const growthIndicators = {
        consistency_score: Math.min(100, (checkinCount / 7) * 100),
        emotional_stability: emotionTrend === 'stable' ? 100 : emotionTrend === 'improving' ? 80 : 50,
        goal_engagement: activeGoalsCount > 0 ? Math.min(100, (goalsOnTrack / activeGoalsCount) * 100) : 0,
        inactivity_level: inactivityLevel,
        days_inactive: daysSinceLastCheckin
      };

      // 保存或更新分析结果
      const { error: upsertError } = await supabase
        .from('user_behavior_analysis')
        .upsert({
          user_id: userId,
          analysis_date: today.toISOString().split('T')[0],
          checkin_count: checkinCount,
          days_since_last_checkin: daysSinceLastCheckin,
          last_checkin_at: lastCheckinAt?.toISOString() || null,
          emotion_trend: emotionTrend,
          avg_emotion_intensity: avgEmotionIntensity,
          dominant_emotions: dominantEmotions,
          active_goals_count: activeGoalsCount,
          goals_on_track: goalsOnTrack,
          goals_at_risk: goalsAtRisk,
          needs_encouragement: needsEncouragement,
          needs_reminder: needsReminder,
          needs_care: needsCare,
          growth_indicators: growthIndicators,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,analysis_date'
        });

      if (upsertError) {
        console.error(`分析用户 ${userId} 失败:`, upsertError);
        continue;
      }

      results.push({
        user_id: userId,
        checkin_count: checkinCount,
        emotion_trend: emotionTrend,
        needs_encouragement: needsEncouragement,
        needs_reminder: needsReminder,
        needs_care: needsCare
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      analyzed_users: results.length,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("分析用户行为错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "分析过程出现错误" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 前瞻性预测场景
const PREDICTIVE_SCENARIOS = {
  emotion_trend_warning: 'emotion_trend_warning',      // 情绪趋势预警
  upcoming_milestone: 'upcoming_milestone',            // 里程碑冲刺
  weekly_rhythm_care: 'weekly_rhythm_care',            // 周节奏关怀
  pattern_breakthrough: 'pattern_breakthrough',        // 模式突破
  cycle_low_prevention: 'cycle_low_prevention',        // 周期低谷预防
  morning_intention: 'morning_intention',              // 晨间意向
  evening_reflection: 'evening_reflection',            // 晚间回顾
  memory_connection: 'memory_connection',              // 记忆连接
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 验证 CRON_SECRET
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "未授权访问" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { care_type } = await req.json().catch(() => ({ care_type: 'all' }));
    
    // 获取启用智能通知的活跃用户
    const { data: activeUsers } = await supabase.auth.admin.listUsers();
    if (!activeUsers) {
      return new Response(JSON.stringify({ error: "无法获取用户列表" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...

    for (const user of activeUsers.users) {
      const userId = user.id;

      // 检查用户通知设置
      const { data: profile } = await supabase
        .from('profiles')
        .select('smart_notification_enabled, notification_frequency, display_name')
        .eq('id', userId)
        .single();

      if (!profile?.smart_notification_enabled) continue;

      const triggeredScenarios: string[] = [];

      // 1. 情绪趋势预警 - 检测连续下降趋势
      if (care_type === 'all' || care_type === 'emotion_trend') {
        const trendResult = await detectEmotionTrend(supabase, userId);
        if (trendResult.shouldTrigger) {
          triggeredScenarios.push(PREDICTIVE_SCENARIOS.emotion_trend_warning);
          await triggerNotification(supabase, userId, 'emotion_trend_warning', {
            consecutive_days: trendResult.consecutiveDays,
            trend_direction: trendResult.direction,
            avg_intensity: trendResult.avgIntensity,
            dominant_emotions: trendResult.dominantEmotions,
          });
        }
      }

      // 2. 里程碑冲刺 - 目标进度>80%
      if (care_type === 'all' || care_type === 'milestone') {
        const milestoneResult = await detectUpcomingMilestone(supabase, userId);
        if (milestoneResult.shouldTrigger) {
          triggeredScenarios.push(PREDICTIVE_SCENARIOS.upcoming_milestone);
          await triggerNotification(supabase, userId, 'upcoming_milestone', {
            goal_description: milestoneResult.goalDescription,
            progress_percentage: milestoneResult.progress,
            remaining_count: milestoneResult.remaining,
          });
        }
      }

      // 3. 周节奏关怀 - 周一早晨 或 周五晚间
      if (care_type === 'all' || care_type === 'weekly_rhythm') {
        const isMonday = dayOfWeek === 1;
        const isFriday = dayOfWeek === 5;
        const isMorning = currentHour >= 7 && currentHour <= 9;
        const isEvening = currentHour >= 19 && currentHour <= 21;

        if ((isMonday && isMorning) || (isFriday && isEvening)) {
          triggeredScenarios.push(PREDICTIVE_SCENARIOS.weekly_rhythm_care);
          await triggerNotification(supabase, userId, 'weekly_rhythm_care', {
            rhythm_type: isMonday ? 'monday_morning' : 'friday_evening',
            display_name: profile.display_name,
          });
        }
      }

      // 4. 模式突破 - 检测积极变化
      if (care_type === 'all' || care_type === 'breakthrough') {
        const breakthroughResult = await detectPatternBreakthrough(supabase, userId);
        if (breakthroughResult.shouldTrigger) {
          triggeredScenarios.push(PREDICTIVE_SCENARIOS.pattern_breakthrough);
          await triggerNotification(supabase, userId, 'pattern_breakthrough', {
            breakthrough_type: breakthroughResult.type,
            improvement_detail: breakthroughResult.detail,
            comparison: breakthroughResult.comparison,
          });
        }
      }

      // 5. 周期低谷预防 - 识别用户历史低谷周期
      if (care_type === 'all' || care_type === 'cycle_prevention') {
        const cycleResult = await detectCyclicLow(supabase, userId);
        if (cycleResult.shouldTrigger) {
          triggeredScenarios.push(PREDICTIVE_SCENARIOS.cycle_low_prevention);
          await triggerNotification(supabase, userId, 'cycle_low_prevention', {
            predicted_low_day: cycleResult.predictedDay,
            historical_pattern: cycleResult.pattern,
            preventive_suggestion: cycleResult.suggestion,
          });
        }
      }

      // 6. 晨间意向 (8:00-9:00)
      if ((care_type === 'all' || care_type === 'morning') && currentHour === 8) {
        const morningResult = await buildMorningIntention(supabase, userId);
        if (morningResult.shouldTrigger) {
          triggeredScenarios.push(PREDICTIVE_SCENARIOS.morning_intention);
          await triggerNotification(supabase, userId, 'morning_intention', {
            yesterday_summary: morningResult.yesterdaySummary,
            today_intention: morningResult.intention,
            memory_hint: morningResult.memoryHint,
          });
        }
      }

      // 7. 晚间回顾 (21:00-22:00)
      if ((care_type === 'all' || care_type === 'evening') && currentHour === 21) {
        const eveningResult = await buildEveningReflection(supabase, userId);
        if (eveningResult.shouldTrigger) {
          triggeredScenarios.push(PREDICTIVE_SCENARIOS.evening_reflection);
          await triggerNotification(supabase, userId, 'evening_reflection', {
            today_activities: eveningResult.activities,
            positive_moment: eveningResult.positiveMoment,
            reflection_prompt: eveningResult.prompt,
          });
        }
      }

      // 8. 记忆连接 - 当识别到关联记忆时触发
      if (care_type === 'all' || care_type === 'memory') {
        const memoryResult = await detectMemoryConnection(supabase, userId);
        if (memoryResult.shouldTrigger) {
          triggeredScenarios.push(PREDICTIVE_SCENARIOS.memory_connection);
          await triggerNotification(supabase, userId, 'memory_connection', {
            connected_memory: memoryResult.memory,
            connection_type: memoryResult.type,
            days_ago: memoryResult.daysAgo,
          });
        }
      }

      if (triggeredScenarios.length > 0) {
        results.push({
          user_id: userId,
          triggered_scenarios: triggeredScenarios,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed_users: activeUsers.users.length,
      triggered_count: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("前瞻性关怀触发错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ error: "触发过程出现错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ========== 辅助函数 ==========

async function triggerNotification(supabase: any, userId: string, scenario: string, context: any) {
  try {
    await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-smart-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          scenario,
          context,
          user_id: userId
        })
      }
    );
  } catch (error) {
    console.error(`触发通知失败 [${userId}/${scenario}]:`, error);
  }
}

// 检测情绪趋势
async function detectEmotionTrend(supabase: any, userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const { data: briefings } = await supabase
    .from('briefings')
    .select('emotion_intensity, emotion_theme, created_at, conversations!inner(user_id)')
    .eq('conversations.user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .not('emotion_intensity', 'is', null)
    .order('created_at', { ascending: true });

  if (!briefings || briefings.length < 3) {
    return { shouldTrigger: false };
  }

  // 计算趋势 - 检查是否连续3天上升
  const recentThree = briefings.slice(-3);
  let consecutiveRise = 0;
  
  for (let i = 1; i < recentThree.length; i++) {
    if (recentThree[i].emotion_intensity > recentThree[i-1].emotion_intensity) {
      consecutiveRise++;
    }
  }

  // 情绪强度上升意味着情绪变差（强度越高越负面）
  if (consecutiveRise >= 2) {
    const avgIntensity = recentThree.reduce((sum: number, b: any) => sum + b.emotion_intensity, 0) / recentThree.length;
    const emotions = recentThree.map((b: any) => b.emotion_theme).filter(Boolean);
    
    return {
      shouldTrigger: avgIntensity >= 6, // 只有当平均强度>=6时才触发
      consecutiveDays: consecutiveRise + 1,
      direction: 'rising',
      avgIntensity: avgIntensity.toFixed(1),
      dominantEmotions: [...new Set(emotions)],
    };
  }

  return { shouldTrigger: false };
}

// 检测即将达成的里程碑
async function detectUpcomingMilestone(supabase: any, userId: string) {
  const { data: goals } = await supabase
    .from('emotion_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!goals || goals.length === 0) {
    return { shouldTrigger: false };
  }

  for (const goal of goals) {
    // 简化的进度计算
    const startDate = new Date(goal.start_date);
    const endDate = new Date(goal.end_date);
    const now = new Date();
    
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const progress = Math.min(100, (elapsedDays / totalDays) * 100);

    // 进度 80%-95% 之间触发冲刺提醒
    if (progress >= 80 && progress < 95) {
      return {
        shouldTrigger: true,
        goalDescription: goal.goal_type === 'emotion_records' ? '情绪记录目标' : goal.goal_description || '成长目标',
        progress: Math.round(progress),
        remaining: Math.ceil(totalDays - elapsedDays),
      };
    }
  }

  return { shouldTrigger: false };
}

// 检测积极模式突破
async function detectPatternBreakthrough(supabase: any, userId: string) {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 获取前一周和本周的数据
  const { data: recentBriefings } = await supabase
    .from('briefings')
    .select('emotion_intensity, created_at, conversations!inner(user_id)')
    .eq('conversations.user_id', userId)
    .gte('created_at', fourteenDaysAgo.toISOString())
    .not('emotion_intensity', 'is', null);

  if (!recentBriefings || recentBriefings.length < 4) {
    return { shouldTrigger: false };
  }

  const thisWeek = recentBriefings.filter((b: any) => new Date(b.created_at) >= sevenDaysAgo);
  const lastWeek = recentBriefings.filter((b: any) => new Date(b.created_at) < sevenDaysAgo);

  if (thisWeek.length < 2 || lastWeek.length < 2) {
    return { shouldTrigger: false };
  }

  const thisWeekAvg = thisWeek.reduce((sum: number, b: any) => sum + b.emotion_intensity, 0) / thisWeek.length;
  const lastWeekAvg = lastWeek.reduce((sum: number, b: any) => sum + b.emotion_intensity, 0) / lastWeek.length;

  // 情绪强度显著降低（降低>=1.5）视为突破
  if (lastWeekAvg - thisWeekAvg >= 1.5) {
    return {
      shouldTrigger: true,
      type: 'emotion_improvement',
      detail: `情绪状态明显改善`,
      comparison: `本周平均${thisWeekAvg.toFixed(1)}分 vs 上周${lastWeekAvg.toFixed(1)}分`,
    };
  }

  // 检查记录频率突破
  if (thisWeek.length >= lastWeek.length * 1.5 && thisWeek.length >= 4) {
    return {
      shouldTrigger: true,
      type: 'engagement_increase',
      detail: '记录频率显著提升',
      comparison: `本周${thisWeek.length}次 vs 上周${lastWeek.length}次`,
    };
  }

  return { shouldTrigger: false };
}

// 检测周期性低谷
async function detectCyclicLow(supabase: any, userId: string) {
  // 获取过去30天的数据来识别周期
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const { data: briefings } = await supabase
    .from('briefings')
    .select('emotion_intensity, created_at, conversations!inner(user_id)')
    .eq('conversations.user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .not('emotion_intensity', 'is', null)
    .order('created_at', { ascending: true });

  if (!briefings || briefings.length < 7) {
    return { shouldTrigger: false };
  }

  // 简单的周期检测：找出过去高强度日的星期几
  const highIntensityDays: number[] = [];
  for (const b of briefings) {
    if (b.emotion_intensity >= 7) {
      const dayOfWeek = new Date(b.created_at).getDay();
      highIntensityDays.push(dayOfWeek);
    }
  }

  if (highIntensityDays.length < 2) {
    return { shouldTrigger: false };
  }

  // 统计哪天最容易出现高强度情绪
  const dayCounts: Record<number, number> = {};
  for (const day of highIntensityDays) {
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  const sortedDays = Object.entries(dayCounts).sort(([,a], [,b]) => b - a);
  if (sortedDays.length === 0 || sortedDays[0][1] < 2) {
    return { shouldTrigger: false };
  }

  const riskDay = parseInt(sortedDays[0][0]);
  const today = new Date().getDay();
  const daysUntilRisk = (riskDay - today + 7) % 7;

  // 在风险日前1-2天触发预防性关怀
  if (daysUntilRisk === 1 || daysUntilRisk === 2) {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      shouldTrigger: true,
      predictedDay: dayNames[riskDay],
      pattern: `历史数据显示${dayNames[riskDay]}情绪波动较大`,
      suggestion: '提前准备一些放松活动',
    };
  }

  return { shouldTrigger: false };
}

// 构建晨间意向
async function buildMorningIntention(supabase: any, userId: string) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const { data: yesterdayBriefings } = await supabase
    .from('briefings')
    .select('emotion_theme, insight, conversations!inner(user_id)')
    .eq('conversations.user_id', userId)
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: memories } = await supabase
    .from('user_coach_memory')
    .select('content, memory_type')
    .eq('user_id', userId)
    .order('importance_score', { ascending: false })
    .limit(1);

  // 只对有数据的用户触发
  if (!yesterdayBriefings?.length && !memories?.length) {
    return { shouldTrigger: false };
  }

  return {
    shouldTrigger: true,
    yesterdaySummary: yesterdayBriefings?.[0]?.emotion_theme || '平静的一天',
    intention: '今天也请温柔地对待自己',
    memoryHint: memories?.[0]?.content || null,
  };
}

// 构建晚间回顾
async function buildEveningReflection(supabase: any, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayBriefings } = await supabase
    .from('briefings')
    .select('emotion_theme, emotion_intensity, conversations!inner(user_id)')
    .eq('conversations.user_id', userId)
    .gte('created_at', today)
    .order('created_at', { ascending: false });

  // 只对今天有活动的用户触发
  if (!todayBriefings?.length) {
    return { shouldTrigger: false };
  }

  const activities = todayBriefings.length;
  const lowestIntensity = Math.min(...todayBriefings.map((b: any) => b.emotion_intensity || 10));
  
  return {
    shouldTrigger: true,
    activities,
    positiveMoment: lowestIntensity <= 4 ? '今天有平静的时刻' : null,
    prompt: '回想今天让你微笑的一个小瞬间',
  };
}

// 检测记忆连接
async function detectMemoryConnection(supabase: any, userId: string) {
  // 查找7天前的重要记忆
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

  const { data: memories } = await supabase
    .from('user_coach_memory')
    .select('content, memory_type, created_at')
    .eq('user_id', userId)
    .gte('created_at', eightDaysAgo.toISOString())
    .lte('created_at', sevenDaysAgo.toISOString())
    .eq('memory_type', 'insight')
    .order('importance_score', { ascending: false })
    .limit(1);

  if (!memories?.length) {
    return { shouldTrigger: false };
  }

  return {
    shouldTrigger: true,
    memory: memories[0].content,
    type: memories[0].memory_type,
    daysAgo: 7,
  };
}

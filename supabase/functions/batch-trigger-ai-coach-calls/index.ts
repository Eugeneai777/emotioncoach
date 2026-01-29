import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TriggerResult {
  user_id: string;
  scenario: string;
  success: boolean;
  error?: string;
}

interface AICallPreferences {
  late_night_companion?: boolean;
  gratitude_reminder?: boolean;
  emotion_check?: boolean;
  reactivation?: boolean;
  camp_followup?: boolean;
  care?: boolean;
  todo_reminder?: boolean;
  course_recommendation?: boolean;
  smart_companion?: boolean;
}

// 随机触发概率（避免同一时间大量来电）
const shouldTriggerNow = (probability: number = 0.15): boolean => {
  return Math.random() < probability;
};

// 扩展时间窗口检查（替代固定时间点）
const isInTimeWindow = (h: number, m: number, windows: { start: number; end: number }[]): boolean => {
  const currentTime = h * 60 + m;
  return windows.some(w => currentTime >= w.start * 60 && currentTime < w.end * 60);
};

interface GratitudeSlots {
  morning?: boolean;
  noon?: boolean;
  evening?: boolean;
}

interface TodoSlots {
  morning?: boolean;
  noon?: boolean;
  evening?: boolean;
}

// 🔧 检查用户是否启用了该场景的AI来电
const checkUserCallPreference = async (
  supabase: any, 
  userId: string, 
  scenario: string,
  timeSlot?: 'morning' | 'noon' | 'evening'
): Promise<boolean> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('ai_call_enabled, ai_call_preferences, gratitude_reminder_slots, todo_reminder_slots')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.log(`[checkPreference] User ${userId}: no profile found, defaulting to enabled`);
      return true; // 默认开启
    }

    // 全局开关
    if (profile.ai_call_enabled === false) {
      console.log(`[checkPreference] User ${userId}: global AI call disabled`);
      return false;
    }

    // 场景开关
    const preferences = (profile.ai_call_preferences as AICallPreferences) || {};
    if (preferences[scenario as keyof AICallPreferences] === false) {
      console.log(`[checkPreference] User ${userId}: scenario ${scenario} disabled`);
      return false;
    }

    // 感恩提醒时段检查
    if (scenario === 'gratitude_reminder' && timeSlot) {
      const slots = (profile.gratitude_reminder_slots as GratitudeSlots) || {};
      if (slots[timeSlot] === false) {
        console.log(`[checkPreference] User ${userId}: gratitude slot ${timeSlot} disabled`);
        return false;
      }
    }

    // 待办提醒时段检查
    if (scenario === 'todo_reminder' && timeSlot) {
      const slots = (profile.todo_reminder_slots as TodoSlots) || {};
      if (slots[timeSlot] === false) {
        console.log(`[checkPreference] User ${userId}: todo slot ${timeSlot} disabled`);
        return false;
      }
    }

    return true;
  } catch (e) {
    console.error(`[checkPreference] Error checking preference for ${userId}:`, e);
    return true; // 出错时默认开启
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 验证 CRON_SECRET 或 service role
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { scenario, limit = 10 } = await req.json().catch(() => ({}));

    const results: TriggerResult[] = [];
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // 根据场景和时间选择目标用户
    let targetUsers: { user_id: string; context: Record<string, any> }[] = [];

    // ============ 智能伴随场景（每15分钟检查活跃用户）============
    if (scenario === 'smart_companion' || !scenario) {
      // 查找1-10分钟内活跃的用户（正在使用但还没有对话）
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id, display_name, last_seen_at')
        .gte('last_seen_at', tenMinutesAgo)
        .lt('last_seen_at', oneMinuteAgo)
        .limit(limit);

      if (activeUsers && activeUsers.length > 0) {
        console.log(`[smart_companion] Found ${activeUsers.length} recently active users`);
        
        for (const user of activeUsers) {
          try {
            // 检查今天是否已经收到过智能伴随来电（每天最多1次）
            const { data: existingCalls } = await supabase
              .from('ai_coach_calls')
              .select('id')
              .eq('user_id', user.id)
              .eq('scenario', 'smart_companion')
              .gte('created_at', todayStart)
              .limit(1);

            if (existingCalls && existingCalls.length > 0) {
              console.log(`[smart_companion] User ${user.id} already received call today`);
              continue;
            }

            // 检查用户偏好
            const isEnabled = await checkUserCallPreference(supabase, user.id, 'smart_companion');
            if (!isEnabled) {
              console.log(`[smart_companion] User ${user.id} has disabled smart_companion`);
              continue;
            }

            // 25%概率触发（避免过于频繁）
            if (!shouldTriggerNow(0.25)) {
              console.log(`[smart_companion] Skipping user ${user.id} - random probability`);
              continue;
            }

            // 触发智能伴随来电
            const { error } = await supabase.functions.invoke('initiate-ai-call', {
              body: {
                user_id: user.id,
                scenario: 'smart_companion',
                coach_type: 'vibrant_life',
                context: { trigger_reason: 'active_without_interaction' },
              },
            });

            results.push({
              user_id: user.id,
              scenario: 'smart_companion',
              success: !error,
              error: error?.message,
            });
          } catch (e) {
            results.push({
              user_id: user.id,
              scenario: 'smart_companion',
              success: false,
              error: e instanceof Error ? e.message : 'Unknown error',
            });
          }
        }
      }
    }

    // ============ 久未活跃唤回场景（扩展时间窗口：13:00-15:00）============
    const isReactivationTime = isInTimeWindow(hour, minute, [{ start: 13, end: 15 }]);
    if (scenario === 'reactivation' || (!scenario && isReactivationTime && shouldTriggerNow(0.2))) {
      // 7天未活跃用户唤回（下午2点）
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: inactiveUsers } = await supabase
        .from('profiles')
        .select('id, display_name')
        .lt('last_seen_at', sevenDaysAgo)
        .limit(limit);

      if (inactiveUsers) {
        targetUsers = inactiveUsers.map((u) => ({
          user_id: u.id,
          context: {
            days_inactive: Math.floor((now.getTime() - new Date(sevenDaysAgo).getTime()) / (24 * 60 * 60 * 1000)),
          },
        }));
      }

      for (const target of targetUsers) {
        try {
          // 🔧 检查用户偏好
          const isEnabled = await checkUserCallPreference(supabase, target.user_id, 'reactivation');
          if (!isEnabled) {
            console.log(`User ${target.user_id} has disabled reactivation calls`);
            continue;
          }

          const { error } = await supabase.functions.invoke('initiate-ai-call', {
            body: {
              user_id: target.user_id,
              scenario: 'reactivation',
              coach_type: 'vibrant_life',
              context: target.context,
            },
          });

          results.push({
            user_id: target.user_id,
            scenario: 'reactivation',
            success: !error,
            error: error?.message,
          });
        } catch (e) {
          results.push({
            user_id: target.user_id,
            scenario: 'reactivation',
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      }
    }

    // ============ 情绪关怀场景（扩展时间窗口：9:00-11:00）============
    const isEmotionCheckTime = isInTimeWindow(hour, minute, [{ start: 9, end: 11 }]);
    if (scenario === 'emotion_check' || (!scenario && isEmotionCheckTime && shouldTriggerNow(0.15))) {
      // 情绪低落用户关怀（上午10点）
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

      // 查找最近3天情绪强度持续较高（低落/焦虑）的用户
      const { data: emotionUsers } = await supabase
        .from('briefings')
        .select(`
          conversation:conversations!inner(user_id),
          emotion_intensity,
          emotion_theme
        `)
        .gte('created_at', threeDaysAgo)
        .gte('emotion_intensity', 7)
        .limit(limit);

      if (emotionUsers) {
        // 按用户聚合
        const userMap = new Map<string, { count: number; avgIntensity: number; themes: string[] }>();
        
        emotionUsers.forEach((b: any) => {
          const userId = b.conversation?.user_id;
          if (!userId) return;
          
          const existing = userMap.get(userId) || { count: 0, avgIntensity: 0, themes: [] };
          existing.count++;
          existing.avgIntensity = (existing.avgIntensity * (existing.count - 1) + (b.emotion_intensity || 0)) / existing.count;
          if (b.emotion_theme) existing.themes.push(b.emotion_theme);
          userMap.set(userId, existing);
        });

        // 筛选连续情绪波动的用户
        for (const [userId, stats] of userMap) {
          if (stats.count >= 2 && stats.avgIntensity >= 6) {
            try {
              const { error } = await supabase.functions.invoke('initiate-ai-call', {
                body: {
                  user_id: userId,
                  scenario: 'emotion_check',
                  coach_type: 'emotion',
                  context: {
                    recent_emotion: stats.themes.slice(-1)[0],
                    avg_intensity: stats.avgIntensity,
                  },
                },
              });

              results.push({
                user_id: userId,
                scenario: 'emotion_check',
                success: !error,
                error: error?.message,
              });
            } catch (e) {
              results.push({
                user_id: userId,
                scenario: 'emotion_check',
                success: false,
                error: e instanceof Error ? e.message : 'Unknown error',
              });
            }
          }
        }
      }
    }

    if (scenario === 'camp_followup' || (!scenario && hour === 20)) {
      // 训练营未完成任务提醒（晚上8点）
      const today = now.toISOString().split('T')[0];

      const { data: incompleteTasks } = await supabase
        .from('camp_daily_progress')
        .select('user_id, camp_id, camp:training_camps(camp_type)')
        .eq('progress_date', today)
        .eq('is_checked_in', false)
        .limit(limit);

      if (incompleteTasks) {
        for (const task of incompleteTasks) {
          try {
            const campType = (task as any).camp?.camp_type || 'emotion';
            
            const { error } = await supabase.functions.invoke('initiate-ai-call', {
              body: {
                user_id: task.user_id,
                scenario: 'camp_followup',
                coach_type: campType === 'wealth' ? 'wealth' : 'vibrant_life',
                context: {
                  camp_id: task.camp_id,
                  camp_type: campType,
                },
              },
            });

            results.push({
              user_id: task.user_id,
              scenario: 'camp_followup',
              success: !error,
              error: error?.message,
            });
          } catch (e) {
            results.push({
              user_id: task.user_id,
              scenario: 'camp_followup',
              success: false,
              error: e instanceof Error ? e.message : 'Unknown error',
            });
          }
        }
      }
    }

    // 深夜陪伴场景（22:00-01:00触发）
    if (scenario === 'late_night_companion' || (!scenario && (hour >= 22 || hour <= 1))) {
      // 查找15分钟内活跃的用户
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id, display_name')
        .gte('last_seen_at', fifteenMinutesAgo)
        .limit(limit);

      if (activeUsers) {
        for (const user of activeUsers) {
          try {
            // 检查这些用户近期是否有情绪波动（3天内 emotion_intensity >= 6）
            const { data: recentEmotions } = await supabase
              .from('briefings')
              .select(`
                emotion_intensity, 
                emotion_theme,
                conversation:conversations!inner(user_id)
              `)
              .eq('conversations.user_id', user.id)
              .gte('created_at', threeDaysAgo)
              .gte('emotion_intensity', 6)
              .order('created_at', { ascending: false })
              .limit(3);

            // 至少有1次情绪波动才触发
            if (recentEmotions && recentEmotions.length >= 1) {
              const { error } = await supabase.functions.invoke('initiate-ai-call', {
                body: {
                  user_id: user.id,
                  scenario: 'late_night_companion',
                  coach_type: 'emotion',
                  context: {
                    time_of_day: 'late_night',
                    recent_emotion: recentEmotions[0]?.emotion_theme,
                    emotion_intensity: recentEmotions[0]?.emotion_intensity,
                  },
                },
              });

              results.push({
                user_id: user.id,
                scenario: 'late_night_companion',
                success: !error,
                error: error?.message,
              });
            }
          } catch (e) {
            results.push({
              user_id: user.id,
              scenario: 'late_night_companion',
              success: false,
              error: e instanceof Error ? e.message : 'Unknown error',
            });
          }
        }
      }
    }

    // ============ 感恩提醒场景（扩展时间窗口）============
    // 早晨：7:00-9:00，中午：11:30-13:30，晚上：20:30-22:00
    const getGratitudeTimeSlot = (h: number, m: number): 'morning' | 'noon' | 'evening' | null => {
      if (h >= 7 && h < 9) return 'morning';
      if ((h === 11 && m >= 30) || (h === 12) || (h === 13 && m < 30)) return 'noon';
      if ((h === 20 && m >= 30) || h === 21 || (h === 22 && m < 30)) return 'evening';
      return null;
    };
    
    const isGratitudeTime = (h: number, m: number) => getGratitudeTimeSlot(h, m) !== null;

    if (scenario === 'gratitude_reminder' || (!scenario && isGratitudeTime(hour, minute) && shouldTriggerNow(0.15))) {
      const currentSlot = getGratitudeTimeSlot(hour, minute);
      
      if (currentSlot) {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // 获取最近7天使用过感恩日记的用户
        const { data: gratitudeUsers } = await supabase
          .from('gratitude_entries')
          .select('user_id')
          .gte('created_at', sevenDaysAgo)
          .limit(500);

        if (gratitudeUsers) {
          // 去重获取唯一用户ID列表
          const uniqueUserIds = [...new Set(gratitudeUsers.map(e => e.user_id))];
          
          // 限制处理数量
          const usersToProcess = uniqueUserIds.slice(0, limit);

          for (const userId of usersToProcess) {
            try {
              // 检查今天该时段是否已经来电过
              const { data: existingCalls } = await supabase
                .from('ai_coach_calls')
                .select('id, context')
                .eq('user_id', userId)
                .eq('scenario', 'gratitude_reminder')
                .gte('created_at', todayStart)
                .limit(10);

              // 检查是否有相同时段的来电
              const hasCalledThisSlot = existingCalls?.some((call: any) => 
                call.context?.time_slot === currentSlot
              );

              if (hasCalledThisSlot) {
                console.log(`User ${userId} already received gratitude call for slot ${currentSlot} today`);
                continue;
              }

              // 触发感恩提醒来电
              const { error } = await supabase.functions.invoke('initiate-ai-call', {
                body: {
                  user_id: userId,
                  scenario: 'gratitude_reminder',
                  coach_type: 'gratitude',
                  context: {
                    time_slot: currentSlot,
                    time_of_day: currentSlot,
                  },
                },
              });

              results.push({
                user_id: userId,
                scenario: 'gratitude_reminder',
                success: !error,
                error: error?.message,
              });
            } catch (e) {
              results.push({
                user_id: userId,
                scenario: 'gratitude_reminder',
                success: false,
                error: e instanceof Error ? e.message : 'Unknown error',
              });
            }
          }
        }
      }
    }

    // ============ 待办提醒场景（扩展时间窗口）============
    // 早晨：7:00-9:00，中午：11:30-13:30，晚上：20:00-22:00
    const getTodoTimeSlot = (h: number, m: number): 'morning' | 'noon' | 'evening' | null => {
      if (h >= 7 && h < 9) return 'morning';
      if ((h === 11 && m >= 30) || (h === 12) || (h === 13 && m < 30)) return 'noon';
      if (h >= 20 && h < 22) return 'evening';
      return null;
    };
    
    const isTodoTime = (h: number, m: number) => getTodoTimeSlot(h, m) !== null;

    const getTodoScenario = (slot: 'morning' | 'noon' | 'evening'): 'todo_morning' | 'todo_noon' | 'todo_evening' => {
      return `todo_${slot}` as 'todo_morning' | 'todo_noon' | 'todo_evening';
    };

    if (scenario?.startsWith('todo_') || (!scenario && isTodoTime(hour, minute) && shouldTriggerNow(0.15))) {
      const currentSlot = getTodoTimeSlot(hour, minute);
      
      if (currentSlot) {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const currentTodoScenario = getTodoScenario(currentSlot);

        // 获取最近7天有活动的用户
        const { data: activeUsers } = await supabase
          .from('profiles')
          .select('id')
          .gte('last_seen_at', sevenDaysAgo)
          .limit(limit);

        if (activeUsers) {
          for (const user of activeUsers) {
            try {
              // 检查用户偏好
              const isEnabled = await checkUserCallPreference(supabase, user.id, 'todo_reminder', currentSlot);
              if (!isEnabled) {
                console.log(`User ${user.id} has disabled todo_reminder for slot ${currentSlot}`);
                continue;
              }

              // 检查今天该时段是否已经来电过
              const { data: existingCalls } = await supabase
                .from('ai_coach_calls')
                .select('id')
                .eq('user_id', user.id)
                .eq('scenario', currentTodoScenario)
                .gte('created_at', todayStart)
                .limit(1);

              if (existingCalls && existingCalls.length > 0) {
                console.log(`User ${user.id} already received ${currentTodoScenario} call today`);
                continue;
              }

              // 获取今日待办（中午和晚上需要）
              let pendingTodos: { id: string; title: string; priority: string }[] = [];
              if (currentSlot !== 'morning') {
                const today = now.toISOString().split('T')[0];
                const { data: todos } = await supabase
                  .from('daily_todos')
                  .select('id, title, priority, completed')
                  .eq('user_id', user.id)
                  .eq('date', today);
                
                pendingTodos = (todos || []).filter((t: any) => !t.completed).map((t: any) => ({
                  id: t.id,
                  title: t.title,
                  priority: t.priority,
                }));
              }

              // 触发待办提醒来电
              const { error } = await supabase.functions.invoke('initiate-ai-call', {
                body: {
                  user_id: user.id,
                  scenario: currentTodoScenario,
                  coach_type: 'vibrant_life',
                  context: {
                    time_slot: currentSlot,
                    ...(pendingTodos.length > 0 && { pending_todos: pendingTodos }),
                  },
                },
              });

              results.push({
                user_id: user.id,
                scenario: currentTodoScenario,
                success: !error,
                error: error?.message,
              });
            } catch (e) {
              results.push({
                user_id: user.id,
                scenario: currentTodoScenario,
                success: false,
                error: e instanceof Error ? e.message : 'Unknown error',
              });
            }
          }
        }
      }
    }

    // 课程推荐场景（每周三 10:00 触发）
    const isCourseRecommendationTime = (h: number, dayOfWeek: number) => {
      return dayOfWeek === 3 && h === 10; // 周三上午10点
    };

    if (scenario === 'course_recommendation' || (!scenario && isCourseRecommendationTime(hour, now.getDay()))) {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // 获取最近7天活跃的用户
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id, display_name')
        .gte('last_seen_at', sevenDaysAgo)
        .limit(limit);

      if (activeUsers) {
        for (const user of activeUsers) {
          try {
            // 检查用户偏好
            const isEnabled = await checkUserCallPreference(supabase, user.id, 'course_recommendation');
            if (!isEnabled) {
              console.log(`User ${user.id} has disabled course_recommendation calls`);
              continue;
            }

            // 获取用户学习进度
            const { data: watchHistory } = await supabase
              .from('video_watch_history')
              .select('video_id, completed, watched_at')
              .eq('user_id', user.id)
              .gte('watched_at', thirtyDaysAgo)
              .order('watched_at', { ascending: false })
              .limit(20);

            const watchedVideoIds = watchHistory?.map(w => w.video_id) || [];
            const completedCount = watchHistory?.filter(w => w.completed)?.length || 0;

            // 获取用户收藏但未观看的课程
            const { data: favorites } = await supabase
              .from('video_favorites')
              .select('video_id')
              .eq('user_id', user.id);

            const favoriteVideoIds = favorites?.map(f => f.video_id) || [];
            const unwatchedFavorites = favoriteVideoIds.filter(id => !watchedVideoIds.includes(id));

            // 获取用户最近情绪主题（用于智能推荐）
            const { data: recentBriefings } = await supabase
              .from('briefings')
              .select('emotion_theme, conversation:conversations!inner(user_id)')
              .eq('conversations.user_id', user.id)
              .gte('created_at', sevenDaysAgo)
              .order('created_at', { ascending: false })
              .limit(3);

            const emotionThemes = recentBriefings?.map(b => b.emotion_theme).filter(Boolean) || [];

            // 检查本周是否已经发送过课程推荐来电
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const { data: existingCalls } = await supabase
              .from('ai_coach_calls')
              .select('id')
              .eq('user_id', user.id)
              .eq('scenario', 'course_recommendation')
              .gte('created_at', weekStart.toISOString())
              .limit(1);

            if (existingCalls && existingCalls.length > 0) {
              console.log(`User ${user.id} already received course_recommendation call this week`);
              continue;
            }

            // 触发课程推荐来电
            const { error } = await supabase.functions.invoke('initiate-ai-call', {
              body: {
                user_id: user.id,
                scenario: 'course_recommendation',
                coach_type: 'vibrant_life',
                context: {
                  watched_count: watchedVideoIds.length,
                  completed_count: completedCount,
                  unwatched_favorites_count: unwatchedFavorites.length,
                  recent_emotion_themes: emotionThemes,
                },
              },
            });

            results.push({
              user_id: user.id,
              scenario: 'course_recommendation',
              success: !error,
              error: error?.message,
            });
          } catch (e) {
            results.push({
              user_id: user.id,
              scenario: 'course_recommendation',
              success: false,
              error: e instanceof Error ? e.message : 'Unknown error',
            });
          }
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`Batch trigger completed: ${successCount}/${results.length} calls initiated`);

    return new Response(
      JSON.stringify({
        success: true,
        total: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch trigger error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

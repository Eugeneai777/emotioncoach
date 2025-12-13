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

    const { trigger_type, user_id, context } = await req.json();

    // 检查用户通知偏好
    const { data: profile } = await supabase
      .from('profiles')
      .select('smart_notification_enabled, notification_frequency')
      .eq('id', user_id)
      .single();

    if (!profile?.smart_notification_enabled) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "用户已关闭智能通知" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const frequency = profile.notification_frequency || 'balanced';

    // 检查最近通知频率
    const now = new Date();
    const recentWindow = frequency === 'frequent' ? 1 : frequency === 'balanced' ? 6 : 24; // 小时
    const recentCutoff = new Date(now.getTime() - recentWindow * 60 * 60 * 1000);

    const { data: recentNotifications, count } = await supabase
      .from('smart_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .gte('created_at', recentCutoff.toISOString());

    // 频率限制
    const maxNotifications = frequency === 'frequent' ? 10 : frequency === 'balanced' ? 5 : 2;
    if (count && count >= maxNotifications) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "通知频率限制" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 场景触发逻辑
    let shouldTrigger = false;
    let scenario = '';
    let notificationContext = context || {};

    switch (trigger_type) {
      case 'check_reminders':
        // 检查是否需要提醒打卡
        const { data: analysis } = await supabase
          .from('user_behavior_analysis')
          .select('*')
          .eq('user_id', user_id)
          .order('analysis_date', { ascending: false })
          .limit(1)
          .single();

        if (analysis?.needs_reminder) {
          shouldTrigger = true;
          scenario = 'inactivity';
          notificationContext = {
            days_inactive: analysis.days_since_last_checkin,
            active_goals_count: analysis.active_goals_count
          };
        }
        break;

      case 'check_encouragement':
        // 检查是否需要鼓励
        const { data: encourageAnalysis } = await supabase
          .from('user_behavior_analysis')
          .select('*')
          .eq('user_id', user_id)
          .order('analysis_date', { ascending: false })
          .limit(1)
          .single();

        if (encourageAnalysis?.needs_encouragement) {
          shouldTrigger = true;
          
          // 根据具体情况选择场景
          if (encourageAnalysis.emotion_trend === 'improving') {
            scenario = 'emotion_improvement';
            notificationContext = {
              emotion_trend: encourageAnalysis.emotion_trend,
              current_intensity: encourageAnalysis.avg_emotion_intensity
            };
          } else if (encourageAnalysis.checkin_count >= 5) {
            scenario = 'consistent_checkin';
            notificationContext = {
              streak_days: encourageAnalysis.checkin_count
            };
          }
        }
        break;

      case 'check_care':
        // 检查是否需要关怀
        const { data: careAnalysis } = await supabase
          .from('user_behavior_analysis')
          .select('*')
          .eq('user_id', user_id)
          .order('analysis_date', { ascending: false })
          .limit(1)
          .single();

        if (careAnalysis?.needs_care) {
          shouldTrigger = true;
          scenario = 'sustained_low_mood';
          notificationContext = {
            emotion_trend: careAnalysis.emotion_trend,
            avg_intensity: careAnalysis.avg_emotion_intensity,
            dominant_emotions: careAnalysis.dominant_emotions
          };
        }
        break;

      case 'after_briefing':
        // 简报后鼓励
        shouldTrigger = true;
        scenario = 'after_briefing';
        break;

      case 'goal_milestone':
        // 目标里程碑
        shouldTrigger = true;
        scenario = 'goal_milestone';
        break;

      case 'checkin_success':
        // 打卡成功确认
        shouldTrigger = true;
        scenario = 'checkin_success';
        notificationContext = {
          streak_days: context?.streak_days || 0
        };
        break;

      case 'checkin_streak_milestone':
        // 连续打卡里程碑
        shouldTrigger = true;
        scenario = 'checkin_streak_milestone';
        notificationContext = {
          milestone_days: context?.milestone_days || 0
        };
        break;

      case 'checkin_reminder':
        // 每日打卡提醒
        const today = new Date().toISOString().split('T')[0];
        const { data: todayBriefings, count: todayCount } = await supabase
          .from('briefings')
          .select('id', { count: 'exact' })
          .eq('conversation_id', context?.conversation_id || '')
          .gte('created_at', today);

        if (!todayCount || todayCount === 0) {
          shouldTrigger = true;
          scenario = 'checkin_reminder';
          
          // 计算连续打卡天数
          const { data: recentBriefings } = await supabase
            .from('briefings')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(30);

          let streakDays = 0;
          if (recentBriefings && recentBriefings.length > 0) {
            const dates = recentBriefings.map(b => new Date(b.created_at).toISOString().split('T')[0]);
            const uniqueDates = [...new Set(dates)];
            
            for (let i = 1; i < uniqueDates.length; i++) {
              const prevDate = new Date(uniqueDates[i]);
              const currDate = new Date(uniqueDates[i - 1]);
              const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                streakDays++;
              } else {
                break;
              }
            }
          }
          
          notificationContext = {
            streak_days: streakDays
          };
        }
        break;

      case 'checkin_streak_break_warning':
        // 打卡即将中断警告
        const currentHour = new Date().getHours();
        if (currentHour >= 22) { // 晚上10点后
          const todayDate = new Date().toISOString().split('T')[0];
          const { count: todayCheckinCount } = await supabase
            .from('briefings')
            .select('id', { count: 'exact' })
            .eq('conversation_id', context?.conversation_id || '')
            .gte('created_at', todayDate);

          if (!todayCheckinCount || todayCheckinCount === 0) {
            // 计算连续天数
            const { data: recentBriefings } = await supabase
              .from('briefings')
              .select('created_at')
              .order('created_at', { ascending: false })
              .limit(30);

            if (recentBriefings && recentBriefings.length > 0) {
              const dates = recentBriefings.map(b => new Date(b.created_at).toISOString().split('T')[0]);
              const uniqueDates = [...new Set(dates)];
              
              let streakDays = 0;
              for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = new Date(uniqueDates[i]);
                const currDate = new Date(uniqueDates[i - 1]);
                const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                  streakDays++;
                } else {
                  break;
                }
              }
              
              if (streakDays >= 3) { // 只有连续3天以上才触发
                shouldTrigger = true;
                scenario = 'checkin_streak_break_warning';
                notificationContext = {
                  streak_days: streakDays
                };
              }
            }
          }
        }
        break;

      case 'after_gratitude_analysis':
        // 感恩报告生成后
        shouldTrigger = true;
        scenario = 'after_gratitude_analysis';
        notificationContext = {
          report_type: context?.report_type || 'weekly',
          dimensions_count: context?.dimensions_count || 0,
          highlight_dimension: context?.highlight_dimension || ''
        };
        break;

      default:
        return new Response(JSON.stringify({ 
          error: "未知的触发类型" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!shouldTrigger) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "未满足触发条件" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 调用生成通知函数（传入 user_id 用于批量触发模式）
    const generateResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-smart-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          scenario,
          context: notificationContext,
          user_id: user_id  // 传入用户ID用于批量触发
        })
      }
    );

    const result = await generateResponse.json();

    return new Response(JSON.stringify({ 
      success: true,
      triggered: shouldTrigger,
      scenario,
      notification: result.notification
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("触发通知错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "触发通知过程出现错误" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

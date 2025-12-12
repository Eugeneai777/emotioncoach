import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 不活跃天数阈值
const INACTIVITY_THRESHOLDS = {
  mild: 3,      // 3天未使用 - 温柔提醒
  moderate: 7,  // 7天未使用 - 关心询问
  severe: 14    // 14天未使用 - 关怀回访
};

// 去重时间窗口（天）
const DEDUP_WINDOWS = {
  mild: 7,      // 7天内最多1次
  moderate: 7,  // 7天内最多1次
  severe: 14    // 14天内最多1次
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('开始批量检查不活跃用户...');

    // 查找需要提醒的用户（久未使用 >= 3天）
    const { data: inactiveUsers, error: queryError } = await supabase
      .from('user_behavior_analysis')
      .select('user_id, days_since_last_checkin, active_goals_count, growth_indicators')
      .eq('needs_reminder', true)
      .gte('days_since_last_checkin', INACTIVITY_THRESHOLDS.mild)
      .order('analysis_date', { ascending: false });

    if (queryError) {
      console.error('查询不活跃用户失败:', queryError);
      throw queryError;
    }

    console.log(`找到 ${inactiveUsers?.length || 0} 条需要提醒的记录`);

    // 去重（每个用户只取最新分析）
    const uniqueUsers = new Map<string, {
      user_id: string;
      days_since_last_checkin: number;
      active_goals_count: number;
      growth_indicators: any;
    }>();

    inactiveUsers?.forEach(u => {
      if (!uniqueUsers.has(u.user_id)) {
        uniqueUsers.set(u.user_id, u);
      }
    });

    console.log(`去重后 ${uniqueUsers.size} 位用户需要检查`);

    const results: Array<{
      user_id: string;
      inactivity_level: string;
      days_inactive: number;
      triggered: boolean;
      message?: string;
    }> = [];
    
    for (const [userId, userData] of uniqueUsers) {
      const daysInactive = userData.days_since_last_checkin;
      
      // 确定不活跃级别
      let inactivityLevel: 'mild' | 'moderate' | 'severe';
      if (daysInactive >= INACTIVITY_THRESHOLDS.severe) {
        inactivityLevel = 'severe';
      } else if (daysInactive >= INACTIVITY_THRESHOLDS.moderate) {
        inactivityLevel = 'moderate';
      } else {
        inactivityLevel = 'mild';
      }

      // 根据级别确定去重窗口
      const dedupDays = DEDUP_WINDOWS[inactivityLevel];
      const dedupCutoff = new Date(Date.now() - dedupDays * 24 * 60 * 60 * 1000).toISOString();

      // 检查去重窗口内是否已发送过不活跃提醒
      const { data: recentInactivity } = await supabase
        .from('smart_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('scenario', 'inactivity')
        .gte('created_at', dedupCutoff)
        .limit(1);

      if (recentInactivity && recentInactivity.length > 0) {
        console.log(`用户 ${userId} 在 ${dedupDays} 天内已发送过不活跃提醒，跳过`);
        results.push({
          user_id: userId,
          inactivity_level: inactivityLevel,
          days_inactive: daysInactive,
          triggered: false,
          message: `${dedupDays}天内已发送过提醒`
        });
        continue;
      }

      // 检查用户是否启用了智能通知
      const { data: profile } = await supabase
        .from('profiles')
        .select('smart_notification_enabled')
        .eq('id', userId)
        .single();

      if (profile?.smart_notification_enabled === false) {
        console.log(`用户 ${userId} 已关闭智能通知，跳过`);
        results.push({
          user_id: userId,
          inactivity_level: inactivityLevel,
          days_inactive: daysInactive,
          triggered: false,
          message: '用户已关闭智能通知'
        });
        continue;
      }

      // 调用 trigger-notifications 触发提醒
      try {
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              trigger_type: 'check_reminders',
              user_id: userId,
              context: {
                days_inactive: daysInactive,
                active_goals_count: userData.active_goals_count,
                inactivity_level: inactivityLevel
              }
            })
          }
        );

        const result = await response.json();
        console.log(`用户 ${userId} 触发结果:`, result);
        
        results.push({
          user_id: userId,
          inactivity_level: inactivityLevel,
          days_inactive: daysInactive,
          triggered: result.success || result.triggered,
          message: result.message
        });
      } catch (fetchError) {
        console.error(`调用 trigger-notifications 失败:`, fetchError);
        results.push({
          user_id: userId,
          inactivity_level: inactivityLevel,
          days_inactive: daysInactive,
          triggered: false,
          message: '调用触发函数失败'
        });
      }
    }

    const triggeredCount = results.filter(r => r.triggered).length;
    console.log(`批量不活跃提醒完成: ${triggeredCount}/${results.length} 成功触发`);

    return new Response(JSON.stringify({
      success: true,
      total_checked: results.length,
      notified_users: triggeredCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("批量触发不活跃提醒错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "批量触发过程出现错误",
      details: e instanceof Error ? e.message : "unknown"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

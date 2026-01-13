import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Validate cron secret for scheduled batch operations
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔔 开始批量检查未完成行动提醒...');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

    // 查找所有有未完成行动的用户（行动生成超过4小时）
    const { data: pendingActions, error: queryError } = await supabase
      .from('wealth_journal_entries')
      .select(`
        user_id,
        giving_action,
        day_number,
        created_at,
        camp_id
      `)
      .not('giving_action', 'is', null)
      .is('action_completed_at', null)
      .lt('created_at', fourHoursAgo)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('查询未完成行动失败:', queryError);
      throw queryError;
    }

    console.log(`📋 找到 ${pendingActions?.length || 0} 条未完成行动`);

    if (!pendingActions || pendingActions.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: '没有需要提醒的未完成行动',
        triggered: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 按用户分组，每个用户只取最新的一条未完成行动
    const userActionsMap = new Map<string, typeof pendingActions[0]>();
    for (const action of pendingActions) {
      if (!userActionsMap.has(action.user_id)) {
        userActionsMap.set(action.user_id, action);
      }
    }

    console.log(`👥 涉及 ${userActionsMap.size} 个用户`);

    let triggeredCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 遍历每个用户检查并触发提醒
    for (const [userId, action] of userActionsMap) {
      try {
        // 检查用户是否启用了智能通知
        const { data: profile } = await supabase
          .from('profiles')
          .select('smart_notification_enabled, notification_frequency')
          .eq('id', userId)
          .single();

        if (!profile?.smart_notification_enabled) {
          console.log(`⏭️ 用户 ${userId} 未启用智能通知，跳过`);
          skippedCount++;
          continue;
        }

        // 检查今天是否已发送过 pending_action_reminder
        const { count: todayReminderCount } = await supabase
          .from('smart_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('scenario', 'pending_action_reminder')
          .gte('created_at', today);

        if (todayReminderCount && todayReminderCount > 0) {
          console.log(`⏭️ 用户 ${userId} 今天已收到行动提醒，跳过`);
          skippedCount++;
          continue;
        }

        // 触发提醒
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              trigger_type: 'pending_action_reminder',
              user_id: userId,
              context: {
                giving_action: action.giving_action,
                day_number: action.day_number,
                camp_id: action.camp_id
              }
            })
          }
        );

        const result = await response.json();
        
        if (result.success && result.triggered) {
          console.log(`✅ 已为用户 ${userId} 触发行动提醒`);
          triggeredCount++;
        } else {
          console.log(`⚠️ 用户 ${userId} 触发提醒失败:`, result.message || '未知原因');
          skippedCount++;
        }
      } catch (userError) {
        const errorMsg = userError instanceof Error ? userError.message : '未知错误';
        console.error(`❌ 处理用户 ${userId} 时出错:`, errorMsg);
        errors.push(`${userId}: ${errorMsg}`);
      }
    }

    console.log(`🏁 批量行动提醒完成: 触发 ${triggeredCount}, 跳过 ${skippedCount}, 错误 ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: `批量行动提醒完成`,
      total_pending: userActionsMap.size,
      triggered: triggeredCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("批量行动提醒错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({
      error: "批量行动提醒过程出现错误",
      details: e instanceof Error ? e.message : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

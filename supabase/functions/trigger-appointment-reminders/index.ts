import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

// 提醒时间配置（分钟）
const REMINDER_TIMES = [60, 15]; // 提前1小时和15分钟提醒
const DAY_BEFORE_HOUR = 20; // 前一天晚上8点提醒

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret for scheduled batch operations
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    console.log('开始检查需要发送提醒的预约...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 获取当前北京时间
    const now = new Date();
    const beijingOffset = 8 * 60 * 60 * 1000;
    const beijingNow = new Date(now.getTime() + beijingOffset);
    const todayDate = beijingNow.toISOString().split('T')[0];
    const currentTime = beijingNow.toISOString().split('T')[1].substring(0, 5);
    const currentHour = beijingNow.getUTCHours();

    console.log(`当前北京时间: ${todayDate} ${currentTime}, 小时: ${currentHour}`);

    const results: { 
      appointmentId: string; 
      scenario: string;
      recipientType: string;
      sent: boolean;
      reason?: string;
    }[] = [];

    // ====== 1. 前一天晚上提醒（晚上8点时检查明天的预约）======
    if (currentHour === DAY_BEFORE_HOUR) {
      const tomorrow = new Date(beijingNow);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      console.log(`检查明天(${tomorrowDate})的预约，发送前一天提醒...`);

      const { data: tomorrowAppointments, error: tomorrowError } = await supabaseClient
        .from('coaching_appointments')
        .select('id, user_id, coach_id, appointment_date, start_time, status')
        .eq('appointment_date', tomorrowDate)
        .eq('status', 'confirmed');

      if (!tomorrowError && tomorrowAppointments) {
        for (const appointment of tomorrowAppointments) {
          // 发送用户提醒
          const userResult = await sendNotificationWithDedup(
            supabaseClient,
            appointment.id,
            appointment.user_id,
            'appointment_reminder',
            'user',
            24 * 60 // 24小时提前提醒
          );
          results.push({
            appointmentId: appointment.id,
            scenario: 'appointment_reminder_day_before',
            recipientType: 'user',
            ...userResult
          });

          // 发送教练提醒
          const coachResult = await sendNotificationWithDedup(
            supabaseClient,
            appointment.id,
            appointment.coach_id,
            'coach_appointment_reminder',
            'coach',
            24 * 60
          );
          results.push({
            appointmentId: appointment.id,
            scenario: 'coach_appointment_reminder_day_before',
            recipientType: 'coach',
            ...coachResult
          });
        }
      }
    }

    // ====== 2. 当天提醒（1小时和15分钟）======
    const { data: appointments, error: appError } = await supabaseClient
      .from('coaching_appointments')
      .select('id, user_id, coach_id, appointment_date, start_time, status')
      .eq('appointment_date', todayDate)
      .eq('status', 'confirmed');

    if (appError) {
      throw appError;
    }

    console.log(`找到 ${appointments?.length || 0} 个今日预约`);

    for (const appointment of appointments || []) {
      // 计算距离开始的分钟数
      const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
      const [currentHourNum, currentMinuteNum] = currentTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const currentMinutes = currentHourNum * 60 + currentMinuteNum;
      const minutesUntilStart = startMinutes - currentMinutes;

      // 检查是否需要发送提醒（允许10分钟的误差范围以支持每15分钟的cron执行）
      for (const reminderTime of REMINDER_TIMES) {
        if (minutesUntilStart <= reminderTime && minutesUntilStart > reminderTime - 10) {
          console.log(`预约 ${appointment.id} 距离开始 ${minutesUntilStart} 分钟，发送 ${reminderTime} 分钟提醒`);
          
          // 发送用户提醒
          const userResult = await sendNotificationWithDedup(
            supabaseClient,
            appointment.id,
            appointment.user_id,
            'appointment_reminder',
            'user',
            minutesUntilStart
          );
          results.push({
            appointmentId: appointment.id,
            scenario: `appointment_reminder_${reminderTime}min`,
            recipientType: 'user',
            ...userResult
          });

          // 发送教练提醒
          const coachResult = await sendNotificationWithDedup(
            supabaseClient,
            appointment.id,
            appointment.coach_id,
            'coach_appointment_reminder',
            'coach',
            minutesUntilStart
          );
          results.push({
            appointmentId: appointment.id,
            scenario: `coach_appointment_reminder_${reminderTime}min`,
            recipientType: 'coach',
            ...coachResult
          });
        }
      }
    }

    // ====== 3. 检查已完成的预约，发送评价邀请 ======
    const { data: completedAppointments, error: completedError } = await supabaseClient
      .from('coaching_appointments')
      .select('id, user_id, updated_at, reviewed_at')
      .eq('status', 'completed')
      .is('reviewed_at', null);

    if (!completedError && completedAppointments) {
      for (const appointment of completedAppointments) {
        const updatedAt = new Date(appointment.updated_at);
        const hoursSinceCompletion = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

        // 完成后1-2小时发送评价邀请
        if (hoursSinceCompletion >= 1 && hoursSinceCompletion < 2) {
          console.log(`预约 ${appointment.id} 已完成 ${hoursSinceCompletion.toFixed(1)} 小时，发送评价邀请`);
          
          const reviewResult = await sendNotificationWithDedup(
            supabaseClient,
            appointment.id,
            appointment.user_id,
            'review_invitation',
            'user'
          );
          
          results.push({
            appointmentId: appointment.id,
            scenario: 'review_invitation',
            recipientType: 'user',
            ...reviewResult
          });

          if (reviewResult.sent) {
            // 标记已发送评价邀请（避免重复发送）
            await supabaseClient
              .from('coaching_appointments')
              .update({ reviewed_at: now.toISOString() })
              .eq('id', appointment.id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: appointments?.length || 0,
        results,
        timestamp: beijingNow.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('预约提醒检查失败:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 带防重复检查的通知发送
async function sendNotificationWithDedup(
  supabaseClient: any,
  appointmentId: string,
  recipientId: string,
  scenario: string,
  recipientType: 'user' | 'coach',
  minutesBefore?: number
): Promise<{ sent: boolean; reason?: string }> {
  try {
    // 检查是否已发送过相同场景的通知
    const { data: existingLog, error: logError } = await supabaseClient
      .from('appointment_notification_logs')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('scenario', scenario)
      .eq('recipient_id', recipientId)
      .maybeSingle();

    if (logError) {
      console.warn(`检查通知日志失败 ${appointmentId}:`, logError);
    }

    if (existingLog) {
      console.log(`通知已发送过，跳过: ${scenario} -> ${recipientId}`);
      return { sent: false, reason: 'already_sent' };
    }

    // 调用通知函数
    const notifyBody: any = {
      scenario,
      appointmentId,
    };

    if (recipientType === 'coach') {
      notifyBody.coachId = recipientId;
    } else {
      notifyBody.userId = recipientId;
    }

    if (minutesBefore !== undefined) {
      notifyBody.minutesBefore = minutesBefore;
    }

    const { data: notifyResult, error: notifyError } = await supabaseClient.functions.invoke(
      'send-appointment-notification',
      { body: notifyBody }
    );

    if (notifyError) {
      console.error(`发送提醒失败 ${appointmentId}:`, notifyError);
      return { sent: false, reason: notifyError.message };
    }

    if (!notifyResult?.success) {
      console.log(`通知未发送 ${appointmentId}:`, notifyResult?.reason);
      return { sent: false, reason: notifyResult?.reason };
    }

    console.log(`提醒发送成功 ${appointmentId}:`, notifyResult);
    return { sent: true };

  } catch (error) {
    console.error(`发送提醒异常 ${appointmentId}:`, error);
    return { sent: false, reason: String(error) };
  }
}

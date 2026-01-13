import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

// 提醒时间配置（分钟）
const REMINDER_TIMES = [60, 15]; // 提前1小时和15分钟提醒

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

    console.log(`当前北京时间: ${todayDate} ${currentTime}`);

    // 获取今天所有已确认的预约
    const { data: appointments, error: appError } = await supabaseClient
      .from('coaching_appointments')
      .select('id, user_id, appointment_date, start_time, status')
      .eq('appointment_date', todayDate)
      .eq('status', 'confirmed');

    if (appError) {
      throw appError;
    }

    console.log(`找到 ${appointments?.length || 0} 个今日预约`);

    const results: { appointmentId: string; minutesBefore: number; sent: boolean }[] = [];

    for (const appointment of appointments || []) {
      // 计算距离开始的分钟数
      const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const currentMinutes = currentHour * 60 + currentMinute;
      const minutesUntilStart = startMinutes - currentMinutes;

      // 检查是否需要发送提醒
      for (const reminderTime of REMINDER_TIMES) {
        // 允许5分钟的误差范围
        if (minutesUntilStart <= reminderTime && minutesUntilStart > reminderTime - 5) {
          console.log(`预约 ${appointment.id} 距离开始 ${minutesUntilStart} 分钟，发送 ${reminderTime} 分钟提醒`);
          
          try {
            // 调用通知函数
            const { data: notifyResult, error: notifyError } = await supabaseClient.functions.invoke(
              'send-appointment-notification',
              {
                body: {
                  userId: appointment.user_id,
                  scenario: 'appointment_reminder',
                  appointmentId: appointment.id,
                  minutesBefore: minutesUntilStart,
                },
              }
            );

            if (notifyError) {
              console.error(`发送提醒失败 ${appointment.id}:`, notifyError);
              results.push({ appointmentId: appointment.id, minutesBefore: reminderTime, sent: false });
            } else {
              console.log(`提醒发送成功 ${appointment.id}:`, notifyResult);
              results.push({ appointmentId: appointment.id, minutesBefore: reminderTime, sent: true });
            }
          } catch (error) {
            console.error(`发送提醒异常 ${appointment.id}:`, error);
            results.push({ appointmentId: appointment.id, minutesBefore: reminderTime, sent: false });
          }
        }
      }
    }

    // 检查已完成的预约，发送评价邀请
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
          
          try {
            const { error: notifyError } = await supabaseClient.functions.invoke(
              'send-appointment-notification',
              {
                body: {
                  userId: appointment.user_id,
                  scenario: 'review_invitation',
                  appointmentId: appointment.id,
                },
              }
            );

            if (!notifyError) {
              // 标记已发送评价邀请（避免重复发送）
              await supabaseClient
                .from('coaching_appointments')
                .update({ reviewed_at: now.toISOString() })
                .eq('id', appointment.id);
            }
          } catch (error) {
            console.error(`发送评价邀请异常 ${appointment.id}:`, error);
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

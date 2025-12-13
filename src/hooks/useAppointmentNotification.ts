import { supabase } from '@/integrations/supabase/client';

export type AppointmentNotificationScenario = 
  | 'appointment_confirmed'      // 预约确认
  | 'appointment_reminder'       // 预约开始提醒
  | 'review_invitation'          // 评价邀请
  | 'appointment_cancelled'      // 预约取消
  | 'appointment_rescheduled';   // 预约改期

interface SendNotificationParams {
  userId: string;
  scenario: AppointmentNotificationScenario;
  appointmentId: string;
  minutesBefore?: number;
}

export const useAppointmentNotification = () => {
  const sendNotification = async (params: SendNotificationParams): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-appointment-notification', {
        body: params,
      });

      if (error) {
        console.error('发送预约通知失败:', error);
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        console.log('通知未发送:', data?.reason);
        return { success: false, error: data?.reason };
      }

      console.log('预约通知发送成功:', data);
      return { success: true };
    } catch (error) {
      console.error('发送预约通知异常:', error);
      return { success: false, error: String(error) };
    }
  };

  // 发送预约确认通知
  const sendConfirmationNotification = async (userId: string, appointmentId: string) => {
    return sendNotification({
      userId,
      scenario: 'appointment_confirmed',
      appointmentId,
    });
  };

  // 发送预约提醒通知
  const sendReminderNotification = async (userId: string, appointmentId: string, minutesBefore: number) => {
    return sendNotification({
      userId,
      scenario: 'appointment_reminder',
      appointmentId,
      minutesBefore,
    });
  };

  // 发送评价邀请通知
  const sendReviewInvitation = async (userId: string, appointmentId: string) => {
    return sendNotification({
      userId,
      scenario: 'review_invitation',
      appointmentId,
    });
  };

  // 发送取消通知
  const sendCancellationNotification = async (userId: string, appointmentId: string) => {
    return sendNotification({
      userId,
      scenario: 'appointment_cancelled',
      appointmentId,
    });
  };

  return {
    sendNotification,
    sendConfirmationNotification,
    sendReminderNotification,
    sendReviewInvitation,
    sendCancellationNotification,
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CoachNotification {
  id: string;
  type: 'new_appointment' | 'appointment_confirmed' | 'appointment_cancelled' | 'new_review' | 'system';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export const useCoachNotifications = (coachId: string | undefined) => {
  const [notifications, setNotifications] = useState<CoachNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 加载通知数据
  const loadNotifications = async () => {
    if (!coachId) return;

    try {
      // 获取最近的预约（作为通知）
      const { data: appointments, error: appointmentsError } = await supabase
        .from('coaching_appointments')
        .select(`
          id,
          status,
          appointment_date,
          start_time,
          end_time,
          service_name,
          created_at,
          user_id
        `)
        .eq('coach_id', coachId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (appointmentsError) throw appointmentsError;

      // 获取最近的评价
      const { data: reviews, error: reviewsError } = await supabase
        .from('appointment_reviews')
        .select(`
          id,
          rating_overall,
          comment,
          created_at,
          user_id
        `)
        .eq('coach_id', coachId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;

      // 获取智能通知（教练相关）
      const { data: user } = await supabase.auth.getUser();
      let systemNotifications: any[] = [];
      
      if (user?.user?.id) {
        const { data: smartNotifications } = await supabase
          .from('smart_notifications')
          .select('*')
          .eq('user_id', user.user.id)
          .eq('coach_type', 'human_coach')
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })
          .limit(10);
        
        systemNotifications = smartNotifications || [];
      }

      // 转换为统一的通知格式
      const appointmentNotifications: CoachNotification[] = (appointments || []).map(apt => ({
        id: `apt_${apt.id}`,
        type: apt.status === 'pending' ? 'new_appointment' : 
              apt.status === 'confirmed' ? 'appointment_confirmed' : 
              apt.status === 'cancelled' ? 'appointment_cancelled' : 'new_appointment',
        title: apt.status === 'pending' ? '新预约待确认' :
               apt.status === 'confirmed' ? '预约已确认' :
               apt.status === 'cancelled' ? '预约已取消' : '预约更新',
        message: `${apt.service_name || '咨询服务'} - ${apt.appointment_date} ${apt.start_time}`,
        data: apt,
        is_read: apt.status !== 'pending',
        created_at: apt.created_at
      }));

      const reviewNotifications: CoachNotification[] = (reviews || []).map(review => ({
        id: `review_${review.id}`,
        type: 'new_review' as const,
        title: '收到新评价',
        message: `${review.rating_overall}星评价${review.comment ? `: "${review.comment.slice(0, 50)}${review.comment.length > 50 ? '...' : ''}"` : ''}`,
        data: review,
        is_read: false,
        created_at: review.created_at
      }));

      const systemNotificationsList: CoachNotification[] = systemNotifications.map(n => ({
        id: `sys_${n.id}`,
        type: 'system' as const,
        title: n.title || '系统通知',
        message: n.message,
        data: n,
        is_read: n.is_read,
        created_at: n.created_at
      }));

      // 合并并按时间排序
      const allNotifications = [
        ...appointmentNotifications,
        ...reviewNotifications,
        ...systemNotificationsList
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('加载教练通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记为已读
  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // 如果是系统通知，更新数据库
    if (notificationId.startsWith('sys_')) {
      const realId = notificationId.replace('sys_', '');
      await supabase
        .from('smart_notifications')
        .update({ is_read: true })
        .eq('id', realId);
    }
  };

  // 标记全部已读
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    // 更新系统通知
    const { data: user } = await supabase.auth.getUser();
    if (user?.user?.id) {
      await supabase
        .from('smart_notifications')
        .update({ is_read: true })
        .eq('user_id', user.user.id)
        .eq('coach_type', 'human_coach');
    }
  };

  // 初始化加载
  useEffect(() => {
    loadNotifications();
  }, [coachId]);

  // 实时订阅新预约
  useEffect(() => {
    if (!coachId) return;

    const appointmentChannel = supabase
      .channel(`coach-appointments-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coaching_appointments',
          filter: `coach_id=eq.${coachId}`
        },
        (payload) => {
          const apt = payload.new as any;
          const newNotification: CoachNotification = {
            id: `apt_${apt.id}`,
            type: 'new_appointment',
            title: '新预约待确认',
            message: `${apt.service_name || '咨询服务'} - ${apt.appointment_date} ${apt.start_time}`,
            data: apt,
            is_read: false,
            created_at: apt.created_at
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast({
            title: "📅 新预约",
            description: `收到新的预约请求，请及时处理`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'coaching_appointments',
          filter: `coach_id=eq.${coachId}`
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    const reviewChannel = supabase
      .channel(`coach-reviews-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointment_reviews',
          filter: `coach_id=eq.${coachId}`
        },
        (payload) => {
          const review = payload.new as any;
          const newNotification: CoachNotification = {
            id: `review_${review.id}`,
            type: 'new_review',
            title: '收到新评价',
            message: `${review.rating_overall}星评价`,
            data: review,
            is_read: false,
            created_at: review.created_at
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast({
            title: "⭐ 新评价",
            description: `收到${review.rating_overall}星评价`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(reviewChannel);
    };
  }, [coachId, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };
};

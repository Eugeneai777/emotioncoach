import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SmartNotification {
  id: string;
  notification_type: string;
  scenario: string;
  title: string;
  message: string;
  icon?: string;
  action_text?: string;
  action_type?: string;
  action_data?: any;
  priority: number;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export const useSmartNotification = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 加载通知
  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('smart_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 标记为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('smart_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }, []);

  // 标记为已忽略
  const markAsDismissed = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('smart_notifications')
        .update({ 
          is_dismissed: true,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('忽略通知失败:', error);
    }
  }, [notifications]);

  // 触发通知生成
  const triggerNotification = useCallback(async (scenario: string, context?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('generate-smart-notification', {
        body: { scenario, context }
      });

      if (error) throw error;

      if (data?.success) {
        await loadNotifications();
        
        // 显示toast提示
        toast({
          title: data.notification.title,
          description: data.notification.message.substring(0, 60) + '...',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('触发通知失败:', error);
    }
  }, [loadNotifications, toast]);

  // 监听实时通知
  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('smart-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'smart_notifications'
        },
        (payload) => {
          const newNotification = payload.new as SmartNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // 显示toast
          toast({
            title: newNotification.title,
            description: newNotification.message.substring(0, 60) + '...',
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsDismissed,
    triggerNotification,
    refresh: loadNotifications
  };
};

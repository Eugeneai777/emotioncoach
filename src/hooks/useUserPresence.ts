import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5分钟

/**
 * 用户在线状态心跳 hook
 * 每5分钟更新一次 last_seen_at，用于深夜陪伴等场景检测用户在线状态
 */
export function useUserPresence() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const updatePresence = useCallback(async () => {
    if (!user?.id) return;

    // 防抖：至少间隔1分钟
    const now = Date.now();
    if (now - lastUpdateRef.current < 60000) return;
    lastUpdateRef.current = now;

    try {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('[UserPresence] Update failed:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // 立即更新一次
    updatePresence();

    // 设置定时心跳
    intervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // 页面可见性变化时更新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };

    // 页面聚焦时更新
    const handleFocus = () => {
      updatePresence();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, updatePresence]);
}

/**
 * 用户在线状态追踪组件
 * 在 App 中引入以自动追踪用户活跃状态
 */
export function UserPresenceTracker() {
  useUserPresence();
  return null;
}

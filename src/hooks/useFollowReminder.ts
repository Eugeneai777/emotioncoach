import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReminderConfig {
  cooldownHours: number;
  sessionInterval: number;
  afterDays: number[];
}

const DEFAULT_CONFIG: ReminderConfig = {
  cooldownHours: 72, // 增加到72小时冷却期
  sessionInterval: 3,
  afterDays: [7, 14, 21],
};

const STORAGE_KEYS = {
  LAST_SHOWN: 'follow_reminder_last_shown',
  SESSION_COUNT: 'follow_reminder_session_count',
  DISMISSED_UNTIL: 'follow_reminder_dismissed_until',
  HAS_FOLLOWED: 'follow_reminder_has_followed',
};

export type TriggerKey = 'after_purchase' | 'after_coach' | 'after_journal' | 'after_checkin' | 'manual';

interface UseFollowReminderReturn {
  shouldShowReminder: boolean;
  triggerKey: TriggerKey | null;
  showReminder: (trigger: TriggerKey) => void;
  hideReminder: () => void;
  markAsFollowed: () => Promise<void>;
  markAsDismissed: () => Promise<void>;
  markAsLater: () => Promise<void>;
  checkSubscribeStatus: () => Promise<boolean>;
  isSubscribed: boolean | null;
}

export function useFollowReminder(): UseFollowReminderReturn {
  const { user } = useAuth();
  const [shouldShowReminder, setShouldShowReminder] = useState(false);
  const [triggerKey, setTriggerKey] = useState<TriggerKey | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  // Check if user has already followed
  const checkSubscribeStatus = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // First check local storage for quick response
      const hasFollowed = localStorage.getItem(STORAGE_KEYS.HAS_FOLLOWED);
      if (hasFollowed === 'true') {
        setIsSubscribed(true);
        return true;
      }

      // Check database
      const { data: mapping } = await supabase
        .from('wechat_user_mappings')
        .select('subscribe_status')
        .eq('system_user_id', user.id)
        .maybeSingle();

      const subscribed = mapping?.subscribe_status === true;
      setIsSubscribed(subscribed);
      
      if (subscribed) {
        localStorage.setItem(STORAGE_KEYS.HAS_FOLLOWED, 'true');
      }

      return subscribed;
    } catch (error) {
      console.error('Error checking subscribe status:', error);
      return false;
    }
  }, [user]);

  // Check if reminder should be shown based on conditions
  const checkShouldShowReminder = useCallback(async () => {
    if (!user) return;

    // Already subscribed
    const subscribed = await checkSubscribeStatus();
    if (subscribed) {
      setShouldShowReminder(false);
      return;
    }

    // Check if dismissed recently
    const dismissedUntil = localStorage.getItem(STORAGE_KEYS.DISMISSED_UNTIL);
    if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
      return;
    }

    // Check cooldown
    const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN);
    if (lastShown) {
      const cooldownMs = DEFAULT_CONFIG.cooldownHours * 60 * 60 * 1000;
      if (Date.now() - new Date(lastShown).getTime() < cooldownMs) {
        return;
      }
    }

    // Removed auto-triggers (session_start, after_days)
    // Now only triggered explicitly at key moments via triggerFollowReminder()
  }, [user, checkSubscribeStatus]);

  // Initial check on mount
  useEffect(() => {
    if (user) {
      checkShouldShowReminder();
    }
  }, [user, checkShouldShowReminder]);

  // Show reminder with specific trigger - includes pre-checks
  const showReminder = useCallback(async (trigger: TriggerKey) => {
    // 先检查是否已关注
    const subscribed = await checkSubscribeStatus();
    if (subscribed) {
      console.log('用户已关注，跳过提示');
      return;
    }
    
    // 检查冷却期
    const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN);
    if (lastShown) {
      const cooldownMs = DEFAULT_CONFIG.cooldownHours * 60 * 60 * 1000;
      if (Date.now() - new Date(lastShown).getTime() < cooldownMs) {
        console.log('冷却期内，跳过提示');
        return;
      }
    }
    
    setTriggerKey(trigger);
    setShouldShowReminder(true);
    localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, new Date().toISOString());
  }, [checkSubscribeStatus]);

  // Hide reminder
  const hideReminder = useCallback(() => {
    setShouldShowReminder(false);
    setTriggerKey(null);
  }, []);

  // Mark as followed
  const markAsFollowed = useCallback(async () => {
    if (!user || !triggerKey) return;

    try {
      await supabase.from('follow_reminder_tracking').insert({
        user_id: user.id,
        trigger_key: triggerKey,
        action: 'followed',
      });

      localStorage.setItem(STORAGE_KEYS.HAS_FOLLOWED, 'true');
      setIsSubscribed(true);
      hideReminder();
    } catch (error) {
      console.error('Error marking as followed:', error);
    }
  }, [user, triggerKey, hideReminder]);

  // Mark as dismissed (longer cooldown)
  const markAsDismissed = useCallback(async () => {
    if (!user || !triggerKey) return;

    try {
      await supabase.from('follow_reminder_tracking').insert({
        user_id: user.id,
        trigger_key: triggerKey,
        action: 'dismissed',
      });

      // Dismiss for 7 days
      const dismissUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem(STORAGE_KEYS.DISMISSED_UNTIL, dismissUntil.toISOString());
      hideReminder();
    } catch (error) {
      console.error('Error marking as dismissed:', error);
    }
  }, [user, triggerKey, hideReminder]);

  // Mark as later (shorter cooldown)
  const markAsLater = useCallback(async () => {
    if (!user || !triggerKey) return;

    try {
      await supabase.from('follow_reminder_tracking').insert({
        user_id: user.id,
        trigger_key: triggerKey,
        action: 'later',
      });

      hideReminder();
    } catch (error) {
      console.error('Error marking as later:', error);
    }
  }, [user, triggerKey, hideReminder]);

  return {
    shouldShowReminder,
    triggerKey,
    showReminder,
    hideReminder,
    markAsFollowed,
    markAsDismissed,
    markAsLater,
    checkSubscribeStatus,
    isSubscribed,
  };
}

// Utility function to trigger reminder from anywhere
export function triggerFollowReminder(trigger: TriggerKey) {
  window.dispatchEvent(new CustomEvent('trigger-follow-reminder', { detail: { trigger } }));
}

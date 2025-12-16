import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

interface UseFreeTrialOptions {
  featureKey: string;
  defaultLimit?: number;
}

// 生成访客ID（未登录用户标识）
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

export function useFreeTrialTracking({ featureKey, defaultLimit = 5 }: UseFreeTrialOptions) {
  const { user } = useAuth();
  const storageKey = `${featureKey}_lifetime_uses`;
  
  const [usageCount, setUsageCount] = useState<number>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored, 10) : 0;
  });

  // 从数据库获取免费次数配置
  const { data: settings } = useQuery({
    queryKey: ['app-settings', `${featureKey}_free_trial`],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', `${featureKey}_free_trial`)
        .maybeSingle();
      
      if (error || !data) return { limit: defaultLimit, period: 'lifetime' };
      return data.setting_value as { limit: number; period: string };
    },
    staleTime: 1000 * 60 * 5, // 5分钟缓存
  });

  const freeLimit = settings?.limit ?? defaultLimit;
  const isLimitReached = usageCount >= freeLimit;
  const remainingFree = Math.max(0, freeLimit - usageCount);

  // 记录转化事件
  const trackEvent = useCallback(async (eventType: string, metadata: Record<string, any> = {}) => {
    try {
      await supabase.from('conversion_events').insert({
        event_type: eventType,
        feature_key: featureKey,
        visitor_id: getVisitorId(),
        user_id: user?.id || null,
        metadata: { ...metadata, usage_count: usageCount },
      });
    } catch (error) {
      console.error('Failed to track conversion event:', error);
    }
  }, [featureKey, user?.id, usageCount]);

  // 增加使用次数
  const incrementUsage = useCallback(() => {
    const newCount = usageCount + 1;
    localStorage.setItem(storageKey, newCount.toString());
    setUsageCount(newCount);
    
    // 记录使用事件
    trackEvent('feature_use', { new_count: newCount });
    
    // 首次达到免费上限
    if (newCount === freeLimit) {
      trackEvent('free_limit_reached');
    }
    
    return newCount;
  }, [usageCount, storageKey, freeLimit, trackEvent]);

  // 首次访问追踪
  useEffect(() => {
    const visitKey = `${featureKey}_visited`;
    if (!localStorage.getItem(visitKey)) {
      localStorage.setItem(visitKey, 'true');
      trackEvent('first_visit');
    }
  }, [featureKey, trackEvent]);

  return {
    usageCount,
    freeLimit,
    isLimitReached,
    remainingFree,
    incrementUsage,
    trackEvent,
  };
}

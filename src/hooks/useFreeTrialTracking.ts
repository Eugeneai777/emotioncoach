import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  
  // 从数据库获取用户使用次数
  const { data: usageData, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['user-feature-usage', featureKey, user?.id],
    queryFn: async () => {
      if (!user?.id) return { usage_count: 0 };
      
      const { data, error } = await supabase
        .from('user_feature_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('feature_key', featureKey)
        .maybeSingle();
      
      if (error) {
        console.error('Failed to fetch usage count:', error);
        return { usage_count: 0 };
      }
      
      return data || { usage_count: 0 };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5分钟缓存
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

  const usageCount = usageData?.usage_count ?? 0;
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

  // 增加使用次数（存储到数据库）
  const incrementUsage = useCallback(async () => {
    if (!user?.id) {
      console.warn('User not logged in, cannot track usage');
      return usageCount;
    }

    const newCount = usageCount + 1;
    
    try {
      // 使用 upsert 更新或插入使用记录
      const { error } = await supabase
        .from('user_feature_usage')
        .upsert({
          user_id: user.id,
          feature_key: featureKey,
          usage_count: newCount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,feature_key',
        });

      if (error) {
        console.error('Failed to update usage count:', error);
        return usageCount;
      }

      // 刷新缓存
      queryClient.invalidateQueries({ queryKey: ['user-feature-usage', featureKey, user.id] });
      
      // 记录使用事件
      trackEvent('feature_use', { new_count: newCount });
      
      // 首次达到免费上限
      if (newCount === freeLimit) {
        trackEvent('free_limit_reached');
      }
      
      return newCount;
    } catch (error) {
      console.error('Failed to increment usage:', error);
      return usageCount;
    }
  }, [user?.id, usageCount, featureKey, freeLimit, trackEvent, queryClient]);

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
    isLoading: isLoadingUsage,
  };
}

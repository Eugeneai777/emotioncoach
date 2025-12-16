import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const TOUR_STORAGE_PREFIX = 'page_tour_completed_';

export const usePageTour = (pageKey: string) => {
  const { user, loading: authLoading } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 检查引导是否已完成
  useEffect(() => {
    // 如果 pageKey 为空或认证还在加载，不执行检查
    if (!pageKey || authLoading) {
      return;
    }

    const checkTourStatus = async () => {
      setIsLoading(true);
      
      if (user) {
        // 已登录用户：从数据库检查
        try {
          const { data, error } = await supabase
            .from('page_tour_progress')
            .select('id')
            .eq('user_id', user.id)
            .eq('page_key', pageKey)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking tour status:', error);
            setShowTour(false);
          } else {
            // 如果没有记录，显示引导
            setShowTour(!data);
          }
        } catch (err) {
          console.error('Error checking tour status:', err);
          setShowTour(false);
        }
      } else {
        // 未登录用户：从 localStorage 检查
        const storageKey = `${TOUR_STORAGE_PREFIX}${pageKey}`;
        const completed = localStorage.getItem(storageKey);
        setShowTour(!completed);
      }
      
      setIsLoading(false);
    };

    checkTourStatus();
  }, [user, pageKey, authLoading]);

  // 完成引导
  const completeTour = useCallback(async () => {
    setShowTour(false);
    
    if (user) {
      // 已登录用户：保存到数据库
      try {
        await supabase
          .from('page_tour_progress')
          .upsert({
            user_id: user.id,
            page_key: pageKey,
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,page_key'
          });
      } catch (err) {
        console.error('Error saving tour progress:', err);
      }
    } else {
      // 未登录用户：保存到 localStorage
      const storageKey = `${TOUR_STORAGE_PREFIX}${pageKey}`;
      localStorage.setItem(storageKey, 'true');
    }
  }, [user, pageKey]);

  // 重新显示引导
  const resetTour = useCallback(() => {
    setShowTour(true);
  }, []);

  return {
    showTour: !isLoading && showTour,
    isLoading,
    completeTour,
    resetTour
  };
};

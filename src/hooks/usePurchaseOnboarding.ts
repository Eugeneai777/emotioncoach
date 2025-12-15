import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UsePurchaseOnboardingOptions {
  partnerId?: string;
}

export function usePurchaseOnboarding(options: UsePurchaseOnboardingOptions = {}) {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [triggerFeature, setTriggerFeature] = useState<string>('');
  const pendingActionRef = useRef<(() => void) | null>(null);

  // 检查用户是否有有效套餐
  const checkUserQuota = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('remaining_quota, quota_expires_at')
        .eq('user_id', userId)
        .single();

      if (error || !data) return false;

      // 检查是否有剩余额度
      if (data.remaining_quota <= 0) return false;

      // 检查是否过期
      if (data.quota_expires_at) {
        const expiresAt = new Date(data.quota_expires_at);
        if (expiresAt < new Date()) return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking user quota:', error);
      return false;
    }
  }, []);

  // 需要购买才能继续的操作
  const requirePurchase = useCallback(async (
    action: () => void,
    featureName?: string
  ): Promise<boolean> => {
    // 未登录 → 直接弹出购买
    if (!user) {
      pendingActionRef.current = action;
      setTriggerFeature(featureName || '使用此功能');
      setShowDialog(true);
      return false;
    }

    // 已登录，检查套餐
    const hasQuota = await checkUserQuota(user.id);
    if (!hasQuota) {
      pendingActionRef.current = action;
      setTriggerFeature(featureName || '使用此功能');
      setShowDialog(true);
      return false;
    }

    // 有套餐，直接执行
    action();
    return true;
  }, [user, checkUserQuota]);

  // 购买成功回调
  const handlePurchaseSuccess = useCallback(() => {
    setShowDialog(false);
    // 执行待处理操作
    if (pendingActionRef.current) {
      // 延迟执行，等待状态更新
      setTimeout(() => {
        pendingActionRef.current?.();
        pendingActionRef.current = null;
      }, 500);
    }
  }, []);

  // 关闭弹窗
  const handleDialogClose = useCallback((open: boolean) => {
    setShowDialog(open);
    if (!open) {
      pendingActionRef.current = null;
      setTriggerFeature('');
    }
  }, []);

  return {
    showDialog,
    setShowDialog: handleDialogClose,
    triggerFeature,
    requirePurchase,
    handlePurchaseSuccess,
    partnerId: options.partnerId
  };
}

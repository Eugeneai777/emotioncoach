import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface UsePaymentCallbackOptions {
  /** 支付成功后的回调函数 */
  onSuccess?: (orderNo: string) => void;
  /** 是否显示成功提示，默认 true */
  showToast?: boolean;
  /** 是否显示庆祝动画，默认 true */
  showConfetti?: boolean;
}

/**
 * 监听 URL 中的支付回调参数，自动验证订单状态并触发成功回调
 * 
 * 使用方式：
 * ```tsx
 * usePaymentCallback({
 *   onSuccess: (orderNo) => {
 *     console.log('支付成功:', orderNo);
 *     // 刷新数据或跳转
 *   }
 * });
 * ```
 */
export function usePaymentCallback(options: UsePaymentCallbackOptions = {}) {
  const { onSuccess, showToast = true, showConfetti = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const orderNo = searchParams.get('order');
  const paymentSuccess = searchParams.get('payment_success');

  const verifyAndHandlePayment = useCallback(async (orderNo: string) => {
    try {
      // 验证订单状态
      const { data, error } = await supabase.functions.invoke('check-order-status', {
        body: { orderNo },
      });

      if (error) throw error;

      if (data.status === 'paid') {
        // 清除 URL 参数
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('order');
        newParams.delete('payment_success');
        setSearchParams(newParams, { replace: true });

        // 显示成功提示
        if (showToast) {
          toast.success('支付成功！');
        }

        // 显示庆祝动画
        if (showConfetti) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }

        // 触发回调
        onSuccess?.(orderNo);
      } else if (data.status === 'pending') {
        // 订单还在等待支付，可能是用户取消了
        toast.info('订单支付未完成');
        
        // 清除参数
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('order');
        newParams.delete('payment_success');
        setSearchParams(newParams, { replace: true });
      }
    } catch (error) {
      console.error('验证订单状态失败:', error);
      // 静默失败，不影响用户体验
    }
  }, [searchParams, setSearchParams, onSuccess, showToast, showConfetti]);

  useEffect(() => {
    // 只有当同时存在 order 和 payment_success 参数时才验证
    if (orderNo && paymentSuccess === '1') {
      verifyAndHandlePayment(orderNo);
    }
  }, [orderNo, paymentSuccess, verifyAndHandlePayment]);

  return {
    /** 是否正在从支付回调中恢复 */
    isPaymentCallback: !!(orderNo && paymentSuccess === '1'),
    /** 订单号 */
    orderNo,
  };
}

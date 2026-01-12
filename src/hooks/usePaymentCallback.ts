import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface UsePaymentCallbackOptions {
  /** 支付成功后的回调函数 */
  onSuccess?: (orderNo: string, packageKey?: string) => void;
  /** 是否显示成功提示，默认 true */
  showToast?: boolean;
  /** 是否显示庆祝动画，默认 true */
  showConfetti?: boolean;
  /** 是否自动跳转到对应页面，默认 false（保持原有行为兼容性） */
  autoRedirect?: boolean;
  /** 处理优先级：page 级别会阻止 global 处理，默认 'page' */
  priority?: 'page' | 'global';
}

// 用于防止重复处理的 key
const PROCESSING_KEY = 'payment_callback_processing';

/**
 * 根据 packageKey 获取支付成功后的跳转路由
 */
function getRedirectRoute(packageKey: string, currentPath: string): string | null {
  // 如果已经在对应页面，不需要跳转
  const routeMap: Record<string, string[]> = {
    'wealth_block_assessment': ['/wealth-block', '/wealth-block-assessment', '/coach/wealth'],
    'basic': ['/profile', '/packages'],
    'member365': ['/profile', '/packages'],
    'youjin_partner_l3': ['/partner', '/partner/center'],
    'partner': ['/partner', '/partner/center'],
    'bloom_partner': ['/partner', '/partner/center'],
  };

  // 检查是否在训练营相关页面
  if (packageKey.startsWith('camp-')) {
    if (currentPath.includes('/camp') || currentPath.includes('/wealth-camp')) {
      return null; // 已经在训练营相关页面
    }
  }

  // 检查是否在合伙人相关页面（支持 partner_l* 格式）
  if (packageKey.startsWith('partner_l') || packageKey === 'partner' || packageKey === 'youjin_partner_l3' || packageKey === 'bloom_partner') {
    if (currentPath.startsWith('/partner')) {
      return null; // 已经在合伙人相关页面
    }
  }

  // 检查是否在对应页面
  for (const [key, paths] of Object.entries(routeMap)) {
    if (packageKey === key && paths.some(p => currentPath.startsWith(p))) {
      return null; // 已经在对应页面
    }
  }

  // 财富卡点测评 → 测评页面
  if (packageKey === 'wealth_block_assessment') {
    return '/wealth-block';
  }
  
  // 训练营购买 → 对应训练营页面
  if (packageKey.startsWith('camp-')) {
    const campType = packageKey.replace('camp-', '');
    // 财富觉醒训练营 → 财富日记打卡页
    if (campType === 'wealth_block_21' || campType === 'wealth_block_7' || campType === 'wealth_block') {
      return '/wealth-camp-checkin';
    }
    // 情感绽放训练营 → 训练营大厅
    if (campType === 'emotion_bloom') {
      return '/camps';
    }
    // UUID 格式的训练营（如 camp-c77488e9-...）→ 训练营大厅
    // 其他所有训练营类型 → 训练营大厅
    return '/camps';
  }
  
  // 合伙人套餐 → 合伙人中心（支持多种格式：partner, partner_l1, partner_l2, partner_l3, youjin_partner_l3, bloom_partner）
  if (packageKey === 'youjin_partner_l3' || 
      packageKey === 'partner' || 
      packageKey === 'bloom_partner' ||
      packageKey.startsWith('partner_l')) {
    return '/partner';
  }
  
  // 会员套餐 → 个人中心
  if (packageKey === 'basic' || packageKey === 'member365') {
    return '/profile';
  }
  
  // 默认不跳转
  return null;
}

/**
 * 监听 URL 中的支付回调参数，自动验证订单状态并触发成功回调
 * 
 * 使用方式：
 * ```tsx
 * // 方式1：页面级自定义处理（优先级高，会阻止全局处理）
 * usePaymentCallback({
 *   onSuccess: (orderNo, packageKey) => {
 *     console.log('支付成功:', orderNo, packageKey);
 *     // 自定义处理逻辑
 *   }
 * });
 * 
 * // 方式2：全局自动跳转（仅当没有页面级处理时生效）
 * usePaymentCallback({ autoRedirect: true, priority: 'global' });
 * ```
 */
export function usePaymentCallback(options: UsePaymentCallbackOptions = {}) {
  const { 
    onSuccess, 
    showToast = true, 
    showConfetti = true, 
    autoRedirect = false,
    priority = 'page'
  } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const processingRef = useRef(false);

  const orderNo = searchParams.get('order');
  const paymentSuccess = searchParams.get('payment_success');

  const verifyAndHandlePayment = useCallback(async (orderNo: string) => {
    // 检查是否已经在处理中
    const processingOrder = sessionStorage.getItem(PROCESSING_KEY);
    if (processingOrder === orderNo) {
      console.log('[PaymentCallback] Already processing order:', orderNo);
      return;
    }

    // 全局处理器需要延迟执行，给页面级处理器优先权
    if (priority === 'global') {
      // 等待一小段时间，看是否有页面级处理器先处理
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 再次检查是否已被处理
      const stillProcessing = sessionStorage.getItem(PROCESSING_KEY);
      if (stillProcessing === orderNo) {
        console.log('[PaymentCallback] Order already claimed by page handler:', orderNo);
        return;
      }
    }

    // 标记正在处理
    sessionStorage.setItem(PROCESSING_KEY, orderNo);
    processingRef.current = true;

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
        onSuccess?.(orderNo, data.packageKey);

        // 自动跳转（仅在全局模式且启用时）
        if (autoRedirect && priority === 'global' && data.packageKey) {
          const redirectRoute = getRedirectRoute(data.packageKey, location.pathname);
          if (redirectRoute) {
            console.log('[PaymentCallback] Auto redirecting to:', redirectRoute);
            // 延迟一下让用户看到成功提示
            setTimeout(() => {
              navigate(redirectRoute);
            }, 1000);
          }
        }
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
    } finally {
      // 清除处理标记
      sessionStorage.removeItem(PROCESSING_KEY);
      processingRef.current = false;
    }
  }, [searchParams, setSearchParams, onSuccess, showToast, showConfetti, autoRedirect, navigate, priority, location.pathname]);

  useEffect(() => {
    // 只有当同时存在 order 和 payment_success 参数时才验证
    if (orderNo && paymentSuccess === '1' && !processingRef.current) {
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

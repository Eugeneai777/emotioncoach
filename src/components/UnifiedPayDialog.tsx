/**
 * 统一支付弹窗组件
 * 
 * 支持用户手动选择支付方式（微信支付 / 支付宝），
 * 并根据终端类型设置智能默认值：
 * - 移动端浏览器（非微信、非小程序）→ 默认支付宝
 * - 微信浏览器 → 默认微信支付
 * - 微信小程序 → 仅微信支付（不可选择）
 * - 桌面端 → 默认微信支付
 */

import { useState, useEffect, useCallback } from 'react';
import { startPaymentFlow, trackPaymentEvent, endPaymentFlow, getCurrentFlowId } from '@/utils/paymentFlowTracker';
import { WechatPayDialog, type WechatPayDialogProps } from './WechatPayDialog';
import { AlipayPayDialog, type AlipayPayDialogProps } from './AlipayPayDialog';
import { isWeChatMiniProgram, isWeChatBrowser } from '@/utils/platform';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface ShippingInfo {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  idCardName?: string;
  idCardNumber?: string;
}

interface UnifiedPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageInfo: PackageInfo | null;
  onSuccess: () => void;
  returnUrl?: string;
  openId?: string;
  shippingInfo?: ShippingInfo;
}

type PayMethod = 'wechat' | 'alipay';
type Stage = 'select' | 'pay';

function getDefaultPayMethod(): PayMethod {
  const isMobile = /Android|iPhone|iPad|iPod|HarmonyOS/i.test(navigator.userAgent);
  const isWechat = isWeChatBrowser();
  const isMiniProgram = isWeChatMiniProgram();

  if (isMiniProgram || isWechat) return 'wechat';
  if (isMobile) return 'alipay';
  return 'wechat';
}

export function UnifiedPayDialog({
  open,
  onOpenChange,
  packageInfo,
  onSuccess,
  returnUrl,
  openId,
  shippingInfo,
}: UnifiedPayDialogProps) {
  const isMiniProgram = isWeChatMiniProgram();
  const [payMethod, setPayMethod] = useState<PayMethod>(getDefaultPayMethod);
  const [stage, setStage] = useState<Stage>('pay');
  // 🆕 每次 open 由 false→true 时自增的实例 key，强制 unmount 上一次的支付弹窗实例，
  // 彻底重置内部 state/refs（避免取消支付后第二次点击时残留状态导致卡在「正在调起支付」）
  const [instanceKey, setInstanceKey] = useState(0);
  const prevOpenRef = useRef(false);

  // Reset when dialog opens
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setInstanceKey((k) => k + 1);
      setPayMethod(getDefaultPayMethod());
      setStage('pay');
      // 埋点：支付弹窗打开
      if (!getCurrentFlowId()) {
        startPaymentFlow({
          productName: packageInfo?.name,
          amount: packageInfo?.price,
          packageKey: packageInfo?.key,
        });
      }
      trackPaymentEvent('payment_dialog_opened', {
        metadata: { payMethod: getDefaultPayMethod(), packageKey: packageInfo?.key },
      });
    }
    prevOpenRef.current = open;
  }, [open, packageInfo]);

  const handleSelect = useCallback((method: PayMethod) => {
    setPayMethod(method);
    setStage('pay');
  }, []);

  const handlePayDialogChange = useCallback((v: boolean) => {
    if (!v) {
      // 埋点：用户关闭支付弹窗
      trackPaymentEvent('payment_cancelled');
      endPaymentFlow();
      // 🆕 双保险：清理支付授权防抖标记，避免下次点击被错误跳过
      sessionStorage.removeItem('pay_auth_in_progress');
      onOpenChange(false);
    }
  }, [onOpenChange]);

  // 包装 onSuccess 以埋点支付成功
  const handleSuccess = useCallback(() => {
    trackPaymentEvent('payment_success', {
      metadata: { packageKey: packageInfo?.key, payMethod },
    });
    endPaymentFlow();
    onSuccess();
  }, [onSuccess, packageInfo, payMethod]);

  // 小程序环境：只能用微信支付，直接渲染
  if (isMiniProgram) {
    return (
      <WechatPayDialog
        open={open}
        onOpenChange={onOpenChange}
        packageInfo={packageInfo}
        onSuccess={handleSuccess}
        returnUrl={returnUrl}
        openId={openId}
        shippingInfo={shippingInfo}
      />
    );
  }

  // 阶段二：打开对应的支付弹窗
  if (stage === 'pay' && open) {
    if (payMethod === 'alipay') {
      return (
        <AlipayPayDialog
          open={true}
          onOpenChange={handlePayDialogChange}
          packageInfo={packageInfo}
          onSuccess={handleSuccess}
          returnUrl={returnUrl}
          shippingInfo={shippingInfo}
        />
      );
    }
    return (
      <WechatPayDialog
        // 🆕 用 flowId 作为 key，每次新支付流程强制 unmount 上一次实例，杜绝状态泄漏
        key={`${packageInfo?.key ?? 'pkg'}-${getCurrentFlowId() ?? 'noflow'}`}
        open={true}
        onOpenChange={handlePayDialogChange}
        packageInfo={packageInfo}
        onSuccess={handleSuccess}
        returnUrl={returnUrl}
        openId={openId}
        shippingInfo={shippingInfo}
      />
    );
  }

  // 阶段一：支付方式选择
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>选择支付方式</DialogTitle>
          <DialogDescription>
            {packageInfo ? `${packageInfo.name} — ¥${packageInfo.price}` : '请选择支付方式'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {/* 微信支付 */}
          <button
            onClick={() => handleSelect('wechat')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-[0.97]",
              "border-muted hover:border-green-500/50 hover:bg-green-50/50 dark:hover:bg-green-950/20"
            )}
          >
            <span className="text-3xl">💬</span>
            <span className="text-sm font-medium">微信支付</span>
          </button>

          {/* 支付宝 */}
          <button
            onClick={() => handleSelect('alipay')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-[0.97]",
              "border-muted hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
            )}
          >
            <span className="text-3xl">💙</span>
            <span className="text-sm font-medium">支付宝</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

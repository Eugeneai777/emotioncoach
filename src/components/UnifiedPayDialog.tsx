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

import { useState, useEffect } from 'react';
import { WechatPayDialog } from './WechatPayDialog';
import { AlipayPayDialog } from './AlipayPayDialog';
import { isWeChatMiniProgram, isWeChatBrowser } from '@/utils/platform';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface UnifiedPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageInfo: PackageInfo | null;
  onSuccess: () => void;
  returnUrl?: string;
  openId?: string;
}

type PayMethod = 'wechat' | 'alipay';

function getDefaultPayMethod(): PayMethod {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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
}: UnifiedPayDialogProps) {
  const isMiniProgram = isWeChatMiniProgram();
  const [payMethod, setPayMethod] = useState<PayMethod>(getDefaultPayMethod);

  // Reset pay method when dialog opens
  useEffect(() => {
    if (open) {
      setPayMethod(getDefaultPayMethod());
    }
  }, [open]);

  // 小程序环境：只能用微信支付，直接渲染
  if (isMiniProgram) {
    return (
      <WechatPayDialog
        open={open}
        onOpenChange={onOpenChange}
        packageInfo={packageInfo}
        onSuccess={onSuccess}
        returnUrl={returnUrl}
        openId={openId}
      />
    );
  }

  // 选择器 UI + 条件渲染对应支付弹窗
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="p-0 gap-0">
        {/* 支付方式选择器 */}
        <div className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-base">选择支付方式</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPayMethod('wechat')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 px-3 text-sm font-medium transition-all",
                payMethod === 'wechat'
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-600"
                  : "border-muted bg-muted/30 text-muted-foreground hover:border-muted-foreground/30"
              )}
            >
              <span className="text-lg">💬</span>
              微信支付
            </button>
            <button
              onClick={() => setPayMethod('alipay')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 px-3 text-sm font-medium transition-all",
                payMethod === 'alipay'
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-600"
                  : "border-muted bg-muted/30 text-muted-foreground hover:border-muted-foreground/30"
              )}
            >
              <span className="text-lg">💙</span>
              支付宝
            </button>
          </div>
        </div>

        {/* 支付内容区域 - 渲染对应子弹窗的内容 */}
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          {payMethod === 'wechat' ? (
            <WechatPayDialogInner
              packageInfo={packageInfo}
              onSuccess={onSuccess}
              onClose={() => onOpenChange(false)}
              returnUrl={returnUrl}
              openId={openId}
            />
          ) : (
            <AlipayPayDialogInner
              packageInfo={packageInfo}
              onSuccess={onSuccess}
              onClose={() => onOpenChange(false)}
              returnUrl={returnUrl}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 微信支付内嵌内容 — 直接复用 WechatPayDialog，
 * 但作为独立弹窗在外部 Dialog 关闭时同步关闭
 */
function WechatPayDialogInner({
  packageInfo,
  onSuccess,
  onClose,
  returnUrl,
  openId,
}: {
  packageInfo: PackageInfo | null;
  onSuccess: () => void;
  onClose: () => void;
  returnUrl?: string;
  openId?: string;
}) {
  // 使用 WechatPayDialog 作为独立弹窗，始终 open
  return (
    <WechatPayDialog
      open={true}
      onOpenChange={(v) => { if (!v) onClose(); }}
      packageInfo={packageInfo}
      onSuccess={onSuccess}
      returnUrl={returnUrl}
      openId={openId}
    />
  );
}

function AlipayPayDialogInner({
  packageInfo,
  onSuccess,
  onClose,
  returnUrl,
}: {
  packageInfo: PackageInfo | null;
  onSuccess: () => void;
  onClose: () => void;
  returnUrl?: string;
}) {
  return (
    <AlipayPayDialog
      open={true}
      onOpenChange={(v) => { if (!v) onClose(); }}
      packageInfo={packageInfo}
      onSuccess={onSuccess}
      returnUrl={returnUrl}
    />
  );
}

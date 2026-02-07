/**
 * 统一支付弹窗组件
 * 
 * 根据终端类型自动选择支付方式：
 * - 移动端浏览器（非微信、非小程序）→ 支付宝H5支付
 * - 微信浏览器 → 微信JSAPI支付
 * - 微信小程序 → 微信小程序支付
 * - 桌面端 → 微信扫码支付
 * 
 * 使用方式：直接替换 WechatPayDialog，接口完全兼容
 */

import { WechatPayDialog } from './WechatPayDialog';
import { AlipayPayDialog } from './AlipayPayDialog';
import { isWeChatMiniProgram, isWeChatBrowser } from '@/utils/platform';

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
  /** 支付成功后跳转的页面路径，默认为当前页面 */
  returnUrl?: string;
  /** 用户的微信 openId，用于 JSAPI 支付（仅微信环境需要） */
  openId?: string;
}

/**
 * 判断是否应该使用支付宝支付
 * 条件：移动端 + 非微信浏览器 + 非小程序
 */
function shouldUseAlipay(): boolean {
  // 检测是否在移动端
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // 检测是否在微信环境
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  
  // 检测是否在小程序
  const isMiniProgram = isWeChatMiniProgram();
  
  // 移动端 + 非微信 + 非小程序 = 使用支付宝
  return isMobile && !isWechat && !isMiniProgram;
}

export function UnifiedPayDialog({
  open,
  onOpenChange,
  packageInfo,
  onSuccess,
  returnUrl,
  openId,
}: UnifiedPayDialogProps) {
  // 在组件渲染时决定使用哪种支付方式
  const useAlipay = shouldUseAlipay();

  if (useAlipay) {
    // 移动端浏览器使用支付宝
    return (
      <AlipayPayDialog
        open={open}
        onOpenChange={onOpenChange}
        packageInfo={packageInfo}
        onSuccess={onSuccess}
        returnUrl={returnUrl}
      />
    );
  }

  // 其他环境使用微信支付（桌面端、微信浏览器、小程序）
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

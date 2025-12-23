import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, QrCode, RefreshCw, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface WechatPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageInfo: PackageInfo | null;
  onSuccess: () => void;
}

type PaymentStatus = 'idle' | 'loading' | 'ready' | 'polling' | 'success' | 'failed' | 'expired';

export function WechatPayDialog({ open, onOpenChange, packageInfo, onSuccess }: WechatPayDialogProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [h5Url, setH5Url] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [payType, setPayType] = useState<'h5' | 'native'>('h5');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 检测是否在微信内
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  // 检测是否在移动端
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 清理定时器
  const clearTimers = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 重置状态
  const resetState = () => {
    clearTimers();
    setStatus('idle');
    setQrCodeDataUrl('');
    setPayUrl('');
    setH5Url('');
    setOrderNo('');
    setErrorMessage('');
  };

  // 跳转H5支付
  const handleH5Pay = () => {
    if (!h5Url) return;
    // H5支付完成后需要跳回的地址
    const redirectUrl = encodeURIComponent(window.location.origin + '/packages?order=' + orderNo);
    const payUrlWithRedirect = h5Url + '&redirect_url=' + redirectUrl;
    window.location.href = payUrlWithRedirect;
  };

  // 复制支付链接（备用）
  const handleCopyLink = async () => {
    const url = h5Url || payUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('链接已复制，请在微信中打开并支付');
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  // 创建订单 - 统一使用二维码支付，移动端也可以截图扫码
  const createOrder = async () => {
    if (!packageInfo || !user) return;

    setStatus('loading');
    setErrorMessage('');

    // 统一使用native二维码支付（H5未审核通过）
    setPayType('native');

    try {
      const { data, error } = await supabase.functions.invoke('create-wechat-order', {
        body: {
          packageKey: packageInfo.key,
          packageName: packageInfo.name,
          amount: packageInfo.price,
          userId: user.id,
          payType: 'native',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '创建订单失败');

      setOrderNo(data.orderNo);
      setPayUrl(data.qrCodeUrl || data.payUrl);
      
      // 生成二维码
      const qrDataUrl = await QRCode.toDataURL(data.qrCodeUrl || data.payUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrCodeDataUrl(qrDataUrl);
      setStatus('ready');

      // 开始轮询
      startPolling(data.orderNo);

      // 设置5分钟超时
      timeoutRef.current = setTimeout(() => {
        clearTimers();
        setStatus('expired');
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Create order error:', error);
      setErrorMessage(error.message || '创建订单失败');
      setStatus('failed');
    }
  };

  // 开始轮询订单状态
  const startPolling = (orderNo: string) => {
    setStatus('polling');
    
    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo },
        });

        if (error) throw error;

        if (data.status === 'paid') {
          clearTimers();
          setStatus('success');
          
          // 庆祝动画
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });

          toast.success('支付成功！');
          
          // 延迟关闭
          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  // 打开对话框时创建订单
  useEffect(() => {
    if (open && packageInfo && user) {
      createOrder();
    }
    return () => {
      clearTimers();
    };
  }, [open, packageInfo, user]);

  // 关闭对话框时重置
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const handleRetry = () => {
    resetState();
    createOrder();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">微信支付</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* 套餐信息 */}
          {packageInfo && (
            <Card className="w-full p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{packageInfo.name}</span>
                <span className="text-xl font-bold text-primary">
                  ¥{packageInfo.price}
                </span>
              </div>
              {packageInfo.quota && (
                <div className="text-sm text-muted-foreground mt-1">
                  包含 {packageInfo.quota >= 9999999 ? '无限' : packageInfo.quota} 次AI对话
                </div>
              )}
            </Card>
          )}

          {/* 二维码支付区域 */}
          <div className="w-full">
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center h-52 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">正在生成二维码...</span>
              </div>
            )}

            {(status === 'ready' || status === 'polling') && qrCodeDataUrl && (
              <div className="flex flex-col items-center gap-3">
                {/* 二维码 */}
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <img src={qrCodeDataUrl} alt="微信支付二维码" className="w-48 h-48" />
                </div>
                
                {/* 根据设备显示不同提示 */}
                {isMobile ? (
                  <div className="w-full space-y-3">
                    {/* 移动端分步指引 */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                      <p className="text-sm font-medium text-green-800 mb-2">📱 手机支付步骤：</p>
                      <div className="space-y-1.5 text-xs text-green-700">
                        <div className="flex items-start gap-2">
                          <span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
                          <span>长按上方二维码，保存到相册</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
                          <span>打开微信「扫一扫」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 text-[10px]">3</span>
                          <span>点击右上角「相册」，选择二维码图片</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 复制链接备选 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="w-full gap-2 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      或复制链接到微信打开
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">请使用微信扫码支付</p>
                    {payUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="gap-2 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                        复制链接在微信中打开
                      </Button>
                    )}
                  </div>
                )}

                {/* 等待支付状态 */}
                {status === 'polling' && (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    等待支付中，支付后自动跳转...
                  </p>
                )}
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center justify-center h-52 gap-2 text-green-500">
                <CheckCircle className="h-16 w-16" />
                <span className="font-medium">支付成功</span>
              </div>
            )}

            {status === 'failed' && (
              <div className="flex flex-col items-center justify-center h-52 gap-2 text-destructive">
                <XCircle className="h-12 w-12" />
                <span className="text-sm text-center px-4">{errorMessage}</span>
              </div>
            )}

            {status === 'expired' && (
              <div className="flex flex-col items-center justify-center h-52 gap-2 text-muted-foreground">
                <QrCode className="h-12 w-12" />
                <span className="text-sm">订单已过期</span>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {(status === 'failed' || status === 'expired') && (
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              重新生成二维码
            </Button>
          )}

          {/* 订单号 */}
          {orderNo && status !== 'success' && (
            <p className="text-xs text-muted-foreground">
              订单号：{orderNo}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

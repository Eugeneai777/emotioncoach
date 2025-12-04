import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, QrCode, RefreshCw } from 'lucide-react';
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
  const [orderNo, setOrderNo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    setOrderNo('');
    setErrorMessage('');
  };

  // 创建订单
  const createOrder = async () => {
    if (!packageInfo || !user) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('create-wechat-order', {
        body: {
          packageKey: packageInfo.key,
          packageName: packageInfo.name,
          amount: packageInfo.price,
          userId: user.id,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '创建订单失败');

      // 生成二维码
      const qrDataUrl = await QRCode.toDataURL(data.qrCodeUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      setQrCodeDataUrl(qrDataUrl);
      setOrderNo(data.orderNo);
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

          {/* 二维码区域 */}
          <div className="w-52 h-52 flex items-center justify-center border rounded-lg bg-white">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">正在生成二维码...</span>
              </div>
            )}

            {(status === 'ready' || status === 'polling') && qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="微信支付二维码" className="w-48 h-48" />
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-2 text-green-500">
                <CheckCircle className="h-16 w-16" />
                <span className="font-medium">支付成功</span>
              </div>
            )}

            {status === 'failed' && (
              <div className="flex flex-col items-center gap-2 text-destructive">
                <XCircle className="h-12 w-12" />
                <span className="text-sm text-center px-4">{errorMessage}</span>
              </div>
            )}

            {status === 'expired' && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <QrCode className="h-12 w-12" />
                <span className="text-sm">二维码已过期</span>
              </div>
            )}
          </div>

          {/* 状态提示 */}
          {(status === 'ready' || status === 'polling') && (
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">请使用微信扫码支付</p>
              {status === 'polling' && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  等待支付中...
                </p>
              )}
            </div>
          )}

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

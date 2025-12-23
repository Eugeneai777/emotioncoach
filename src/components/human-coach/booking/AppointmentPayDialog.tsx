import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HumanCoach, CoachService, CoachTimeSlot } from "@/hooks/useHumanCoaches";
import { toast } from "sonner";
import QRCode from "qrcode";

interface AppointmentPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach: HumanCoach;
  service: CoachService;
  slot: CoachTimeSlot;
  userNotes: string;
  onSuccess: () => void;
}

type PaymentStatus = 'loading' | 'pending' | 'success' | 'failed' | 'expired';

export function AppointmentPayDialog({
  open,
  onOpenChange,
  coach,
  service,
  slot,
  userNotes,
  onSuccess,
}: AppointmentPayDialogProps) {
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [h5PayUrl, setH5PayUrl] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [payType, setPayType] = useState<'native' | 'h5'>('native');

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const expiryRef = useRef<NodeJS.Timeout | null>(null);

  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const clearTimers = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (expiryRef.current) {
      clearTimeout(expiryRef.current);
      expiryRef.current = null;
    }
  };

  const resetState = () => {
    clearTimers();
    setStatus('loading');
    setQrCodeDataUrl('');
    setH5PayUrl('');
    setOrderNo('');
    setAppointmentId('');
    setErrorMessage('');
  };

  useEffect(() => {
    if (open) {
      createAppointmentOrder();
    } else {
      resetState();
    }
    return clearTimers;
  }, [open]);

  const createAppointmentOrder = async () => {
    setStatus('loading');
    try {
      // 统一使用native二维码支付（H5未审核通过）
      setPayType('native');

      const { data, error } = await supabase.functions.invoke('create-appointment-order', {
        body: {
          coachId: coach.id,
          serviceId: service.id,
          slotId: slot.id,
          userNotes,
          payType: 'native',
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || '创建订单失败');
      }

      setOrderNo(data.orderNo);
      setAppointmentId(data.appointmentId);

      if (data.codeUrl) {
        const qrDataUrl = await QRCode.toDataURL(data.codeUrl, {
          width: 240,
          margin: 2,
        });
        setQrCodeDataUrl(qrDataUrl);
        setH5PayUrl(data.codeUrl); // 保存链接用于复制
        setStatus('pending');
        startPolling(data.orderNo);
      }

      // Set expiry timer (5 minutes)
      expiryRef.current = setTimeout(() => {
        setStatus('expired');
        clearTimers();
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Error creating appointment order:', error);
      setErrorMessage(error.message || '创建订单失败');
      setStatus('failed');
    }
  };

  const startPolling = (orderNumber: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo: orderNumber },
        });

        if (error) throw error;

        if (data.status === 'paid') {
          clearTimers();
          setStatus('success');
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking order status:', error);
      }
    }, 3000);
  };

  const handleH5Pay = () => {
    if (h5PayUrl) {
      window.location.href = h5PayUrl;
    }
  };

  const handleCopyLink = () => {
    if (h5PayUrl) {
      navigator.clipboard.writeText(h5PayUrl);
      toast.success('链接已复制，请在微信中打开');
    }
  };

  const handleRetry = () => {
    resetState();
    createAppointmentOrder();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>支付预约费用</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">服务项目</span>
              <span>{service.service_name}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">应付金额</span>
              <span className="font-semibold text-primary">¥{service.price}</span>
            </div>
          </div>

          {/* Payment content */}
          <div className="flex flex-col items-center py-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">正在创建订单...</p>
              </>
            )}

            {status === 'pending' && qrCodeDataUrl && (
              <div className="w-full space-y-3">
                {/* 二维码 */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg border shadow-sm">
                    <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-48 h-48" />
                  </div>
                </div>
                
                {/* 根据设备显示不同提示 */}
                {isMobile ? (
                  <div className="space-y-3">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      复制链接在微信中打开
                    </Button>
                  </div>
                )}

                {/* 等待支付状态 */}
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  等待支付中，支付后自动跳转...
                </p>
              </div>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <p className="font-medium text-green-600">支付成功！</p>
                <p className="text-sm text-muted-foreground">正在跳转...</p>
              </>
            )}

            {status === 'failed' && (
              <>
                <XCircle className="w-16 h-16 text-destructive mb-4" />
                <p className="font-medium text-destructive">支付失败</p>
                <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
                <Button onClick={handleRetry} variant="outline" className="mt-4">
                  重试
                </Button>
              </>
            )}

            {status === 'expired' && (
              <>
                <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                <p className="font-medium text-amber-600">二维码已过期</p>
                <Button onClick={handleRetry} variant="outline" className="mt-4">
                  重新生成
                </Button>
              </>
            )}
          </div>

          {/* Order number */}
          {orderNo && (
            <p className="text-xs text-muted-foreground text-center">
              订单号: {orderNo}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

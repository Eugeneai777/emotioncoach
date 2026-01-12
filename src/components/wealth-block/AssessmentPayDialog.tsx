import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, QrCode, Smartphone, Copy, ExternalLink } from 'lucide-react';
import { QuickRegisterStep } from '@/components/onboarding/QuickRegisterStep';
import QRCode from 'qrcode';

interface AssessmentPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (userId: string) => void;
}

type PaymentStatus = 'idle' | 'creating' | 'pending' | 'polling' | 'paid' | 'registering' | 'error';

export function AssessmentPayDialog({
  open,
  onOpenChange,
  onSuccess,
}: AssessmentPayDialogProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [orderNo, setOrderNo] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [payType, setPayType] = useState<'h5' | 'native'>('native');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentOpenId, setPaymentOpenId] = useState<string | undefined>();
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 检测是否是微信环境
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);

  // 创建订单（带超时处理）
  const createOrder = async () => {
    setStatus('creating');
    setErrorMessage('');
    
    try {
      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      const { data, error } = await supabase.functions.invoke('create-wechat-order', {
        body: {
          packageKey: 'wealth_block_assessment',
          packageName: '财富卡点测评',
          amount: 9.9,
          userId: 'guest', // 游客订单
          payType: isWechat ? 'h5' : 'native',
        }
      });

      clearTimeout(timeoutId);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || '创建订单失败，请稍后重试');

      setOrderNo(data.orderNo);
      setPayType(data.payType);
      setPayUrl(data.payUrl);

      // 生成二维码
      if (data.payType === 'native' && data.payUrl) {
        const qrDataUrl = await QRCode.toDataURL(data.payUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setQrCodeDataUrl(qrDataUrl);
      }

      setStatus('pending');
      startPolling(data.orderNo);
    } catch (error: any) {
      console.error('Create order error:', error);
      const msg = error.name === 'AbortError' 
        ? '创建订单超时，请检查网络后重试' 
        : (error.message || '创建订单失败，请稍后重试');
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  // 轮询订单状态
  const startPolling = (orderNumber: string) => {
    setStatus('polling');
    
    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo: orderNumber }
        });

        if (error) throw error;

        if (data.status === 'paid') {
          stopPolling();
          setPaymentOpenId(data.openId); // 获取支付时的openId
          setStatus('paid');
          
          // 扫码转化追踪：测评购买转化（游客场景，记录到 conversion_events）
          const shareRefCode = localStorage.getItem('share_ref_code');
          if (shareRefCode) {
            try {
              const landingPage = localStorage.getItem('share_landing_page');
              const landingTime = localStorage.getItem('share_landing_time');
              const timeToConvert = landingTime ? Date.now() - parseInt(landingTime) : undefined;
              
              await supabase.from('conversion_events').insert({
                event_type: 'share_scan_converted',
                feature_key: 'wealth_camp',
                user_id: null, // 游客购买，没有 user_id
                visitor_id: localStorage.getItem('wealth_camp_visitor_id') || undefined,
                metadata: {
                  ref_code: shareRefCode,
                  landing_page: landingPage,
                  conversion_type: 'assessment_purchase',
                  order_no: orderNumber,
                  amount: 9.9,
                  time_to_convert_ms: timeToConvert,
                  timestamp: new Date().toISOString(),
                }
              });
              
              // 注意：不清理 localStorage，因为后续注册时还需要关联
            } catch (error) {
              console.error('Error tracking share conversion:', error);
            }
          }
          
          // 短暂显示成功状态后进入注册流程
          setTimeout(() => {
            setStatus('registering');
          }, 1500);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // 立即执行一次
    poll();
    
    // 每2秒轮询一次
    pollingRef.current = setInterval(poll, 2000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // 复制支付链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      toast.success('链接已复制，请在微信中打开');
    } catch {
      toast.error('复制失败');
    }
  };

  // H5支付跳转
  const handleH5Pay = () => {
    if (payUrl) {
      window.location.href = payUrl;
    }
  };

  // 注册成功回调
  const handleRegisterSuccess = (userId: string) => {
    toast.success('注册成功，开始测评！');
    onSuccess(userId);
    onOpenChange(false);
  };

  // 初始化
  useEffect(() => {
    if (open && status === 'idle') {
      createOrder();
    }
  }, [open]);

  // 清理
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // 关闭时重置状态
  useEffect(() => {
    if (!open) {
      stopPolling();
      setStatus('idle');
      setOrderNo('');
      setQrCodeDataUrl('');
      setPayUrl('');
      setErrorMessage('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm !inset-auto !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !bottom-auto !rounded-2xl max-h-[85vh] overflow-visible p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-base">
            {status === 'registering' ? '完成注册' : '财富卡点测评'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {/* 创建订单中 */}
          {(status === 'idle' || status === 'creating') && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">正在创建订单...</p>
            </div>
          )}

          {/* 等待支付 */}
          {(status === 'pending' || status === 'polling') && (
            <div className="space-y-3">
              {/* 价格展示 */}
              <div className="text-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <span className="text-muted-foreground line-through text-sm">¥99</span>
                  <span className="text-xl font-bold text-primary">¥9.9</span>
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">限时</span>
                </div>
                <p className="text-xs text-muted-foreground">30道专业测评 + AI智能分析</p>
              </div>

              {/* 二维码或H5支付 */}
              {payType === 'native' && qrCodeDataUrl ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border shadow-sm">
                    <img src={qrCodeDataUrl} alt="支付二维码" className="w-40 h-40" />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <QrCode className="w-4 h-4" />
                    <span>请使用微信长按二维码或扫码支付</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={handleH5Pay} 
                    className="w-full bg-[#07C160] hover:bg-[#06AD56]"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    立即支付 ¥9.9
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCopyLink}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制支付链接
                  </Button>
                </div>
              )}

              {/* 订单号 */}
              <p className="text-center text-xs text-muted-foreground">
                订单号：{orderNo}
              </p>

              {status === 'polling' && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>等待支付中...</span>
                </div>
              )}
            </div>
          )}

          {/* 支付成功 */}
          {status === 'paid' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-green-600">支付成功！</p>
              <p className="text-sm text-muted-foreground mt-2">正在进入注册...</p>
            </div>
          )}

          {/* 注册流程 */}
          {status === 'registering' && (
            <QuickRegisterStep
              orderNo={orderNo}
              paymentOpenId={paymentOpenId}
              onSuccess={handleRegisterSuccess}
            />
          )}

          {/* 错误状态 */}
          {status === 'error' && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{errorMessage}</p>
              <Button onClick={createOrder}>重试</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

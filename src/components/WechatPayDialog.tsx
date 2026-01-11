import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, XCircle, QrCode, RefreshCw, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { isWeChatMiniProgram } from '@/utils/platform';

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
  const [h5PayLink, setH5PayLink] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [payType, setPayType] = useState<'h5' | 'native'>('h5');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const orderCreatedRef = useRef<boolean>(false); // 防止重复创建订单

  // 检测是否在微信内
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  // 检测是否在移动端
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  // 检测是否在小程序 WebView 中
  const isMiniProgram = isWeChatMiniProgram();
  // 云端二维码URL（用于小程序长按识别）
  const [cloudQrUrl, setCloudQrUrl] = useState<string>('');

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
    setCloudQrUrl('');
    setPayUrl('');
    setH5Url('');
    setH5PayLink('');
    setOrderNo('');
    setErrorMessage('');
    setAgreedTerms(false);
    orderCreatedRef.current = false; // 重置订单创建标记
  };

  // 根据套餐类型获取对应的服务条款链接
  const getTermsLink = () => {
    if (packageInfo?.key.includes('bloom_partner')) {
      return '/terms/bloom-partner';
    }
    if (packageInfo?.key.includes('youjin_partner') || packageInfo?.key.startsWith('partner_l')) {
      return '/terms/youjin-partner';
    }
    return '/terms';
  };

  // 获取条款名称
  const getTermsName = () => {
    if (packageInfo?.key.includes('bloom_partner')) {
      return '《绽放合伙人服务条款》';
    }
    if (packageInfo?.key.includes('youjin_partner') || packageInfo?.key.startsWith('partner_l')) {
      return '《有劲合伙人服务条款》';
    }
    return '《服务条款》';
  };


  // 复制支付链接（备用）
  const handleCopyLink = async () => {
    const url = h5PayLink || h5Url || payUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('链接已复制，请在微信中打开完成支付');
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  // 尝试唤起微信（会先复制链接；微信通常不会“自动打开”剪贴板里的链接）
  const handleOpenWechatWithLink = async () => {
    const url = h5PayLink || h5Url || payUrl;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      toast.success('已复制链接，正在尝试打开微信…');
    } catch (error) {
      toast.error('复制失败，请先手动复制链接再打开微信');
      return;
    }

    // 只能尝试唤起微信 App；出于安全限制，无法在微信内自动打开这条链接
    window.location.href = 'weixin://';

    setTimeout(() => {
      toast('若未唤起微信，请手动打开微信并将链接粘贴到聊天/浏览器中打开');
    }, 1200);
  };

  // 创建订单
  const createOrder = async () => {
    if (!packageInfo || !user) return;

    // 验证是否同意条款
    if (!agreedTerms) {
      toast.error('请先阅读并同意服务条款和隐私政策');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // 移动端优先使用H5支付，PC端使用Native扫码
    // 小程序WebView内使用native二维码（支持长按识别）
    const selectedPayType = (isMobile && !isWechat && !isMiniProgram) ? 'h5' : 'native';
    setPayType(selectedPayType);

    try {
      const { data, error } = await supabase.functions.invoke('create-wechat-order', {
        body: {
          packageKey: packageInfo.key,
          packageName: packageInfo.name,
          amount: packageInfo.price,
          userId: user.id,
          payType: selectedPayType,
          // 移动端都需要云端二维码URL（用于长按识别）
          needCloudQr: isMobile || isMiniProgram,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '创建订单失败');

      setOrderNo(data.orderNo);

      if (selectedPayType === 'h5' && (data.h5Url || data.payUrl)) {
        // H5支付
        const baseUrl: string = (data.h5Url || data.payUrl) as string;
        const redirectUrl = encodeURIComponent(window.location.origin + '/packages?order=' + data.orderNo);
        const finalUrl = baseUrl.includes('redirect_url=')
          ? baseUrl
          : baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'redirect_url=' + redirectUrl;

        setH5Url(baseUrl);
        setPayUrl(baseUrl);
        setH5PayLink(finalUrl);
        
        // 移动端H5支付也生成二维码，用于长按识别
        const qrDataUrl = await QRCode.toDataURL(finalUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        setQrCodeDataUrl(qrDataUrl);
        setStatus('ready');
      } else {
        // Native扫码支付
        const qrCodeUrl = data.qrCodeUrl || data.payUrl;
        setPayUrl(qrCodeUrl);
        
        // 生成本地base64二维码
        const qrDataUrl = await QRCode.toDataURL(qrCodeUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        setQrCodeDataUrl(qrDataUrl);
        
        // 小程序环境：使用云端二维码URL（支持长按识别）
        if (isMiniProgram && data.cloudQrUrl) {
          setCloudQrUrl(data.cloudQrUrl);
        }
        
        setStatus('ready');
      }

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

  // 用户同意条款后创建订单
  useEffect(() => {
    if (open && packageInfo && user && agreedTerms && !orderCreatedRef.current) {
      orderCreatedRef.current = true;
      createOrder();
    }
    return () => {
      clearTimers();
    };
  }, [open, packageInfo, user, agreedTerms]);

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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
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

          {/* 服务条款同意 */}
          {status === 'idle' && (
            <div className="flex items-start gap-2 w-full">
              <Checkbox
                id="pay-terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="pay-terms" className="text-xs text-muted-foreground leading-relaxed">
                我已阅读并同意
                <Link to={getTermsLink()} target="_blank" className="text-primary hover:underline mx-0.5">
                  {getTermsName()}
                </Link>
                和
                <Link to="/privacy" target="_blank" className="text-primary hover:underline mx-0.5">
                  《隐私政策》
                </Link>
              </label>
            </div>
          )}

          {/* 二维码/H5支付区域 */}
          <div className="flex items-center justify-center border rounded-lg bg-white w-52 h-52">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {payType === 'h5' ? '正在创建订单...' : '正在生成二维码...'}
                </span>
              </div>
            )}

            {(status === 'ready' || status === 'polling') && payType === 'native' && (qrCodeDataUrl || cloudQrUrl) && (
              <div className="flex flex-col items-center gap-1">
                {/* 小程序WebView不支持长按识别普通二维码，显示提示 */}
                {isMiniProgram ? (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="text-4xl">📋</div>
                    <span className="text-sm text-muted-foreground">
                      小程序内无法长按识别二维码
                    </span>
                    <span className="text-xs text-muted-foreground">
                      请复制链接到微信聊天中打开
                    </span>
                  </div>
                ) : (
                  <>
                    {/* 移动端浏览器使用云端URL支持长按识别；PC端使用base64 */}
                    <img 
                      src={isMobile && cloudQrUrl ? cloudQrUrl : qrCodeDataUrl} 
                      alt="微信支付二维码" 
                      className="w-48 h-48"
                    />
                    {isMobile && (
                      <span className="text-xs text-muted-foreground mt-1">长按二维码识别支付</span>
                    )}
                  </>
                )}
              </div>
            )}

            {(status === 'ready' || status === 'polling') && payType === 'h5' && (
              <div className="flex flex-col items-center gap-2">
                {qrCodeDataUrl ? (
                  <>
                    <img src={qrCodeDataUrl} alt="微信支付二维码" className="w-48 h-48" />
                    <span className="text-xs text-muted-foreground">长按识别二维码支付</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#07C160]">
                    <svg className="h-16 w-16" viewBox="0 0 1024 1024" fill="currentColor">
                      <path d="M664.8 627.2c-16 8-33.6 4-41.6-12l-4-8c-8-16-4-33.6 12-41.6l176-96c16-8 33.6-4 41.6 12l4 8c8 16 4 33.6-12 41.6l-176 96zM360 627.2l-176-96c-16-8-20-25.6-12-41.6l4-8c8-16 25.6-20 41.6-12l176 96c16 8 20 25.6 12 41.6l-4 8c-8 16-25.6 20-41.6 12z"/>
                      <path d="M512 938.4c-235.2 0-426.4-191.2-426.4-426.4S276.8 85.6 512 85.6s426.4 191.2 426.4 426.4S747.2 938.4 512 938.4z m0-789.6c-200 0-363.2 163.2-363.2 363.2S312 875.2 512 875.2s363.2-163.2 363.2-363.2S712 148.8 512 148.8z"/>
                      <path d="M512 448c-35.2 0-64-28.8-64-64s28.8-64 64-64 64 28.8 64 64-28.8 64-64 64z"/>
                    </svg>
                    <span className="font-medium">订单已创建</span>
                  </div>
                )}
              </div>
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
                <span className="text-sm">订单已过期</span>
              </div>
            )}
          </div>

          {/* 状态提示 */}
          {(status === 'ready' || status === 'polling') && (
            <div className="text-center space-y-3">
              {payType === 'h5' ? (
                <>
                  <p className="text-sm text-muted-foreground">点击下方按钮跳转微信支付</p>
                   {!isWechat && (
                     <p className="text-xs text-muted-foreground">
                       部分手机浏览器可能无法直接唤起微信；且复制到剪贴板后微信不会自动打开链接，需要在微信里粘贴后再打开。
                     </p>
                   )}

                  <Button asChild className="w-full gap-2 bg-[#07C160] hover:bg-[#06AD56] text-white">
                    <a
                      href={h5PayLink || '#'}
                      target="_top"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!h5PayLink) {
                          e.preventDefault();
                          toast.error('支付链接未生成，请稍后重试');
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      立即支付
                    </a>
                  </Button>

                   {(h5PayLink || h5Url || payUrl) && (
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                       onClick={handleCopyLink}
                       className="w-full gap-2 text-xs"
                     >
                       <Copy className="h-3 w-3" />
                       复制链接
                     </Button>
                   )}

                   {isMobile && !isWechat && (h5PayLink || h5Url || payUrl) && (
                     <Button
                       type="button"
                       variant="secondary"
                       size="sm"
                       onClick={handleOpenWechatWithLink}
                       className="w-full gap-2 text-xs"
                     >
                       <ExternalLink className="h-3 w-3" />
                       打开微信（已复制链接）
                     </Button>
                   )}

                  {status === 'polling' && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      等待支付中...
                    </p>
                  )}
                </>
              ) : (
                <>
                  {isMiniProgram ? (
                    <>
                      <p className="text-sm text-muted-foreground">请复制下方链接到微信聊天中打开支付</p>
                      {payUrl && (
                        <Button
                          type="button"
                          variant="default"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(payUrl);
                              toast.success('链接已复制，请粘贴到微信聊天中打开');
                            } catch {
                              toast.error('复制失败');
                            }
                          }}
                          className="w-full gap-2 bg-[#07C160] hover:bg-[#06AD56] text-white"
                        >
                          <Copy className="h-4 w-4" />
                          复制支付链接
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isMobile ? '长按二维码识别支付' : '请使用微信扫描二维码支付'}
                    </p>
                  )}
                  {status === 'polling' && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      等待支付中...
                    </p>
                  )}
                  {/* 复制链接按钮（PC端备用） */}
                  {payUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      复制链接在微信中打开
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          {(status === 'failed' || status === 'expired') && (
            <Button type="button" onClick={handleRetry} variant="outline" className="gap-2">
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

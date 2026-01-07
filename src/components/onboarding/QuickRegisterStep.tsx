import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, User, QrCode, Smartphone, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickRegisterStepProps {
  orderNo: string;
  paymentOpenId?: string;
  onSuccess: (userId: string) => void;
  onSkip?: () => void;
}

type RegisterMode = 'wechat' | 'phone';

export function QuickRegisterStep({
  orderNo,
  paymentOpenId,
  onSuccess,
  onSkip
}: QuickRegisterStepProps) {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  
  // 注册方式切换
  const [registerMode, setRegisterMode] = useState<RegisterMode>('wechat');
  
  // 微信扫码注册相关状态
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sceneStr, setSceneStr] = useState<string>('');
  const [qrStatus, setQrStatus] = useState<'loading' | 'ready' | 'scanned' | 'confirmed' | 'expired'>('loading');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 检测是否是微信环境
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);

  // 生成微信扫码注册二维码
  const generateQrCode = async () => {
    setIsGeneratingQr(true);
    setQrStatus('loading');
    stopPolling();
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-wechat-login-qr', {
        body: { mode: 'register', orderNo }
      });

      if (error) throw error;
      if (!data.success) throw new Error('生成二维码失败');

      setQrCodeUrl(data.qrCodeUrl);
      setSceneStr(data.sceneStr);
      setQrStatus('ready');
      
      // 开始轮询状态
      startPolling(data.sceneStr);
    } catch (error: any) {
      console.error('Generate QR error:', error);
      toast.error('生成二维码失败，请使用手机号注册');
      setQrStatus('expired');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // 轮询扫码状态
  const startPolling = (scene: string) => {
    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-wechat-login-status', {
          body: { sceneStr: scene }
        });

        if (error) throw error;

        if (data.status === 'expired') {
          setQrStatus('expired');
          stopPolling();
        } else if (data.status === 'scanned') {
          setQrStatus('scanned');
        } else if (data.status === 'confirmed' && data.userId) {
          setQrStatus('confirmed');
          stopPolling();
          
          // 使用 tokenHash 完成登录
          if (data.tokenHash) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: data.tokenHash,
              type: 'magiclink',
            });
            
            if (verifyError) {
              console.error('Verify OTP error:', verifyError);
              toast.error('登录失败，请重试');
              return;
            }
          }
          
          // 绑定订单到用户
          await bindOrderToUser(data.userId);
          
          toast.success('注册成功！');
          onSuccess(data.userId);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 2000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // 绑定订单到用户
  const bindOrderToUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ user_id: userId })
        .eq('order_no', orderNo)
        .eq('user_id', 'guest');
      
      if (error) {
        console.error('Bind order error:', error);
      }
    } catch (error) {
      console.error('Bind order error:', error);
    }
  };

  // 初始化时生成二维码（非微信环境）
  useEffect(() => {
    if (!isWechat && !paymentOpenId && registerMode === 'wechat') {
      generateQrCode();
    }
    
    return () => {
      stopPolling();
    };
  }, [registerMode]);

  // 自动创建账号（使用微信openid）
  const handleAutoCreate = async () => {
    if (!paymentOpenId) {
      toast.error('无法获取微信信息，请手动注册');
      return;
    }

    setIsAutoCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-from-payment', {
        body: {
          orderNo,
          openId: paymentOpenId,
          nickname: nickname || undefined
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '创建账号失败');

      // 自动登录
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      toast.success('账号创建成功！');
      onSuccess(data.userId);
    } catch (error: any) {
      console.error('Auto create error:', error);
      toast.error(error.message || '创建失败，请重试');
    } finally {
      setIsAutoCreating(false);
    }
  };

  // 手动输入手机号注册
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    if (!phone || phone.length !== 11) {
      toast.error('请输入正确的手机号');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-sms-code', {
        body: { phone }
      });

      if (error) throw error;

      setCodeSent(true);
      setCountdown(60);
      toast.success('验证码已发送');

      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || '发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneRegister = async () => {
    if (!phone || !verifyCode) {
      toast.error('请填写完整信息');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-from-payment', {
        body: {
          orderNo,
          phone,
          verifyCode,
          nickname: nickname || undefined
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '注册失败');

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      toast.success('注册成功！');
      onSuccess(data.userId);
    } catch (error: any) {
      console.error('Phone register error:', error);
      toast.error(error.message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 微信环境下优先使用openid一键注册
  if (isWechat && paymentOpenId) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-lg font-semibold">支付成功！</h3>
          <p className="text-sm text-muted-foreground">
            完成注册后即可开始使用
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">设置昵称（可选）</Label>
            <div className="flex gap-2">
              <User className="w-5 h-5 text-muted-foreground mt-2" />
              <Input
                id="nickname"
                placeholder="输入你的昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleAutoCreate}
            disabled={isAutoCreating}
            className="w-full bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:opacity-90"
          >
            {isAutoCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在创建...
              </>
            ) : (
              '微信一键注册'
            )}
          </Button>
        </div>

        {onSkip && (
          <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
            稍后完善
          </Button>
        )}
      </div>
    );
  }

  // 非微信环境 - 支持扫码注册或手机号注册
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-lg font-semibold">支付成功！</h3>
        <p className="text-sm text-muted-foreground">
          完成注册后即可开始使用
        </p>
      </div>

      {/* 注册方式切换 */}
      <div className="flex rounded-lg border p-1 bg-muted/30">
        <button
          onClick={() => setRegisterMode('wechat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            registerMode === 'wechat'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <QrCode className="w-4 h-4" />
          微信扫码
        </button>
        <button
          onClick={() => setRegisterMode('phone')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            registerMode === 'phone'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          手机号
        </button>
      </div>

      {/* 微信扫码注册 */}
      {registerMode === 'wechat' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            {qrStatus === 'loading' || isGeneratingQr ? (
              <div className="w-48 h-48 flex items-center justify-center bg-muted/30 rounded-lg border">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : qrStatus === 'expired' ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center bg-muted/30 rounded-lg border gap-3">
                <p className="text-sm text-muted-foreground">二维码已过期</p>
                <Button size="sm" variant="outline" onClick={generateQrCode}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  刷新
                </Button>
              </div>
            ) : qrStatus === 'scanned' ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center bg-green-50 rounded-lg border border-green-200 gap-2">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <p className="text-sm text-green-600 font-medium">已扫码</p>
                <p className="text-xs text-green-500">请在微信中确认</p>
              </div>
            ) : qrStatus === 'confirmed' ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center bg-green-50 rounded-lg border border-green-200 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                <p className="text-sm text-green-600">正在完成注册...</p>
              </div>
            ) : (
              <div className="bg-white p-2 rounded-lg border shadow-sm">
                <img src={qrCodeUrl} alt="微信扫码注册" className="w-44 h-44" />
              </div>
            )}
          </div>
          
          {qrStatus === 'ready' && (
            <p className="text-center text-sm text-muted-foreground">
              请使用微信扫描二维码完成注册
            </p>
          )}
          
          <p className="text-center text-xs text-muted-foreground">
            扫码关注公众号自动完成注册
          </p>
        </div>
      )}

      {/* 手机号注册 */}
      {registerMode === 'phone' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">昵称（可选）</Label>
            <Input
              id="nickname"
              placeholder="输入你的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="nickname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="flex gap-3">
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                autoComplete="tel"
              />
              <Button
                variant="outline"
                onClick={sendCode}
                disabled={isLoading || countdown > 0}
                className="shrink-0 min-w-[100px]"
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </Button>
            </div>
          </div>

          {codeSent && (
            <div className="space-y-2">
              <Label htmlFor="code">验证码</Label>
              <Input
                id="code"
                inputMode="numeric"
                placeholder="输入验证码"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
          )}

          <Button
            onClick={handlePhoneRegister}
            disabled={isLoading || !phone || !verifyCode}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              '完成注册'
            )}
          </Button>
        </div>
      )}

      {onSkip && (
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
          稍后完善
        </Button>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, User, QrCode, Mail, LogIn, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickRegisterStepProps {
  orderNo: string;
  paymentOpenId?: string;
  onSuccess: (userId: string) => void;
  onSkip?: () => void;
}

type RegisterMode = 'wechat' | 'email' | 'login';

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

  // 邮箱注册/登录相关状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      toast.error('生成二维码失败，请使用邮箱注册');
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

  // 邮箱注册
  const handleEmailRegister = async () => {
    if (!email || !password) {
      toast.error('请填写邮箱和密码');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }

    if (password.length < 6) {
      toast.error('密码至少需要6位');
      return;
    }

    setIsLoading(true);
    try {
      // 使用 Supabase Auth 注册
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: nickname || undefined }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('注册失败');

      // 创建 profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: nickname || undefined,
      });

      // 绑定订单到用户
      await bindOrderToUser(data.user.id);

      toast.success('注册成功！');
      onSuccess(data.user.id);
    } catch (error: any) {
      console.error('Email register error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('该邮箱已注册，请直接登录');
        setRegisterMode('login');
      } else {
        toast.error(error.message || '注册失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 邮箱登录
  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('请填写邮箱和密码');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('登录失败');

      // 绑定订单到用户
      await bindOrderToUser(data.user.id);

      toast.success('登录成功！');
      onSuccess(data.user.id);
    } catch (error: any) {
      console.error('Email login error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('邮箱或密码错误');
      } else {
        toast.error(error.message || '登录失败，请重试');
      }
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

        {/* 已有账号入口 */}
        <div className="text-center pt-4 border-t mt-4">
          <button 
            onClick={() => setRegisterMode('login')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            已有账号？点击登录 →
          </button>
        </div>

        {/* 邮箱登录表单（微信环境） */}
        {registerMode === 'login' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="email-login">邮箱</Label>
              <Input
                id="email-login"
                type="email"
                placeholder="输入邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-login">密码</Label>
              <div className="relative">
                <Input
                  id="password-login"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleEmailLogin}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  登录并开始测评
                </>
              )}
            </Button>

            <button
              onClick={() => setRegisterMode('wechat')}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← 返回微信注册
            </button>
          </div>
        )}

        {onSkip && registerMode !== 'login' && (
          <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
            稍后完善
          </Button>
        )}
      </div>
    );
  }

  // 非微信环境 - 支持扫码注册、邮箱注册或登录
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-lg font-semibold">支付成功！</h3>
        <p className="text-sm text-muted-foreground">
          {registerMode === 'login' ? '登录已有账号后即可开始使用' : '完成注册后即可开始使用'}
        </p>
      </div>

      {/* 注册方式切换 */}
      <div className="flex rounded-lg border p-1 bg-muted/30">
        <button
          onClick={() => setRegisterMode('wechat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-sm font-medium transition-colors ${
            registerMode === 'wechat'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <QrCode className="w-4 h-4" />
          微信扫码
        </button>
        <button
          onClick={() => setRegisterMode('email')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-sm font-medium transition-colors ${
            registerMode === 'email'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="w-4 h-4" />
          邮箱注册
        </button>
        <button
          onClick={() => setRegisterMode('login')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-sm font-medium transition-colors ${
            registerMode === 'login'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LogIn className="w-4 h-4" />
          已有账号
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

      {/* 邮箱注册 */}
      {registerMode === 'email' && (
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
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="设置密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <Button
            onClick={handleEmailRegister}
            disabled={isLoading || !email || !password || !confirmPassword}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                注册并开始测评
              </>
            )}
          </Button>
        </div>
      )}

      {/* 已有账号登录 */}
      {registerMode === 'login' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">邮箱</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">密码</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleEmailLogin}
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                登录并开始测评
              </>
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

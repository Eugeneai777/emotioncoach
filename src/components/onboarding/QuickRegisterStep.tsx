import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, User, QrCode, Mail, LogIn, RefreshCw, Eye, EyeOff, Phone, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 国家区号列表
const countryCodes = [
  { code: '+86', country: '中国', flag: '🇨🇳' },
  { code: '+852', country: '中国香港', flag: '🇭🇰' },
  { code: '+853', country: '中国澳门', flag: '🇲🇴' },
  { code: '+886', country: '中国台湾', flag: '🇹🇼' },
  { code: '+1', country: '美国/加拿大', flag: '🇺🇸' },
  { code: '+44', country: '英国', flag: '🇬🇧' },
  { code: '+81', country: '日本', flag: '🇯🇵' },
  { code: '+82', country: '韩国', flag: '🇰🇷' },
  { code: '+65', country: '新加坡', flag: '🇸🇬' },
  { code: '+60', country: '马来西亚', flag: '🇲🇾' },
  { code: '+61', country: '澳大利亚', flag: '🇦🇺' },
  { code: '+64', country: '新西兰', flag: '🇳🇿' },
  { code: '+49', country: '德国', flag: '🇩🇪' },
  { code: '+33', country: '法国', flag: '🇫🇷' },
];

interface QuickRegisterStepProps {
  orderNo: string;
  paymentOpenId?: string;
  onSuccess: (userId: string) => void;
  onSkip?: () => void;
}

type RegisterMode = 'wechat' | 'email' | 'login';

// 根据环境智能选择默认注册模式
const getDefaultMode = (): RegisterMode => {
  const ua = navigator.userAgent.toLowerCase();
  const isWechat = /micromessenger/i.test(ua);
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  
  if (isWechat) return 'wechat';  // 微信内 → 微信一键注册
  if (isMobile) return 'email';   // 移动端非微信 → 邮箱注册更方便
  return 'wechat';                // PC端 → 微信扫码
};

export function QuickRegisterStep({
  orderNo,
  paymentOpenId,
  onSuccess,
  onSkip
}: QuickRegisterStepProps) {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  
  // 手机号相关状态
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+86');
  const [wechatNicknameLoaded, setWechatNicknameLoaded] = useState(false);
  
  // 注册方式切换 - 根据环境智能选择默认模式
  const [registerMode, setRegisterMode] = useState<RegisterMode>(getDefaultMode);
  
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
  
  // 服务条款同意状态（注册模式需要勾选，登录模式不需要）
  const [agreedTerms, setAgreedTerms] = useState(false);

  // 检测是否是微信环境
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  
  // 微信环境下自动获取微信昵称
  useEffect(() => {
    const fetchWechatNickname = async () => {
      if (isWechat && paymentOpenId && !wechatNicknameLoaded) {
        try {
          const { data, error } = await supabase.functions.invoke('get-wechat-user-info', {
            body: { openId: paymentOpenId }
          });
          
          if (!error && data?.nickname) {
            setNickname(data.nickname);
          }
          setWechatNicknameLoaded(true);
        } catch (e) {
          console.error('Fetch wechat nickname error:', e);
          setWechatNicknameLoaded(true);
        }
      }
    };
    
    fetchWechatNickname();
  }, [isWechat, paymentOpenId, wechatNicknameLoaded]);

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
          nickname: nickname || undefined,
          phone: phone || undefined,
          phoneCountryCode: phone ? countryCode : undefined
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
            <Label htmlFor="nickname">昵称{wechatNicknameLoaded && nickname ? '（已从微信获取）' : '（可选）'}</Label>
            <div className="flex gap-2">
              <User className="w-5 h-5 text-muted-foreground mt-2 shrink-0" />
              <Input
                id="nickname"
                placeholder={wechatNicknameLoaded ? '已自动填充微信昵称' : '输入你的昵称'}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </div>

          {/* 手机号输入（可选） */}
          <div className="space-y-2">
            <Label htmlFor="phone">手机号（可选）</Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[110px] shrink-0">
                  <SelectValue>
                    {countryCodes.find(c => c.code === countryCode)?.flag} {countryCode}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.country}</span>
                        <span className="text-muted-foreground">{c.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                placeholder="手机号码"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">填写手机号方便后续接收重要通知</p>
          </div>

          {/* 服务条款同意 */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="wechat-terms"
              checked={agreedTerms}
              onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="wechat-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              继续即表示您同意
              <Link to="/terms" target="_blank" className="text-primary hover:underline mx-0.5">
                服务条款
              </Link>
              和
              <Link to="/privacy" target="_blank" className="text-primary hover:underline mx-0.5">
                隐私政策
              </Link>
            </label>
          </div>

          <Button
            onClick={handleAutoCreate}
            disabled={isAutoCreating || !agreedTerms}
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

  // 微信浏览器内授权登录处理（当没有paymentOpenId时可能发生）
  const [isWechatAuthing, setIsWechatAuthing] = useState(false);
  
  const handleWechatAuth = async () => {
    setIsWechatAuthing(true);
    try {
      // 调用微信OAuth授权
      const { data, error } = await supabase.functions.invoke('wechat-pay-auth', {
        body: {
          action: 'get_auth_url',
          callbackUrl: window.location.href,
          state: JSON.stringify({ orderNo, action: 'register' })
        }
      });
      
      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('获取授权链接失败');
      }
    } catch (error: any) {
      console.error('WeChat auth error:', error);
      toast.error('微信授权失败，请使用邮箱注册');
      setRegisterMode('email');
    } finally {
      setIsWechatAuthing(false);
    }
  };

  // 非微信环境或微信内无openId - 支持扫码注册、邮箱注册或登录
  return (
    <div className="space-y-3 sm:space-y-4 pb-2">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold">支付成功！</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {registerMode === 'login' ? '登录已有账号后即可开始使用' : '完成注册后即可开始使用'}
        </p>
      </div>

      {/* 注册方式切换 - 移动端紧凑布局 */}
      <div className="flex rounded-lg border p-0.5 sm:p-1 bg-muted/30">
        {/* 微信浏览器内显示"微信授权"，其他环境显示"微信扫码" */}
        <button
          onClick={() => setRegisterMode('wechat')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            registerMode === 'wechat'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" />
          {isWechat ? '微信授权' : '微信扫码'}
        </button>
        <button
          onClick={() => setRegisterMode('email')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            registerMode === 'email'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" />
          邮箱注册
        </button>
        <button
          onClick={() => setRegisterMode('login')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            registerMode === 'login'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" />
          已有账号
        </button>
      </div>

      {/* 微信注册 - 微信内用授权按钮，其他环境用扫码 */}
      {registerMode === 'wechat' && (
        <div className="space-y-3 sm:space-y-4">
          {isWechat ? (
            // 微信浏览器内 - 显示授权登录按钮
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098c.836.237 1.734.366 2.672.366.072 0 .143-.002.214-.004a6.456 6.456 0 0 1-.21-1.64c0-3.533 3.14-6.396 7.012-6.396.077 0 .153.002.23.005-.625-3.62-4.287-6.36-8.781-6.36zm-2.24 4.04a.945.945 0 1 1 0 1.89.945.945 0 0 1 0-1.89zm4.5 0a.945.945 0 1 1 0 1.89.945.945 0 0 1 0-1.89z"/>
                    <path d="M24 14.282c0-3.325-3.24-6.022-7.238-6.022-4 0-7.238 2.697-7.238 6.022 0 3.327 3.238 6.024 7.238 6.024.807 0 1.584-.103 2.304-.292a.71.71 0 0 1 .588.08l1.56.912a.268.268 0 0 0 .138.045c.132 0 .238-.108.238-.242 0-.06-.024-.117-.04-.175l-.318-1.21a.485.485 0 0 1 .175-.546c1.5-1.104 2.593-2.756 2.593-4.596zm-9.602-.898a.775.775 0 1 1 0-1.55.775.775 0 0 1 0 1.55zm4.728 0a.775.775 0 1 1 0-1.55.775.775 0 0 1 0 1.55z"/>
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  点击下方按钮使用微信授权登录
                </p>
              </div>
              
              {/* 服务条款同意 */}
              <div className="flex items-start gap-2 justify-center">
                <Checkbox
                  id="wechat-auth-terms"
                  checked={agreedTerms}
                  onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="wechat-auth-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  继续即表示同意
                  <Link to="/terms" target="_blank" className="text-primary hover:underline mx-0.5">
                    服务条款
                  </Link>
                  和
                  <Link to="/privacy" target="_blank" className="text-primary hover:underline mx-0.5">
                    隐私政策
                  </Link>
                </label>
              </div>
              
              <Button
                onClick={handleWechatAuth}
                disabled={isWechatAuthing || !agreedTerms}
                className="w-full bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:opacity-90"
              >
                {isWechatAuthing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在授权...
                  </>
                ) : (
                  '微信授权登录'
                )}
              </Button>
            </div>
          ) : (
            // 非微信环境 - 显示扫码二维码
            <>
              <div className="flex flex-col items-center">
                {qrStatus === 'loading' || isGeneratingQr ? (
                  <div className="w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center bg-muted/30 rounded-lg border">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : qrStatus === 'expired' ? (
                  <div className="w-36 h-36 sm:w-48 sm:h-48 flex flex-col items-center justify-center bg-muted/30 rounded-lg border gap-2 sm:gap-3">
                    <p className="text-xs sm:text-sm text-muted-foreground">二维码已过期</p>
                    <Button size="sm" variant="outline" onClick={generateQrCode}>
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                      刷新
                    </Button>
                  </div>
                ) : qrStatus === 'scanned' ? (
                  <div className="w-36 h-36 sm:w-48 sm:h-48 flex flex-col items-center justify-center bg-green-50 rounded-lg border border-green-200 gap-1.5 sm:gap-2">
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                    <p className="text-xs sm:text-sm text-green-600 font-medium">已扫码</p>
                    <p className="text-[10px] sm:text-xs text-green-500">请在微信中确认</p>
                  </div>
                ) : qrStatus === 'confirmed' ? (
                  <div className="w-36 h-36 sm:w-48 sm:h-48 flex flex-col items-center justify-center bg-green-50 rounded-lg border border-green-200 gap-1.5 sm:gap-2">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-green-500" />
                    <p className="text-xs sm:text-sm text-green-600">正在完成注册...</p>
                  </div>
                ) : (
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg border shadow-sm">
                    <img src={qrCodeUrl} alt="微信扫码注册" className="w-32 h-32 sm:w-44 sm:h-44" />
                  </div>
                )}
              </div>
              
              {qrStatus === 'ready' && (
                <p className="text-center text-xs sm:text-sm text-muted-foreground">
                  请使用微信扫描二维码完成注册
                </p>
              )}
              
              <div className="flex items-start gap-2 justify-center">
                <Checkbox
                  id="scan-terms"
                  checked={agreedTerms}
                  onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="scan-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  扫码即表示同意
                  <Link to="/terms" target="_blank" className="text-primary hover:underline mx-0.5">
                    服务条款
                  </Link>
                  和
                  <Link to="/privacy" target="_blank" className="text-primary hover:underline mx-0.5">
                    隐私政策
                  </Link>
                </label>
              </div>
              
              <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
                扫码关注公众号自动完成注册
              </p>
            </>
          )}
        </div>
      )}

      {/* 邮箱注册 */}
      {registerMode === 'email' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="nickname" className="text-xs sm:text-sm">昵称（可选）</Label>
            <Input
              id="nickname"
              placeholder="输入你的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="nickname"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="password" className="text-xs sm:text-sm">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="设置密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="h-9 sm:h-10 text-sm pr-10"
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

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">确认密码</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          {/* 服务条款同意 */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="email-terms"
              checked={agreedTerms}
              onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="email-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              继续即表示您同意
              <Link to="/terms" target="_blank" className="text-primary hover:underline mx-0.5">
                服务条款
              </Link>
              和
              <Link to="/privacy" target="_blank" className="text-primary hover:underline mx-0.5">
                隐私政策
              </Link>
            </label>
          </div>

          <Button
            onClick={handleEmailRegister}
            disabled={isLoading || !email || !password || !confirmPassword || !agreedTerms}
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
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="login-email" className="text-xs sm:text-sm">邮箱</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="login-password" className="text-xs sm:text-sm">密码</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-9 sm:h-10 text-sm pr-10"
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
            className="w-full h-9 sm:h-10 text-sm"
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

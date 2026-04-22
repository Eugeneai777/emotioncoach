import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { consumePostAuthRedirect } from "@/lib/postAuthRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { logAuthEvent } from "@/lib/authEventLogger";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FollowGuideStep } from "@/components/onboarding/FollowGuideStep";
import { useTermsAgreement } from "@/hooks/useTermsAgreement";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 国家区号列表
const countryCodes = [
  { code: '+86', country: '中国' },
  { code: '+852', country: '中国香港' },
  { code: '+853', country: '中国澳门' },
  { code: '+886', country: '中国台湾' },
  { code: '+1', country: '美国/加拿大' },
  { code: '+44', country: '英国' },
  { code: '+81', country: '日本' },
  { code: '+82', country: '韩国' },
  { code: '+65', country: '新加坡' },
  { code: '+60', country: '马来西亚' },
  { code: '+61', country: '澳大利亚' },
  { code: '+64', country: '新西兰' },
  { code: '+49', country: '德国' },
  { code: '+33', country: '法国' },
];

// 生成占位邮箱
function generatePhoneEmail(countryCode: string, phone: string): string {
  const cleanCode = countryCode.replace('+', '');
  return `phone_${cleanCode}${phone}@youjin.app`;
}

// 验证手机号格式
function isValidPhone(phone: string): boolean {
  return /^\d{5,15}$/.test(phone);
}

const Auth = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const isPhoneOnly = searchParams.get('mode') === 'phone_only';
  const defaultLogin = searchParams.get('default_login') === 'true';
  const isRegisterMode = searchParams.get('register') === 'true';
  const [isLogin, setIsLogin] = useState(isPhoneOnly || isRegisterMode ? false : true);
  const [authMode, setAuthMode] = useState<'phone' | 'email' | 'sms'>('sms');
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+86");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(isPhoneOnly ? "123456" : "");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { isAgreed: agreedTerms, setAgreed: setAgreedTerms } = useTermsAgreement();
  const [showFollowGuide, setShowFollowGuide] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  // SMS验证码相关状态
  const [smsCode, setSmsCode] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  // 短信倒计时
  useEffect(() => {
    if (smsCountdown <= 0) return;
    const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [smsCountdown]);

  // SMS模式下非+86自动提示并禁用
  const isSmsDisabled = authMode === 'sms' && countryCode !== '+86';

  // 切换到SMS tab时，如果区号不是+86，自动重置
  useEffect(() => {
    if (authMode === 'sms' && countryCode !== '+86') {
      setCountryCode('+86');
    }
  }, [authMode]);

  // 验证码满6位自动提交
  useEffect(() => {
    if (authMode === 'sms' && smsCode.length === 6 && agreedTerms && !loading && phone) {
      handleSmsLogin({ preventDefault: () => {} } as React.FormEvent);
    }
  }, [smsCode]);

  // 发送短信验证码
  const handleSendSmsCode = async () => {
    if (countryCode !== '+86') {
      toast({ title: "短信验证码仅支持中国大陆手机号（+86）", variant: "destructive" });
      return;
    }
    if (!phone || !/^\d{11}$/.test(phone)) {
      toast({ title: "请输入有效的11位手机号", variant: "destructive" });
      return;
    }
    setSmsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-code', {
        body: { phone, countryCode },
      });
      if (data?.error || error) {
        const msg = await extractEdgeFunctionError(data, error, '发送失败，请稍后重试');
        throw new Error(msg);
      }
      toast({ title: "验证码已发送", description: "请查看手机短信" });
      setSmsCountdown(60);
    } catch (err: any) {
      toast({ title: "发送失败", description: err.message, variant: "destructive" });
    } finally {
      setSmsSending(false);
    }
  };

  // 短信验证码登录
  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !smsCode) {
      toast({ title: "请输入手机号和验证码", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-sms-login', {
        body: { phone, code: smsCode, countryCode },
      });
      if (data?.error || error) {
        const msg = await extractEdgeFunctionError(data, error, '验证失败，请稍后重试');
        throw new Error(msg);
      }
      if (!data?.session) throw new Error('登录失败，未获取到会话');

      // 设置 session
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      toast({
        title: data.isNewUser ? "注册成功" : "登录成功",
        description: data.isNewUser ? "欢迎来到有劲AI 🌿" : "欢迎回来 🌿",
      });
    } catch (err: any) {
      toast({ title: "验证失败", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 🔒 SECURITY: Validate redirect URLs to prevent open redirect attacks
  const isValidRedirect = (url: string): boolean => {
    // Only allow relative paths starting with / (not //)
    if (!url.startsWith('/') || url.startsWith('//')) {
      return false;
    }
    
    // Block javascript: and other protocol handlers that could be injected
    try {
      const testUrl = new URL(url, window.location.origin);
      // Ensure it's same origin
      if (testUrl.origin !== window.location.origin) {
        return false;
      }
      // Block javascript: or data: protocols
      if (testUrl.protocol !== 'http:' && testUrl.protocol !== 'https:') {
        return false;
      }
    } catch {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    // 读取已记住的账号
    const remembered = localStorage.getItem('remembered_login');
    if (remembered) {
      try {
        const { phone: savedPhone, countryCode: savedCode, password: savedPwd } = JSON.parse(atob(remembered));
        setPhone(savedPhone || '');
        setCountryCode(savedCode || '+86');
        setPassword(atob(savedPwd || ''));
        setRememberMe(true);
      } catch {}
    }

    // 处理推荐参数
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const redirectTo = urlParams.get('redirect');
    if (refCode && refCode !== 'share') {
      localStorage.setItem('referral_code', refCode);
    }
    // 🔒 SECURITY: Validate redirect URL before storing
    if (redirectTo && isValidRedirect(redirectTo)) {
      localStorage.setItem('auth_redirect', redirectTo);
    } else if (redirectTo) {
      console.warn('Invalid redirect URL blocked:', redirectTo);
    }

    // 检查用户是否已登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const savedRedirect = localStorage.getItem('auth_redirect');
        if (savedRedirect) {
          localStorage.removeItem('auth_redirect');
          navigate(savedRedirect);
        } else {
          navigate("/");
        }
      }
    });

    // 监听认证状态变化
    // IMPORTANT: onAuthStateChange callback must NOT be async (causes deadlock with signInWithPassword)
    // All async work is deferred via setTimeout to avoid blocking the auth state machine
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        // Defer all async work to avoid deadlock with signInWithPassword
        setTimeout(async () => {
          // 判断是否是新注册用户（通过 created_at 判断，5秒内创建的认为是新注册）
          const isNewUser = session.user.created_at && 
            (new Date().getTime() - new Date(session.user.created_at).getTime()) < 5000;

          // 发送登录成功通知到微信公众号（非阻塞，后台执行）
          supabase.functions.invoke('send-wechat-template-message', {
            body: {
              userId: session.user.id,
              scenario: 'login_success',
              notification: {
                title: isNewUser ? '注册成功' : '登录成功',
                message: isNewUser ? '欢迎加入' : '欢迎回来',
                account: session.user.email?.replace(/(.{3}).*(@.*)/, '$1***$2') || '***',
                email: session.user.email
              }
            }
          }).catch((error) => {
            console.log('发送登录通知失败（非关键错误）:', error);
          });

          // 如果有推荐码，处理推荐关系
          const savedRefCode = localStorage.getItem('referral_code');
          if (savedRefCode) {
            try {
              await supabase.functions.invoke('process-referral', {
                body: {
                  referred_user_id: session.user.id,
                  partner_code: savedRefCode
                }
              });
              localStorage.removeItem('referral_code');
            } catch (error) {
              console.error('Error processing referral:', error);
            }
          }
          
          // 扫码转化追踪：如果是新用户注册且有分享追踪信息
          if (isNewUser) {
            const shareRefCode = localStorage.getItem('share_ref_code');
            if (shareRefCode) {
              try {
                const landingPage = localStorage.getItem('share_landing_page');
                const landingTime = localStorage.getItem('share_landing_time');
                const timeToConvert = landingTime ? Date.now() - parseInt(landingTime) : undefined;
                
                await supabase.from('conversion_events').insert({
                  event_type: 'share_scan_converted',
                  feature_key: 'wealth_camp',
                  user_id: session.user.id,
                  metadata: {
                    ref_code: shareRefCode,
                    landing_page: landingPage,
                    conversion_type: 'registration',
                    time_to_convert_ms: timeToConvert,
                    timestamp: new Date().toISOString(),
                  }
                });
                
                // 清理 localStorage
                localStorage.removeItem('share_ref_code');
                localStorage.removeItem('share_landing_page');
                localStorage.removeItem('share_landing_time');
              } catch (error) {
                console.error('Error tracking share conversion:', error);
              }
            }
          }
          
          // 计算目标跳转路径：优先 auth_redirect / URL redirect 参数，其次 post_auth_redirect（支付后跳转，带时效）
          const savedRedirect = localStorage.getItem('auth_redirect');
          const urlRedirect = new URLSearchParams(window.location.search).get('redirect');
          const postAuthRedirect = consumePostAuthRedirect();
          let targetRedirect = '/';
          
          if (savedRedirect) {
            localStorage.removeItem('auth_redirect');
            targetRedirect = savedRedirect;
          } else if (urlRedirect && isValidRedirect(urlRedirect)) {
            targetRedirect = urlRedirect;
          } else if (postAuthRedirect) {
            targetRedirect = postAuthRedirect;
          } else {
            // 查询用户偏好教练类型，智能跳转
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('preferred_coach')
                .eq('id', session.user.id)
                .single();
              
              if (profile?.preferred_coach === 'wealth') {
                targetRedirect = "/coach/wealth_coach_4_questions";
              } else if (profile?.preferred_coach === 'emotion') {
                targetRedirect = "/emotion-coach";
              } else if (profile?.preferred_coach === 'communication') {
                targetRedirect = "/communication";
              } else if (profile?.preferred_coach === 'parent') {
                targetRedirect = "/parent-coach";
              } else {
                targetRedirect = "/mini-app";
              }
            } catch (error) {
              console.log('获取用户偏好失败，跳转默认首页:', error);
              targetRedirect = "/mini-app";
            }
          }

          // 如果是新注册用户，显示关注公众号引导
          if (isNewUser) {
            setPendingRedirect(targetRedirect);
            setShowFollowGuide(true);
          } else {
            navigate(targetRedirect);
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFollowComplete = () => {
    setShowFollowGuide(false);
    if (pendingRedirect) {
      navigate(pendingRedirect);
    } else {
      navigate('/');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 邮箱模式：仅支持登录
      if (authMode === 'email') {
        if (!email.trim()) {
          toast({
            title: "请输入邮箱地址",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) {
          await logAuthEvent({
            event_type: 'login_failed',
            auth_method: 'email_password',
            email: email.trim(),
            error_message: error.message,
            error_code: error.message.includes('Invalid') ? 'invalid_credentials' : 'unknown',
          });
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('邮箱或密码错误');
          }
          throw error;
        }
        
        await logAuthEvent({
          event_type: 'login_success',
          auth_method: 'email_password',
          email: email.trim(),
        });
        toast({
          title: "登录成功",
          description: "欢迎回来 🌿",
        });
        return;
      }

      // 手机号模式
      // 验证手机号格式
      if (!isValidPhone(phone)) {
        toast({
          title: "请输入有效的手机号码",
          description: "手机号码应为5-15位数字",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 生成占位邮箱
      const placeholderEmail = generatePhoneEmail(countryCode, phone);

      if (isLogin) {
        // 灰度：先尝试 unified-login（仅试点手机号会成功）
        let unifiedSuccess = false;
        try {
          const { data: uniData, error: uniErr } = await supabase.functions.invoke('unified-login', {
            body: { phone, password, country_code: countryCode },
          });
          if (!uniErr && uniData?.success && uniData?.tokenHash) {
            const { error: verifyErr } = await supabase.auth.verifyOtp({
              token_hash: uniData.tokenHash,
              type: 'magiclink',
            });
            if (!verifyErr) {
              unifiedSuccess = true;
            }
          }
        } catch (e) {
          // 静默失败，回退到老链路
          console.log('[Auth] unified-login skip, fallback to legacy:', e);
        }

        if (!unifiedSuccess) {
          // 老链路：占位邮箱登录
          const { error } = await supabase.auth.signInWithPassword({
            email: placeholderEmail,
            password,
          });

          if (error) {
            // 兜底：批量注册用户可能只有原生手机号
            const phoneWithCode = `${countryCode}${phone}`;
            const { error: phoneError } = await supabase.auth.signInWithPassword({
              phone: phoneWithCode,
              password,
            });
            if (phoneError) {
              await logAuthEvent({
                event_type: 'login_failed',
                auth_method: 'phone_password',
                phone,
                error_message: phoneError.message,
                error_code: 'invalid_credentials',
              });
              throw new Error('手机号或密码错误');
            }
          }
        }

        await logAuthEvent({
          event_type: 'login_success',
          auth_method: 'phone_password',
          phone,
        });
        
        // 记住账号
        if (rememberMe) {
          const data = { phone, countryCode, password: btoa(password) };
          localStorage.setItem('remembered_login', btoa(JSON.stringify(data)));
        } else {
          localStorage.removeItem('remembered_login');
        }

        toast({
          title: "登录成功",
          description: "欢迎回来 🌿",
        });
      } else {
      // 注册时验证用户名称
        if (!displayName.trim()) {
          toast({
            title: "请输入用户名称",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // 注册前检查手机号是否已存在（使用 RPC 函数绕过 RLS）
        const { data: phoneExists } = await supabase.rpc('check_phone_exists', {
          p_phone: phone,
          p_country_code: countryCode,
        });
        
        if (phoneExists) {
          toast({
            title: "该手机号已注册",
            description: "请切换到登录模式",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: placeholderEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: displayName.trim(),
            },
          },
        });
        
        if (error) {
          // 改善错误信息
          if (error.message.includes('already registered')) {
            throw new Error('该手机号已注册，请直接登录');
          }
          throw error;
        }

        // 创建或更新 profile，包含手机号信息
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              display_name: displayName.trim(),
              phone: phone,
              phone_country_code: countryCode,
              auth_provider: 'phone',
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }
        
        toast({
          title: "注册成功",
          description: "欢迎来到有劲AI 🌿",
        });
      }
    } catch (error: any) {
      toast({
        title: isLogin ? "登录失败" : "注册失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-3 md:px-4 py-4">
      <div className="w-full max-w-md space-y-6 md:space-y-8 animate-in fade-in-50 duration-700">
        <div className="text-center space-y-1.5 md:space-y-2">
          <BrandLogo size="lg" className="justify-center" />
          {!isPhoneOnly && (
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">有劲AI</h1>
          )}
          <p className="text-sm md:text-base text-muted-foreground">
            {isPhoneOnly ? "登录领取绽放合伙人权益" : (isLogin ? "欢迎回来" : "开始你的成长之旅")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-lg space-y-4 md:space-y-6">
          {isPhoneOnly && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <p className="text-sm text-rose-700">
                🌸 请使用手机号登录，以便系统自动为您发放绽放合伙人权益
              </p>
            </div>
          )}

          {/* 登录方式切换 Tabs */}
          <div className="flex border-b border-border mb-2">
            <button
              type="button"
              onClick={() => setAuthMode('sms')}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                authMode === 'sms' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              验证码登录
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('phone'); setIsLogin(true); }}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                authMode === 'phone' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              密码登录
            </button>
            {!isPhoneOnly && (
              <button
                type="button"
                onClick={() => { setAuthMode('email'); setIsLogin(true); }}
                className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                  authMode === 'email' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                邮箱登录
              </button>
            )}
          </div>

          {/* 短信验证码登录模式 */}
          {authMode === 'sms' && (
            <form onSubmit={handleSmsLogin} className="space-y-3 md:space-y-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="smsPhone" className="text-xs md:text-sm">手机号</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[100px] rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {countryCodes.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code} {item.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="smsPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入手机号"
                    required
                    maxLength={15}
                    className="flex-1 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="smsCode" className="text-xs md:text-sm">验证码</Label>
                <div className="flex gap-2">
                  <Input
                    id="smsCode"
                    type="text"
                    inputMode="numeric"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="输入6位验证码"
                    required
                    maxLength={6}
                    className="flex-1 rounded-xl text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendSmsCode}
                    disabled={smsSending || smsCountdown > 0 || !agreedTerms}
                    className="whitespace-nowrap rounded-xl text-xs px-3"
                  >
                    {smsSending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : smsCountdown > 0 ? (
                      `${smsCountdown}s`
                    ) : (
                      "获取验证码"
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !agreedTerms || smsCode.length < 6}
                className="w-full rounded-xl md:rounded-2xl h-10 md:h-12 text-sm md:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 animate-spin" />
                    验证中...
                  </>
                ) : (
                  "登录 / 注册"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                未注册的手机号将自动创建账号
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  id="terms-sms"
                  checked={agreedTerms}
                  onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                />
                <label htmlFor="terms-sms" className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                  继续即表示您同意
                  <Link to="/terms" target="_blank" className="text-primary hover:underline">服务条款</Link>
                  和
                  <Link to="/privacy" target="_blank" className="text-primary hover:underline">隐私政策</Link>
                </label>
              </div>
            </form>
          )}

          {/* 密码登录/注册模式 */}
          {authMode !== 'sms' && (
          <form onSubmit={handleAuth} className="space-y-3 md:space-y-4">
            {/* 邮箱模式标题 */}
            {authMode === 'email' && (
              <div className="text-center pb-2">
                <p className="text-sm text-muted-foreground">使用邮箱登录</p>
              </div>
            )}

            {/* 仅手机号模式且注册时显示用户名称 */}
            {authMode === 'phone' && !isLogin && (
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="displayName" className="text-xs md:text-sm">你的昵称</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="AI教练会用这个名字称呼你"
                  required={!isLogin}
                  maxLength={20}
                  className="rounded-xl text-sm"
                />
              </div>
            )}

            {/* 手机号模式输入框 */}
            {authMode === 'phone' && (
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="phone" className="text-xs md:text-sm">手机号</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[100px] rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {countryCodes.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code} {item.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入手机号"
                    required
                    maxLength={15}
                    className="flex-1 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            {/* 邮箱模式输入框 */}
            {authMode === 'email' && (
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="email" className="text-xs md:text-sm">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱地址"
                  required
                  className="rounded-xl text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="password" className="text-xs md:text-sm">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="rounded-xl text-sm"
              />
            </div>

            {isLogin && authMode === 'phone' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer">
                  记住账号
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !agreedTerms}
              className="w-full rounded-xl md:rounded-2xl h-10 md:h-12 text-sm md:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                authMode === 'email' ? "登录" : (isLogin ? "登录" : "注册")
              )}
            </Button>

            <div className="flex items-center gap-2 mt-3">
              <Checkbox
                id="terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                继续即表示您同意
                <Link to="/terms" target="_blank" className="text-primary hover:underline">服务条款</Link>
                和
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">隐私政策</Link>
              </label>
            </div>
          </form>
          )}



          {!isPhoneOnly && (
            <>
              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  或
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() => navigate(`/wechat-auth?mode=${isLogin ? 'login' : 'register'}`)}
                className="w-full rounded-xl md:rounded-2xl h-10 md:h-12 text-sm md:text-base"
              >
                使用微信{isLogin ? "登录" : "注册"}
              </Button>
            </>
          )}

          {/* 仅手机号模式显示注册/登录切换 */}
          {authMode === 'phone' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "还没有账号？点击注册" : "已有账号？点击登录"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 新用户注册后引导关注公众号 */}
      <Dialog open={showFollowGuide} onOpenChange={() => {}}>
        <DialogContent hideCloseButton className="max-w-sm">
          <FollowGuideStep 
            onComplete={handleFollowComplete}
            onSkip={handleFollowComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;

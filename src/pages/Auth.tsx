import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  const [isLogin, setIsLogin] = useState(isPhoneOnly ? (defaultLogin ? true : false) : true);
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+86");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAgreed: agreedTerms, setAgreed: setAgreedTerms } = useTermsAgreement();
  const [showFollowGuide, setShowFollowGuide] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    // 处理推荐参数
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const redirectTo = urlParams.get('redirect');
    if (refCode) {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        // 判断是否是新注册用户（通过 created_at 判断，5秒内创建的认为是新注册）
        const isNewUser = session.user.created_at && 
          (new Date().getTime() - new Date(session.user.created_at).getTime()) < 5000;

        // 发送登录成功通知到微信公众号
        try {
          await supabase.functions.invoke('send-wechat-template-message', {
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
          });
        } catch (error) {
          console.log('发送登录通知失败（非关键错误）:', error);
        }

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
        
        // 计算目标跳转路径
        const savedRedirect = localStorage.getItem('auth_redirect');
        let targetRedirect = '/';
        
        if (savedRedirect) {
          localStorage.removeItem('auth_redirect');
          targetRedirect = savedRedirect;
        } else {
          // 查询用户偏好教练类型，智能跳转
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('preferred_coach, must_change_password')
              .eq('id', session.user.id)
              .single();

            // 检查是否需要强制修改密码
            if ((profile as any)?.must_change_password === true) {
              localStorage.setItem('change_password_redirect', targetRedirect !== '/' ? targetRedirect : '');
              navigate('/change-password', { replace: true });
              return;
            }
            
            if (profile?.preferred_coach === 'wealth') {
              // 检查是否有活跃的财富训练营
              const { data: activeCamp } = await supabase
                .from('training_camps')
                .select('id')
                .eq('user_id', session.user.id)
                .in('camp_type', ['wealth_block_7', 'wealth_block_21', 'wealth_awakening_21'])
                .eq('status', 'active')
                .maybeSingle();
              
              if (activeCamp) {
                targetRedirect = "/wealth-camp-checkin";
              } else {
                targetRedirect = "/wealth-coach-intro";
              }
            } else if (profile?.preferred_coach === 'emotion') {
              targetRedirect = "/";
            } else if (profile?.preferred_coach === 'communication') {
              targetRedirect = "/communication";
            } else if (profile?.preferred_coach === 'parent') {
              targetRedirect = "/parent-emotion";
            } else {
              targetRedirect = "/";
            }
          } catch (error) {
            console.log('获取用户偏好失败，跳转默认首页:', error);
            targetRedirect = "/";
          }
        }

        // 如果有 savedRedirect，也检查是否需要强制改密码
        if (savedRedirect) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('must_change_password')
              .eq('id', session.user.id)
              .single();
            if ((profile as any)?.must_change_password === true) {
              localStorage.setItem('change_password_redirect', targetRedirect);
              navigate('/change-password', { replace: true });
              return;
            }
          } catch {}
        }

        // 如果是新注册用户，显示关注公众号引导
        if (isNewUser) {
          setPendingRedirect(targetRedirect);
          setShowFollowGuide(true);
        } else {
          navigate(targetRedirect);
        }
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
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('邮箱或密码错误');
          }
          throw error;
        }
        
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
        const { error } = await supabase.auth.signInWithPassword({
          email: placeholderEmail,
          password,
        });
        
        if (error) {
          // 改善错误信息
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('手机号或密码错误');
          }
          throw error;
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">有劲AI</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isLogin ? "欢迎回来" : "开始你的成长之旅"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-lg space-y-4 md:space-y-6">
          {isPhoneOnly && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <p className="text-sm text-rose-700">
                🌸 请使用手机号注册，以便系统自动为您发放绽放合伙人权益
              </p>
            </div>
          )}

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
                <Label htmlFor="displayName" className="text-xs md:text-sm">用户名称</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="请输入你的名称"
                  required={!isLogin}
                  maxLength={50}
                  className="rounded-xl text-sm"
                />
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  这个名称将在复盘报告中使用
                </p>
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

            {/* 邮箱/手机号模式切换入口 - 强制手机模式时隐藏 */}
            {!isPhoneOnly && (
              <div className="text-center pt-1">
                {authMode === 'phone' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('email');
                      setIsLogin(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    📧 之前用邮箱注册？点击这里登录
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMode('phone')}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    📱 使用手机号登录
                  </button>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 mt-3">
              <Checkbox
                id="terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
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
          </form>

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

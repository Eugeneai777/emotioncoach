import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // 处理推荐参数
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const redirectTo = urlParams.get('redirect');
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
    }
    if (redirectTo) {
      localStorage.setItem('auth_redirect', redirectTo);
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
        // 发送登录成功通知到微信公众号
        try {
          await supabase.functions.invoke('send-wechat-template-message', {
            body: {
              userId: session.user.id,
              scenario: 'login_success',
              notification: {
                title: '登录成功',
                message: '欢迎回来',
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
        
        // Redirect to saved path or preferred coach home
        const savedRedirect = localStorage.getItem('auth_redirect');
        if (savedRedirect) {
          localStorage.removeItem('auth_redirect');
          navigate(savedRedirect);
        } else {
          // 查询用户偏好教练类型，智能跳转
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('preferred_coach')
              .eq('id', session.user.id)
              .single();
            
            if (profile?.preferred_coach === 'wealth') {
              // 检查是否有活跃的财富训练营
              const { data: activeCamp } = await supabase
                .from('training_camps')
                .select('id')
                .eq('user_id', session.user.id)
                .in('camp_type', ['wealth_block_21', 'wealth_awakening_21'])
                .eq('status', 'active')
                .maybeSingle();
              
              if (activeCamp) {
                navigate("/wealth-camp-checkin");
              } else {
                navigate("/wealth-coach-intro");
              }
            } else if (profile?.preferred_coach === 'emotion') {
              navigate("/");
            } else if (profile?.preferred_coach === 'communication') {
              navigate("/communication");
            } else if (profile?.preferred_coach === 'parent') {
              navigate("/parent-emotion");
            } else {
              navigate("/");
            }
          } catch (error) {
            console.log('获取用户偏好失败，跳转默认首页:', error);
            navigate("/");
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
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
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: displayName.trim(),
            },
          },
        });
        
        if (error) throw error;

        // 创建或更新 profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              display_name: displayName.trim(),
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }
        
        toast({
          title: "注册成功",
          description: "欢迎来到情绪梳理教练 🌿",
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">情绪梳理教练</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isLogin ? "欢迎回来" : "开始你的情绪梳理之旅"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-lg space-y-4 md:space-y-6">
          <form onSubmit={handleAuth} className="space-y-3 md:space-y-4">
            {!isLogin && (
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

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="email" className="text-xs md:text-sm">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="rounded-xl text-sm"
              />
            </div>

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
              disabled={loading || (!isLogin && !agreedTerms)}
              className="w-full rounded-xl md:rounded-2xl h-10 md:h-12 text-sm md:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                isLogin ? "登录" : "注册"
              )}
            </Button>

            {!isLogin && (
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
            )}
          </form>

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

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "还没有账号？点击注册" : "已有账号？点击登录"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

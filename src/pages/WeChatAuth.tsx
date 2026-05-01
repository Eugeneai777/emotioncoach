import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Loader2, CheckCircle2, Smartphone, Bell, Calendar, MessageCircle, RefreshCw, QrCode, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// 公众号二维码URL - 可以替换为实际的公众号二维码图片
const WECHAT_OFFICIAL_ACCOUNT_QR = "/wechat-official-qr.png";

// 检测是否在微信内置浏览器中
const isWeChatBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

// 检测是否为移动设备
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|HarmonyOS/i.test(navigator.userAgent);
};

export default function WeChatAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [sceneStr, setSceneStr] = useState<string>("");
  const [loginStatus, setLoginStatus] = useState<'pending' | 'scanned' | 'confirmed' | 'expired' | 'not_registered'>('pending');
  const [isOpenPlatform, setIsOpenPlatform] = useState<boolean | null>(null);
  const [authUrl, setAuthUrl] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mode = searchParams.get("mode") || "login";
  
  // 注册模式需要同意服务条款
  const [agreedTerms, setAgreedTerms] = useState(false);

  // 清理轮询
  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // 处理错误参数
  useEffect(() => {
    const error = searchParams.get("wechat_error");
    if (error === "already_bound") {
      const boundAccount = searchParams.get("bound_account");
      toast.error(boundAccount ? `该微信已绑定其他账号（${boundAccount}）` : "该微信已绑定其他账号");
    } else if (error === "not_registered") {
      toast.error("该微信未注册，请先注册");
      navigate("/wechat-auth?mode=register");
    }
  }, [searchParams, navigate]);

  // 生成扫码登录二维码（用于网页端）
  const generateLoginQR = useCallback(async () => {
    setLoading(true);
    setLoginStatus('pending');
    clearPolling();
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-wechat-login-qr', {
        body: { mode }
      });

      if (error || !data?.success) {
        console.error("生成登录二维码失败:", error || data?.error);
        toast.error(data?.error || "生成二维码失败，请稍后重试");
        setLoading(false);
        return;
      }

      setQrCodeUrl(data.qrCodeUrl);
      setSceneStr(data.sceneStr);
      setExpiresIn(data.expiresIn || 300);
      setLoading(false);

      // 开始轮询登录状态
      startPolling(data.sceneStr, data.expiresIn || 300);
    } catch (error) {
      console.error("生成登录二维码失败:", error);
      toast.error("生成二维码失败，请稍后重试");
      setLoading(false);
    }
  }, [mode, clearPolling]);

  // 轮询登录状态
  const startPolling = useCallback((scene: string, expireSeconds: number) => {
    const startTime = Date.now();
    const expireTime = startTime + expireSeconds * 1000;

    pollingRef.current = setInterval(async () => {
      // 检查是否过期
      if (Date.now() > expireTime) {
        setLoginStatus('expired');
        clearPolling();
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-wechat-login-status', {
          body: { sceneStr: scene }
        });

        if (error) {
          console.error("检查登录状态失败:", error);
          return;
        }

         if (data.status === 'confirmed') {
           clearPolling();
           setLoginStatus('confirmed');

           try {
             if (!data?.tokenHash) {
               throw new Error('缺少登录凭证，请重试');
             }

             const { error: verifyError } = await supabase.auth.verifyOtp({
               token_hash: data.tokenHash,
               type: 'magiclink',
             });

             if (verifyError) throw verifyError;

             toast.success("登录成功！");
             setTimeout(() => {
               window.location.href = '/';
             }, 600);
           } catch (e) {
             const msg = e instanceof Error ? e.message : '登录失败';
             toast.error(`登录失败：${msg}`);
             setLoginStatus('expired');
           }
         } else if (data.status === 'not_registered') {
          clearPolling();
          setLoginStatus('not_registered');
          toast.error("该微信未注册，请先注册");
          // 3秒后跳转到注册页
          setTimeout(() => {
            navigate('/wechat-auth?mode=register');
          }, 3000);
        } else if (data.status === 'scanned') {
          setLoginStatus('scanned');
        } else if (data.status === 'expired') {
          setLoginStatus('expired');
          clearPolling();
        }
      } catch (error) {
        console.error("检查登录状态失败:", error);
      }
    }, 2000);
  }, [clearPolling]);

  // 生成移动端授权URL
  const generateMobileAuthUrl = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-wechat-config');

      if (error || !data?.appId) {
        console.error("获取微信配置失败:", error);
        toast.error("微信登录未配置，请联系管理员");
        setLoading(false);
        return;
      }

      const appid = data.appId;
      const appDomain = window.location.origin;
      const redirectUri = encodeURIComponent(`${appDomain}/wechat-oauth-callback`);

      // 把 ?redirect= 透传到 OAuth state，便于回调端兜底（auth_redirect localStorage 不可用时）
      // state 命名格式：
      //   - 'login' / 'register' / 'register_<orderNo>' / 'bind_<userId>'：保持现有协议，向后兼容
      //   - 'login__r__<encodedPath>'：仅登录场景且带 redirect 时使用
      const urlRedirect = searchParams.get("redirect");
      const isSafeRedirect = urlRedirect && urlRedirect.startsWith("/") && !urlRedirect.startsWith("//");
      let state = mode;
      if (mode === "login" && isSafeRedirect) {
        state = `login__r__${encodeURIComponent(urlRedirect!)}`;
        try { localStorage.setItem("auth_redirect", urlRedirect!); } catch {}
      }

      setIsOpenPlatform(data.isOpenPlatform !== false);

      // 公众号网页授权URL
      const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
      setAuthUrl(url);

      // 微信内 H5 + 登录模式：跳过自建确认页，直接进入微信官方授权，压缩转化路径。
      // 注册/绑定/非微信浏览器/桌面扫码保持现有 UI，避免影响其他业务。
      if (mode === "login" && isMobileDevice() && isWeChatBrowser()) {
        window.location.replace(url);
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("生成授权链接失败:", error);
      toast.error("生成授权链接失败");
      setLoading(false);
    }
  }, [mode]);

  // 初始化
  useEffect(() => {
    if (mode === "follow") {
      setLoading(false);
      return;
    }

    // 注册模式且未同意条款时，不自动生成二维码/授权链接
    if (mode === "register" && !agreedTerms) {
      setLoading(false);
      return;
    }

    // 判断设备类型
    if (isMobileDevice()) {
      // 移动端：使用OAuth跳转
      generateMobileAuthUrl();
    } else {
      // 网页端：使用扫码登录
      generateLoginQR();
    }

    return () => {
      clearPolling();
    };
  }, [mode, agreedTerms, generateLoginQR, generateMobileAuthUrl, clearPolling]);

  // 关注公众号引导页面
  if (mode === "follow") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-xl text-foreground">
              注册成功！🎉
            </CardTitle>
            <CardDescription>
              开始你的情绪梳理之旅
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Bell className="h-5 w-5 text-teal-500" />
                <span className="text-lg font-semibold text-foreground">开启智能消息提醒</span>
              </div>
              
              <div className="bg-white rounded-xl p-3 inline-block shadow-sm border border-teal-100">
                <img 
                  src={WECHAT_OFFICIAL_ACCOUNT_QR} 
                  alt="公众号二维码"
                  className="w-36 h-36 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='144' height='144' viewBox='0 0 144 144'%3E%3Crect fill='%23f0f0f0' width='144' height='144'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='12' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E公众号二维码%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">扫码关注「有劲生活365」</p>
            </div>

            <div className="bg-gradient-to-br from-teal-50/50 to-cyan-50/50 rounded-xl p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="text-sm text-foreground">情绪梳理提醒</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-cyan-600" />
                  </div>
                  <span className="text-sm text-foreground">训练打卡提醒</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-foreground">专属消息通知</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button 
                className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white"
                onClick={() => navigate("/")}
              >
                已关注，开始使用
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground text-sm"
                onClick={() => navigate("/")}
              >
                先去体验
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 注册模式且未同意条款 - 显示条款确认页面
  if (mode === "register" && !agreedTerms) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-teal-700">微信注册</CardTitle>
            <CardDescription>请先阅读并同意服务条款</CardDescription>
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
              💡 已有邮箱账号？请先<Link to="/auth" className="text-primary underline mx-0.5 font-medium">登录</Link>后在设置中绑定微信，避免创建重复账户
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="wechat-auth-terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              />
              <label htmlFor="wechat-auth-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer whitespace-nowrap">
                我已阅读并同意
                <Link to="/terms" target="_blank" className="text-primary hover:underline">
                  服务条款
                </Link>
                和
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                  隐私政策
                </Link>
              </label>
            </div>
            
            <Button 
              disabled={!agreedTerms}
              className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600"
            >
              继续微信注册
            </Button>
            
            <div className="text-center">
              <Button variant="link" onClick={() => navigate("/auth")} className="text-teal-600">
                使用其他方式注册
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-teal-500 mb-4" />
            <p className="text-muted-foreground">正在加载微信授权...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 微信内移动端 - 用户主动触发授权
  if (isMobileDevice() && isWeChatBrowser()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border bg-card shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex items-center gap-2 text-left">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
                aria-label="返回其他登录方式"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle>{mode === "register" ? "微信注册确认" : "微信登录确认"}</CardTitle>
              <CardDescription>
                点击后将前往微信官方授权页，完成后自动回到有劲AI。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>仅用于确认你的微信身份，不会自动发布内容。</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>授权完成后会回到刚才的业务页面或首页。</span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!authUrl}
              onClick={() => {
                if (!authUrl) return;
                window.location.href = authUrl;
              }}
            >
              继续微信授权
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              使用手机号登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 移动端非微信浏览器 - 提示复制链接
  if (isMobileDevice() && !isWeChatBrowser()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-teal-700">
              {mode === "register" ? "微信注册" : "微信登录"}
            </CardTitle>
            <CardDescription>
              请在微信中打开此页面完成授权
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-10 w-10 text-white" />
              </div>
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  微信授权登录需要在微信内打开
                </p>
                <div className="bg-white/80 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">操作步骤：</p>
                  <ol className="text-xs text-left text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>复制当前页面链接</li>
                    <li>打开微信，发送给自己或文件传输助手</li>
                    <li>在微信中点击链接完成授权</li>
                  </ol>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("链接已复制");
                  }}
                >
                  复制链接
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => navigate("/auth")}
                className="text-teal-600"
              >
                使用其他方式登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 网页端 - 扫码登录
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-teal-700">
            {mode === "register" ? "微信注册" : "微信登录"}
          </CardTitle>
          <CardDescription>
            {loginStatus === 'scanned' 
              ? "已扫码，请在微信中确认授权" 
              : loginStatus === 'confirmed'
              ? "登录成功，正在跳转..."
              : loginStatus === 'expired'
              ? "二维码已过期，请刷新重试"
              : "使用微信扫描下方二维码"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
            {loginStatus === 'confirmed' ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <p className="text-lg font-medium text-teal-700">登录成功！</p>
                <p className="text-sm text-muted-foreground">正在跳转...</p>
              </div>
            ) : loginStatus === 'expired' ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <QrCode className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground">二维码已过期</p>
                <Button
                  onClick={generateLoginQR}
                  className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新二维码
                </Button>
              </div>
            ) : qrCodeUrl ? (
              <div className="text-center space-y-4">
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <img 
                    src={qrCodeUrl} 
                    alt="微信登录二维码" 
                    className="w-48 h-48 object-contain"
                    onError={(e) => {
                      console.error("QR code load error");
                      setLoginStatus('expired');
                    }}
                  />
                </div>
                {loginStatus === 'scanned' && (
                  <div className="flex items-center justify-center gap-2 text-teal-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">已扫码，等待确认...</span>
                  </div>
                )}
                {loginStatus === 'pending' && (
                  <p className="text-xs text-muted-foreground">
                    请打开微信扫一扫
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  二维码加载失败，请刷新重试
                </div>
                <Button
                  variant="outline"
                  onClick={generateLoginQR}
                  className="text-teal-600 border-teal-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新加载
                </Button>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            {mode === "register" ? (
              <Button
                variant="link"
                onClick={() => navigate("/wechat-auth?mode=login")}
                className="text-teal-600"
              >
                已有账号？去登录
              </Button>
            ) : (
              <Button
                variant="link"
                onClick={() => navigate("/wechat-auth?mode=register")}
                className="text-teal-600"
              >
                没有账号？去注册
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

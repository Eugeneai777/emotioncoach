import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2, QrCode, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// 公众号二维码URL - 可以替换为实际的公众号二维码图片
const WECHAT_OFFICIAL_ACCOUNT_QR = "/wechat-official-qr.png";

export default function WeChatAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const mode = searchParams.get("mode") || "login"; // login, register, or follow

  useEffect(() => {
    const error = searchParams.get("wechat_error");
    if (error === "already_bound") {
      toast.error("该微信已绑定其他账号");
    } else if (error === "not_registered") {
      toast.error("该微信未注册，请先注册");
      navigate("/wechat-auth?mode=register");
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // follow 模式不需要生成登录二维码
    if (mode !== "follow") {
      generateQRCode();
    }
  }, [mode, user]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-wechat-config');

      if (error || !data?.appId) {
        console.error("获取微信配置失败:", error);
        toast.error("微信登录未配置，请联系管理员");
        return;
      }

      const appid = data.appId;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const redirectUri = encodeURIComponent(
        `${supabaseUrl}/functions/v1/wechat-oauth-callback`
      );
      const state = mode;

      const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
      
      setQrCodeUrl(authUrl);
    } catch (error) {
      console.error("生成二维码失败:", error);
      toast.error("生成二维码失败");
    } finally {
      setLoading(false);
    }
  };

  // 关注公众号引导页面
  if (mode === "follow") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl text-foreground">
              注册成功！🎉
            </CardTitle>
            <CardDescription className="text-base">
              欢迎加入情绪梳理教练
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 关注公众号引导 */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-teal-700 font-medium">
                <QrCode className="h-5 w-5" />
                <span>关注公众号，获取更多福利</span>
              </div>
              
              <div className="bg-white rounded-lg p-4 inline-block shadow-sm">
                <img 
                  src={WECHAT_OFFICIAL_ACCOUNT_QR} 
                  alt="公众号二维码"
                  className="w-40 h-40 object-contain"
                  onError={(e) => {
                    // 如果图片加载失败，显示占位图
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect fill='%23f0f0f0' width='160' height='160'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E公众号二维码%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>扫码关注「有劲生活365」公众号</p>
                <ul className="text-left space-y-1 pl-4">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>每日情绪梳理提醒</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>训练营打卡通知</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>专属优惠活动</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white"
                onClick={() => navigate("/")}
              >
                已关注，开始使用
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => navigate("/")}
              >
                稍后关注
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 登录/注册页面
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
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
          <CardTitle>
            {mode === "register" ? "微信注册" : "微信登录"}
          </CardTitle>
          <CardDescription>
            {mode === "register" 
              ? "使用微信扫码完成注册" 
              : "使用微信扫码快速登录"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center p-8 bg-secondary/20 rounded-lg">
            {loading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            ) : qrCodeUrl ? (
              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  请使用微信扫描下方二维码
                </div>
                <iframe
                  src={qrCodeUrl}
                  className="w-64 h-64 border-0"
                  title="微信登录二维码"
                />
                <div className="text-xs text-muted-foreground">
                  扫码后请在微信中确认授权
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                二维码加载失败，请刷新页面重试
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            {mode === "register" ? (
              <Button
                variant="link"
                onClick={() => navigate("/wechat-auth?mode=login")}
              >
                已有账号？去登录
              </Button>
            ) : (
              <Button
                variant="link"
                onClick={() => navigate("/wechat-auth?mode=register")}
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

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function WeChatAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const mode = searchParams.get("mode") || "login"; // login or register

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
    generateQRCode();
  }, [mode, user]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // 获取当前用户的微信配置
      const { data: profile } = await supabase
        .from("profiles")
        .select("wechat_appid")
        .eq("id", user?.id || "00000000-0000-0000-0000-000000000000")
        .single();

      if (!profile?.wechat_appid) {
        toast.error("管理员未配置微信登录");
        return;
      }

      const appid = profile.wechat_appid;
      const redirectUri = encodeURIComponent(
        `${window.location.origin}/api/wechat-oauth-callback`
      );
      const state = mode; // 使用 mode 作为 state

      // 生成微信授权二维码URL
      const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
      
      setQrCodeUrl(authUrl);
    } catch (error) {
      console.error("生成二维码失败:", error);
      toast.error("生成二维码失败");
    } finally {
      setLoading(false);
    }
  };

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

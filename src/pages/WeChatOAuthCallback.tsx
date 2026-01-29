import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function WeChatOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        setError("缺少必要参数");
        toast.error("微信授权失败：缺少必要参数");
        setTimeout(() => navigate("/auth"), 2000);
        return;
      }

      // 判断是否是绑定流程（state 格式：bind_用户ID）
      const isBind = state.startsWith('bind_');

      try {
        // 调用 Edge Function 处理 OAuth
        const { data, error: invokeError } = await supabase.functions.invoke('wechat-oauth-process', {
          body: { code, state }
        });

        if (invokeError) {
          throw new Error(invokeError.message);
        }

        // 处理绑定成功的情况
        if (isBind && (data?.success || data?.bindSuccess)) {
          toast.success("微信账号绑定成功！");
          // 首次绑定成功后引导用户关注公众号
          navigate("/settings?tab=notifications&wechat_bound=success");
          return;
        }

        if (data?.error) {
          if (data.error === 'already_bound') {
            toast.error("该微信已绑定其他账号，如需绑定当前账号请先解绑");
            navigate("/settings?tab=notifications&wechat_error=already_bound");
          } else if (data.error === 'not_registered') {
            toast.error("该微信未注册，请先注册");
            navigate("/wechat-auth?mode=register");
          } else {
            throw new Error(data.error);
          }
          return;
        }

        // 如果返回了 magic link，处理登录
        if (data?.magicLink) {
          // 使用 token 完成登录
          const { error: signInError } = await supabase.auth.verifyOtp({
            token_hash: data.tokenHash,
            type: 'magiclink'
          });

          if (signInError) {
            throw signInError;
          }

          toast.success("登录成功！");
          
          // 登录通知已在后端 wechat-oauth-process 中发送，前端无需重复发送
          
          // 检查是否有待领取的合伙人邀请
          const pendingInvite = localStorage.getItem('pending_partner_invite');
          if (pendingInvite) {
            localStorage.removeItem('pending_partner_invite');
            // 调用领取接口
            try {
              const { data: claimData } = await supabase.functions.invoke('claim-partner-invitation', {
                body: { invite_code: pendingInvite }
              });
              if (claimData?.success) {
                toast.success(claimData.message || "恭喜您成为绽放合伙人！");
                navigate("/partner");
                return;
              }
            } catch (err) {
              console.error('Auto claim invitation failed:', err);
            }
          }
          
          // 新用户跳转到关注页，老用户直接进入首页
          if (data.isNewUser) {
            navigate("/wechat-auth?mode=follow");
          } else {
            navigate("/");
          }
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        const message = err instanceof Error ? err.message : "未知错误";
        setError(message);
        toast.error(`微信授权失败: ${message}`);
        setTimeout(() => navigate("/auth"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-red-500 text-lg">{error}</div>
            <div className="text-muted-foreground text-sm">正在跳转...</div>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto" />
            <div className="text-muted-foreground">正在处理微信授权...</div>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { consumePostAuthRedirect } from "@/lib/postAuthRedirect";

export default function WeChatOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"received" | "verifying" | "returning">("received");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        setError("缺少必要参数");
        toast.error("微信授权失败：缺少必要参数");
        setTimeout(() => navigate("/auth", { replace: true }), 2000);
        return;
      }

      // 判断是否是绑定流程（state 格式：bind_用户ID）
      const isBind = state.startsWith('bind_');

      try {
        setStep("verifying");
        // 调用 Edge Function 处理 OAuth
        const { data, error: invokeError } = await supabase.functions.invoke('wechat-oauth-process', {
          body: { code, state }
        });

        if (invokeError) {
          throw new Error(invokeError.message);
        }

        // 处理绑定成功的情况
        if (isBind && (data?.success || data?.bindSuccess)) {
          setStep("returning");
          toast.success("微信账号绑定成功！");
        // 首次绑定成功后引导用户关注公众号
          navigate("/settings?tab=notifications&wechat_bound=success", { replace: true });
          return;
        }

        if (data?.error) {
          if (data.error === 'already_bound') {
            setStep("returning");
            const accountName = data.bound_account_name || '未知账号';
            toast.error(`该微信已绑定其他账号（${accountName}），如需绑定当前账号请先解绑`);
            navigate(`/settings?tab=notifications&wechat_error=already_bound&bound_account=${encodeURIComponent(accountName)}`, { replace: true });
          } else if (data.error === 'not_registered') {
            setStep("returning");
            toast.error("该微信未注册，请先注册");
            navigate("/wechat-auth?mode=register", { replace: true });
          } else {
            throw new Error(data.error);
          }
          return;
        }

        // 如果返回了 magic link，处理登录
        if (data?.magicLink) {
          setStep("verifying");
          // 使用 token 完成登录
          const { error: signInError } = await supabase.auth.verifyOtp({
            token_hash: data.tokenHash,
            type: 'magiclink'
          });

          if (signInError) {
            throw signInError;
          }

          toast.success("登录成功！");
          setStep("returning");
          
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
                navigate("/partner", { replace: true });
                return;
              }
            } catch (err) {
              console.error('Auto claim invitation failed:', err);
            }
          }
          
        // 检查是否有待跳转的目标路径
        // 优先级：auth_redirect (业务页跳登录前写入) > state 中携带的 redirect > post_auth_redirect (支付场景) > 新用户引导 > 首页
        const isSafePath = (p: string | null | undefined): p is string =>
          !!p && p.startsWith("/") && !p.startsWith("//");

        let resolvedRedirect: string | null = null;
        try {
          const saved = localStorage.getItem("auth_redirect");
          if (isSafePath(saved)) {
            resolvedRedirect = saved;
            localStorage.removeItem("auth_redirect");
          }
        } catch {}

        if (!resolvedRedirect && state.startsWith("login__r__")) {
          try {
            const decoded = decodeURIComponent(state.replace("login__r__", ""));
            if (isSafePath(decoded)) resolvedRedirect = decoded;
          } catch {}
        }

        const postAuthRedirect = consumePostAuthRedirect();

        if (resolvedRedirect) {
          navigate(resolvedRedirect, { replace: true });
          return;
        }

          if (postAuthRedirect) {
            navigate(postAuthRedirect, { replace: true });
            return;
          }

          // 新用户跳转到关注页，老用户直接进入首页
          if (data.isNewUser) {
            navigate("/wechat-auth?mode=follow", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
          return;
        }

        // 兜底处理：如果没有匹配任何已知情况，也导航到设置页
        if (isBind) {
          setStep("returning");
          console.warn('Unexpected bind response:', data);
          navigate("/settings?tab=notifications", { replace: true });
          return;
        }

        // 对于其他未知情况，导航到首页
        setStep("returning");
        console.warn('Unknown OAuth response:', data);
        navigate("/", { replace: true });
      } catch (err) {
        console.error("OAuth callback error:", err);
        const message = err instanceof Error ? err.message : "未知错误";
        setError(message);
        toast.error(`微信授权失败: ${message}`);
        setTimeout(() => navigate("/auth", { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-xl">
        {error ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldCheck className="h-6 w-6 text-destructive" />
            </div>
            <div className="text-lg font-medium text-destructive">授权未完成</div>
            <div className="mt-2 text-sm text-muted-foreground">{error}</div>
            <div className="mt-4 text-xs text-muted-foreground">正在返回登录页...</div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {step === "returning" ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
            </div>
            <div className="text-base font-medium text-foreground">
              {step === "returning" ? "登录成功" : "正在登录..."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

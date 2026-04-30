import { useEffect } from "react";
import { useImpersonation, setImpersonationSession } from "@/hooks/useImpersonation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * 全局横幅:展示「你正在以 XXX 身份浏览」并提供退出按钮。
 * 同时处理 magic link 登录回调时的 ?impersonating=1 标记。
 */
export function ImpersonationBanner() {
  const { isImpersonating, session, exitImpersonation } = useImpersonation();

  // 检测 URL 上的 ?impersonating=1,首次进入则建立 sessionStorage 标记
  useEffect(() => {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("impersonating");
    if (!flag) return;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        const userId = data.session?.user?.id;
        if (!accessToken || !userId) return;

        // 取目标用户基本信息(profile 公开字段即可)
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, phone")
          .eq("id", userId)
          .maybeSingle();

        setImpersonationSession({
          token: accessToken.slice(0, 32),
          startedAt: Date.now(),
          targetUserId: userId,
          targetDisplayName: profile?.display_name || undefined,
          targetPhone: (profile as any)?.phone || undefined,
        });

        window.dispatchEvent(new Event("impersonation-changed"));
      } catch (e) {
        console.warn("[ImpersonationBanner] init error", e);
      } finally {
        // 清掉 query,避免刷新重复触发
        url.searchParams.delete("impersonating");
        const newUrl = url.pathname + (url.search || "") + url.hash;
        window.history.replaceState(null, "", newUrl);
      }
    })();
  }, []);

  if (!isImpersonating || !session) return null;

  const label =
    session.targetDisplayName ||
    session.targetPhone ||
    session.targetUserId ||
    "未知用户";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground shadow-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
    >
      <div className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">
          ⚠️ 模拟登录中:你正在以 <strong>{label}</strong> 身份浏览,所有操作将真实生效
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={exitImpersonation}
          className="h-7 shrink-0 gap-1 px-2 text-xs"
        >
          <LogOut className="h-3 w-3" />
          退出模拟
        </Button>
      </div>
    </div>
  );
}

/** 占位,推开页面顶部内容,避免被横幅遮挡 */
export function ImpersonationSpacer() {
  const { isImpersonating } = useImpersonation();
  if (!isImpersonating) return null;
  return <div className="h-10 sm:h-9" aria-hidden />;
}

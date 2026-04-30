import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "impersonation_session_v1";

export interface ImpersonationSession {
  token: string;
  startedAt: number;
  targetUserId?: string;
  targetDisplayName?: string;
  targetPhone?: string;
}

export function getImpersonationSession(): ImpersonationSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setImpersonationSession(s: ImpersonationSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearImpersonationSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Hook: 返回当前是否在模拟会话中 + 退出函数 */
export function useImpersonation() {
  const [session, setSession] = useState<ImpersonationSession | null>(() =>
    getImpersonationSession()
  );

  useEffect(() => {
    const handler = () => setSession(getImpersonationSession());
    window.addEventListener("impersonation-changed", handler);
    return () => window.removeEventListener("impersonation-changed", handler);
  }, []);

  const exitImpersonation = useCallback(async () => {
    const current = getImpersonationSession();
    if (current?.token) {
      try {
        await supabase.functions.invoke("admin-impersonate-user", {
          body: { action: "end", token: current.token },
        });
      } catch (e) {
        console.warn("[impersonation] end log failed", e);
      }
    }
    clearImpersonationSession();
    window.dispatchEvent(new Event("impersonation-changed"));
    await supabase.auth.signOut();
    // 跳到登录页
    window.location.href = "/auth";
  }, []);

  return {
    isImpersonating: !!session,
    session,
    exitImpersonation,
  };
}

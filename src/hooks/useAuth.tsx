import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 设置认证状态监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // 登录时静默检查绽放合伙人自动匹配
        if (event === 'SIGNED_IN' && session?.user) {
          const key = `bloom_auto_claim_checked_${session.user.id}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            supabase.functions.invoke('auto-claim-bloom-invitation').then(({ data, error }) => {
              if (error) {
                console.warn('Auto-claim check returned error (ignored):', error.message);
                return;
              }
              if (data?.matched && data?.success) {
                console.log('Auto-claimed bloom partner invitation');
              }
            }).catch(err => {
              console.warn('Auto-claim check failed (ignored):', err);
            });
          }

          // 检查是否有待认领的游客订单
          const pendingOrderNo = localStorage.getItem('pending_claim_order');
          if (pendingOrderNo) {
            localStorage.removeItem('pending_claim_order');
            console.log('[useAuth] Claiming guest order:', pendingOrderNo);
            supabase.functions.invoke('claim-guest-order', {
              body: { orderNo: pendingOrderNo },
            }).then(({ data, error }) => {
              if (error) {
                console.error('[useAuth] Claim guest order failed:', error);
              } else if (data?.success) {
                console.log('[useAuth] Guest order claimed successfully:', data.message);
                // 可以在此触发页面刷新或重新获取用户数据
              }
            }).catch(err => {
              console.error('[useAuth] Claim guest order error:', err);
            });
          }
        }
      }
    );

    // 检查现有会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
};

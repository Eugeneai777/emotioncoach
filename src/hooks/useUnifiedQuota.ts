import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const INITIAL_GUEST_QUOTA = 100;

function storageKey(scope: string) {
  return `${scope}_quota`;
}

function getStoredGuestQuota(scope: string): number {
  try {
    const stored = localStorage.getItem(storageKey(scope));
    if (stored === null) {
      localStorage.setItem(storageKey(scope), String(INITIAL_GUEST_QUOTA));
      return INITIAL_GUEST_QUOTA;
    }
    return Math.max(0, parseInt(stored, 10) || 0);
  } catch {
    return INITIAL_GUEST_QUOTA;
  }
}

function deductGuestLocal(scope: string, cost: number): { ok: boolean; next: number } {
  const current = getStoredGuestQuota(scope);
  if (current < cost) return { ok: false, next: current };
  const next = current - cost;
  localStorage.setItem(storageKey(scope), String(next));
  return { ok: true, next };
}

/**
 * 统一配额 hook：
 * - 未登录游客：使用 localStorage 100 点试用（保留拉新心智）
 * - 已登录用户：使用 user_accounts.remaining_quota（全站统一计费）
 *   登录用户没有任何白名单，所有人按点数扣费；会员/训练营靠点数余额或时长上限享受权益
 *
 * API 与原 useXiaojinQuota / useDajinQuota 完全兼容（同步 canAfford / deduct 返回 boolean）。
 */
export function useUnifiedQuota(scope: 'xiaojin' | 'dajin') {
  const { user, loading: authLoading } = useAuth();
  const [remaining, setRemaining] = useState<number>(() =>
    user ? 0 : getStoredGuestQuota(scope)
  );
  const remainingRef = useRef<number>(remaining);
  remainingRef.current = remaining;

  const isGuest = !user;

  // 同步登录用户余额
  const fetchAccountQuota = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_accounts')
      .select('remaining_quota')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!error && data) {
      setRemaining(data.remaining_quota ?? 0);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchAccountQuota();
    } else {
      setRemaining(getStoredGuestQuota(scope));
    }
  }, [user, authLoading, scope, fetchAccountQuota]);

  const canAfford = useCallback(
    (cost: number): boolean => {
      if (isGuest) {
        return getStoredGuestQuota(scope) >= cost;
      }
      // 登录用户：基于本地缓存的余额做同步判断（与全站 useVoiceBilling 一致）
      return remainingRef.current >= cost;
    },
    [isGuest, scope]
  );

  const deduct = useCallback(
    (cost: number): boolean => {
      if (isGuest) {
        const { ok, next } = deductGuestLocal(scope, cost);
        if (ok) setRemaining(next);
        return ok;
      }
      // 登录用户：同步判断 + 乐观更新 + 异步 RPC 扣费
      if (remainingRef.current < cost) return false;
      const optimistic = remainingRef.current - cost;
      setRemaining(optimistic);
      remainingRef.current = optimistic;
      supabase
        .rpc('deduct_user_quota', { p_user_id: user!.id, p_amount: cost })
        .then(({ data, error }) => {
          if (error) {
            // 失败回滚
            console.warn('[useUnifiedQuota] deduct failed, refreshing:', error.message);
            fetchAccountQuota();
          } else if (data && data[0]) {
            setRemaining(data[0].remaining_quota ?? optimistic);
          }
        });
      return true;
    },
    [isGuest, scope, user, fetchAccountQuota]
  );

  const refresh = useCallback(() => {
    if (isGuest) {
      setRemaining(getStoredGuestQuota(scope));
    } else {
      fetchAccountQuota();
    }
  }, [isGuest, scope, fetchAccountQuota]);

  return { remaining, deduct, canAfford, refresh, isGuest };
}

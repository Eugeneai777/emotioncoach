import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Query } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// 用 app version 作为 buster,发版后自动失效旧缓存
const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || "v1";
const STORAGE_KEY = "lovable-rq-cache-v1";

/** 安全的 localStorage 包装(隐私模式/iOS 满容时降级) */
const safeStorage: Storage = (() => {
  try {
    const k = "__rq_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    // fallback: noop storage
    const mem = new Map<string, string>();
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => { mem.set(k, v); },
      removeItem: (k) => { mem.delete(k); },
      clear: () => mem.clear(),
      key: (i) => Array.from(mem.keys())[i] ?? null,
      get length() { return mem.size; },
    } as Storage;
  }
})();

export const persister = createSyncStoragePersister({
  storage: safeStorage,
  key: STORAGE_KEY,
  // 只持久化非敏感、非实时数据(默认全部持久化,通过 meta.persist=false 排除)
  throttleTime: 1000,
});

export const PERSIST_BUSTER = APP_VERSION;

/**
 * 哪些 query 可以写入磁盘:
 * - 默认 yes
 * - meta.persist === false → 不持久化(实时数据/敏感数据显式声明)
 * - queryKey 含 'realtime' / 'private' / 'token' → 不持久化(兜底)
 */
export function shouldDehydrateQuery(query: Query): boolean {
  if (query.state.status !== "success") return false;
  const meta = query.meta as { persist?: boolean } | undefined;
  if (meta?.persist === false) return false;
  const keyStr = JSON.stringify(query.queryKey).toLowerCase();
  if (
    keyStr.includes("realtime") ||
    keyStr.includes("token") ||
    keyStr.includes("session-token") ||
    keyStr.includes("private-message")
  ) return false;
  return true;
}

/** 清空所有持久化缓存(账号切换/登出时调用) */
export function clearPersistedCache() {
  try {
    safeStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** 监听 auth 状态变化,登出/换号时清缓存,防止串号 */
let lastUserId: string | null | undefined;
export function installAuthCacheGuard(onClear: () => void) {
  supabase.auth.getSession().then(({ data }) => {
    lastUserId = data.session?.user?.id ?? null;
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    const nextId = session?.user?.id ?? null;
    if (event === "SIGNED_OUT" || (lastUserId && nextId && lastUserId !== nextId)) {
      clearPersistedCache();
      onClear();
    }
    lastUserId = nextId;
  });

  return () => subscription.unsubscribe();
}

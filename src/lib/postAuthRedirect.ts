/**
 * post_auth_redirect 带时效的存取工具
 * 防止过期的支付跳转影响正常登录
 */

const KEY = 'post_auth_redirect';
const TS_KEY = 'post_auth_redirect_ts';
const TTL_MS = 15 * 60 * 1000; // 15 分钟

/** 写入 post_auth_redirect（附带时间戳） */
export function setPostAuthRedirect(path: string): void {
  localStorage.setItem(KEY, path);
  localStorage.setItem(TS_KEY, String(Date.now()));
}

/** 读取 post_auth_redirect（过期返回 null，读取后自动清除） */
export function consumePostAuthRedirect(): string | null {
  const path = localStorage.getItem(KEY);
  const ts = localStorage.getItem(TS_KEY);

  // 清除
  localStorage.removeItem(KEY);
  localStorage.removeItem(TS_KEY);

  if (!path) return null;

  // 检查时效
  if (ts) {
    const elapsed = Date.now() - Number(ts);
    if (elapsed > TTL_MS) {
      console.log('[postAuthRedirect] Expired, ignoring:', path, `(${Math.round(elapsed / 1000)}s ago)`);
      return null;
    }
  }

  return path;
}

/** 清除 post_auth_redirect */
export function clearPostAuthRedirect(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(TS_KEY);
}

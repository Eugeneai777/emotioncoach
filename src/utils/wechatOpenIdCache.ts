import { isWeChatMiniProgram } from "@/utils/platform";

export type WechatOpenIdScope = "wechat" | "payment";

const ENV = import.meta.env.MODE || "production";

const legacyKeys = {
  wechat: ["cached_wechat_openid"],
  payment: ["cached_payment_openid", "cached_payment_openid_gzh", "cached_payment_openid_mp"],
};

export const getWechatOpenIdCacheKey = (scope: WechatOpenIdScope, userId?: string | null) => {
  const platform = isWeChatMiniProgram() ? "mp" : "gzh";
  const owner = userId || "guest";
  return `wechat_openid:${ENV}:${platform}:${scope}:${owner}`;
};

export const readWechatOpenIdCache = (scope: WechatOpenIdScope, userId?: string | null) => {
  try {
    const scopedKey = getWechatOpenIdCacheKey(scope, userId);
    const scoped = localStorage.getItem(scopedKey) || sessionStorage.getItem(scopedKey);
    if (scoped) return scoped;

    return legacyKeys[scope]
      .map((key) => localStorage.getItem(key) || sessionStorage.getItem(key))
      .find(Boolean) || undefined;
  } catch {
    return undefined;
  }
};

export const writeWechatOpenIdCache = (scope: WechatOpenIdScope, openId: string, userId?: string | null) => {
  try {
    const scopedKey = getWechatOpenIdCacheKey(scope, userId);
    localStorage.setItem(scopedKey, openId);
    sessionStorage.setItem(scopedKey, openId);
    legacyKeys[scope].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    // ignore storage failures
  }
};

export const clearWechatOpenIdCaches = () => {
  try {
    const prefix = `wechat_openid:${ENV}:`;
    [...Object.keys(localStorage), ...Object.keys(sessionStorage)].forEach((key) => {
      if (key.startsWith(prefix) || [...legacyKeys.wechat, ...legacyKeys.payment].includes(key)) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
    });
  } catch {
    // ignore storage failures
  }
};
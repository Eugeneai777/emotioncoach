import { useUnifiedQuota } from './useUnifiedQuota';

/**
 * 小劲 AI 配额 hook（青少年专区）
 * 已委托给 useUnifiedQuota：游客本地 100 点 / 登录用户走 user_accounts。
 * 对外 API 完全兼容历史调用方。
 */
export function useXiaojinQuota() {
  return useUnifiedQuota('xiaojin');
}

/**
 * 前端登录注册事件埋点。
 *
 * 用于上报无法在边缘函数中捕获的事件（如直连 supabase.auth.signInWithPassword）。
 * 数据写入 monitor_auth_events 表，由 /admin/user-anomaly 「登录注册监控」面板展示。
 *
 * 失败不抛错（避免影响主流程）。
 */
import { supabase } from "@/integrations/supabase/client";

export type AuthEventType =
  | 'login_success'
  | 'login_failed'
  | 'register_success'
  | 'register_failed'
  | 'bind_success'
  | 'bind_failed'
  | 'logout'
  | 'token_refresh'
  | 'password_reset';

export type AuthMethod =
  | 'sms'
  | 'password'
  | 'wechat_oauth'
  | 'wechat_scan'
  | 'wechat_mp'
  | 'miniprogram'
  | 'magic_link'
  | 'phone_password'
  | 'email_password'
  | 'auto_register'
  | 'payment_register'
  | 'batch_register';

export interface AuthEventInput {
  event_type: AuthEventType;
  auth_method: AuthMethod;
  user_id?: string | null;
  phone?: string | null;
  email?: string | null;
  error_message?: string | null;
  error_code?: string | null;
  extra?: Record<string, unknown>;
}

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('miniprogram')) return 'miniprogram';
  if (ua.includes('micromessenger')) return 'wechat';
  if (/iphone|android|mobile/.test(ua)) return 'mobile';
  return 'web';
}

export async function logAuthEvent(payload: AuthEventInput): Promise<void> {
  try {
    await supabase.from('monitor_auth_events').insert({
      event_type: payload.event_type,
      auth_method: payload.auth_method,
      user_id: payload.user_id ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      error_message: payload.error_message ?? null,
      error_code: payload.error_code ?? null,
      platform: detectPlatform(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      referer: typeof document !== 'undefined' ? document.referrer || null : null,
      extra: payload.extra ?? {},
    });
  } catch (err) {
    console.warn('[authEventLogger] log failed:', err);
  }
}

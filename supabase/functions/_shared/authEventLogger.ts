/**
 * 登录注册监控埋点工具
 * 使用方式：
 *   import { logAuthEvent } from "../_shared/authEventLogger.ts";
 *   await logAuthEvent(req, {
 *     event_type: 'login_success',
 *     auth_method: 'sms',
 *     user_id: userId,
 *     phone,
 *   });
 *
 * 数据写入 monitor_auth_events 表，由前端 /admin/user-anomaly 「登录注册监控」面板展示。
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

export interface AuthEventPayload {
  event_type: AuthEventType;
  auth_method: AuthMethod;
  user_id?: string | null;
  phone?: string | null;
  email?: string | null;
  error_message?: string | null;
  error_code?: string | null;
  platform?: string | null; // 'web' | 'mobile' | 'wechat' | 'miniprogram'
  extra?: Record<string, unknown>;
}

function detectPlatform(req: Request): string {
  const ua = req.headers.get('user-agent')?.toLowerCase() || '';
  if (ua.includes('miniprogram')) return 'miniprogram';
  if (ua.includes('micromessenger')) return 'wechat';
  if (/iphone|android|mobile/.test(ua)) return 'mobile';
  return 'web';
}

/**
 * 上报登录/注册事件。失败不抛错（避免影响主流程）。
 */
export async function logAuthEvent(
  req: Request,
  payload: AuthEventPayload,
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return;

    const client = createClient(supabaseUrl, serviceKey);

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    await client.from('monitor_auth_events').insert({
      event_type: payload.event_type,
      auth_method: payload.auth_method,
      user_id: payload.user_id ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      error_message: payload.error_message ?? null,
      error_code: payload.error_code ?? null,
      ip_address: ipAddress,
      user_agent: req.headers.get('user-agent') || null,
      platform: payload.platform || detectPlatform(req),
      referer: req.headers.get('referer') || null,
      extra: payload.extra ?? {},
    });
  } catch (err) {
    console.warn('[authEventLogger] log failed:', err);
  }
}

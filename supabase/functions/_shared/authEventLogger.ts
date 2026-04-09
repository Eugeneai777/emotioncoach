/**
 * 登录注册事件日志记录器
 * 用于在 Edge Functions 中记录认证事件到 monitor_auth_events 表
 */

interface AuthEventParams {
  eventType: 'login_success' | 'login_fail' | 'register_success' | 'register_fail' | 'bind_success' | 'bind_fail';
  authMethod: 'wechat' | 'sms' | 'password' | 'wechat_mini' | 'wechat_pay' | 'wechat_callback';
  userId?: string;
  phone?: string;
  email?: string;
  errorMessage?: string;
  errorCode?: string;
  ipAddress?: string;
  userAgent?: string;
  platform?: string;
  referer?: string;
  extra?: Record<string, unknown>;
}

/**
 * 记录认证事件（异步，不阻塞主流程）
 */
export function logAuthEvent(
  supabaseClient: any,
  params: AuthEventParams
): void {
  const {
    eventType,
    authMethod,
    userId,
    phone,
    email,
    errorMessage,
    errorCode,
    ipAddress,
    userAgent,
    platform = 'web',
    referer,
    extra = {},
  } = params;

  // 异步插入，不等待结果
  supabaseClient
    .from('monitor_auth_events')
    .insert({
      event_type: eventType,
      auth_method: authMethod,
      user_id: userId || null,
      phone: phone || null,
      email: email || null,
      error_message: errorMessage || null,
      error_code: errorCode || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      platform,
      referer: referer || null,
      extra,
    })
    .then(({ error }: any) => {
      if (error) {
        console.error('[AuthEventLogger] Failed to log event:', error.message);
      }
    })
    .catch((err: any) => {
      console.error('[AuthEventLogger] Exception:', err);
    });
}

/**
 * 从请求中提取客户端信息
 */
export function extractClientInfo(req: Request) {
  return {
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown',
    userAgent: req.headers.get('user-agent') || undefined,
    referer: req.headers.get('referer') || undefined,
  };
}

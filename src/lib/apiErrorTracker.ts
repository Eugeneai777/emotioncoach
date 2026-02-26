/**
 * 接口异常监控 - 拦截 fetch 记录接口错误详情
 * 监控：请求失败率、429限流、500内部错误、超时、第三方API报错
 */

export interface ApiError {
  id: string;
  /** 错误类型 */
  errorType: 'timeout' | 'rate_limit' | 'server_error' | 'third_party' | 'network_fail' | 'client_error';
  /** HTTP 状态码 */
  statusCode?: number;
  /** 请求 URL */
  url: string;
  /** 请求方法 */
  method: string;
  /** 响应时间 ms */
  responseTime: number;
  /** 模型名称（AI 调用时） */
  modelName?: string;
  /** 用户 ID */
  userId?: string;
  /** 错误消息 */
  message: string;
  /** 响应体摘要 */
  responseBody?: string;
  /** 时间戳 */
  timestamp: number;
  /** 用户 UA */
  userAgent: string;
  /** 当前页面 */
  page: string;
}

export interface ApiCallStats {
  totalCalls: number;
  failedCalls: number;
  failRate: number;
  rateLimitCount: number;
  serverErrorCount: number;
  timeoutCount: number;
  thirdPartyErrorCount: number;
}

type ApiErrorListener = (errors: ApiError[], stats: ApiCallStats) => void;

const MAX_ERRORS = 500;
const DEFAULT_TIMEOUT_MS = 30000;

let apiErrors: ApiError[] = [];
let listeners: ApiErrorListener[] = [];
let installed = false;

let totalCalls = 0;
let failedCalls = 0;
let rateLimitCount = 0;
let serverErrorCount = 0;
let timeoutCount = 0;
let thirdPartyErrorCount = 0;

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStats(): ApiCallStats {
  return {
    totalCalls,
    failedCalls,
    failRate: totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0,
    rateLimitCount,
    serverErrorCount,
    timeoutCount,
    thirdPartyErrorCount,
  };
}

function push(error: ApiError) {
  apiErrors = [error, ...apiErrors].slice(0, MAX_ERRORS);
  listeners.forEach((fn) => fn(apiErrors, getStats()));

  // 异步上报到数据库
  try {
    import('./monitorReporter').then(({ reportApiError }) => {
      reportApiError(error);
    });
  } catch { /* ignore */ }
}

function notify() {
  listeners.forEach((fn) => fn(apiErrors, getStats()));
}

/** 从 URL 中提取模型名称 */
function extractModelName(url: string, body?: string): string | undefined {
  // Check URL patterns
  if (url.includes('/chat/completions') || url.includes('/v1/')) {
    // Try to extract from request body
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (parsed.model) return parsed.model;
      } catch { /* ignore */ }
    }
  }
  if (url.includes('ai.gateway.lovable.dev')) return 'lovable-ai';
  if (url.includes('openai.com')) return 'openai';
  if (url.includes('doubao')) return 'doubao';
  return undefined;
}

/** 判断是否为第三方 API */
function isThirdPartyApi(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes('weixin.qq.com') ||
      u.hostname.includes('api.weixin') ||
      u.hostname.includes('openai.com') ||
      u.hostname.includes('doubao') ||
      u.hostname.includes('elevenlabs') ||
      u.hostname.includes('ai.gateway.lovable.dev') ||
      u.hostname.includes('resend.com') ||
      u.hostname.includes('unsplash.com')
    );
  } catch {
    return false;
  }
}

/** 判断错误类型 */
function classifyError(status: number | undefined, url: string, isTimeout: boolean): ApiError['errorType'] {
  if (isTimeout) return 'timeout';
  if (status === 429) return 'rate_limit';
  if (status && status >= 500) {
    return isThirdPartyApi(url) ? 'third_party' : 'server_error';
  }
  if (!status) return 'network_fail';
  return 'client_error';
}

/** 尝试从 Supabase JWT 中提取用户 ID */
function extractUserId(): string | undefined {
  try {
    const raw = localStorage.getItem('sb-vlsuzskvykddwrxbmcbu-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.user?.id?.slice(0, 8) || undefined;
    }
  } catch { /* ignore */ }
  return undefined;
}

/** 安装接口异常监控 */
export function installApiErrorTracker() {
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
    const init = args[1] as RequestInit | undefined;
    const method = init?.method || (args[0] as Request)?.method || 'GET';
    const bodyStr = typeof init?.body === 'string' ? init.body : undefined;

    // Skip non-API calls (static assets, HMR, etc.)
    if (
      url.includes('/@vite') ||
      url.includes('/node_modules/') ||
      url.includes('.js') ||
      url.includes('.css') ||
      url.includes('.png') ||
      url.includes('.svg') ||
      url.includes('.woff')
    ) {
      return originalFetch.apply(this, args);
    }

    const start = performance.now();
    totalCalls++;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    // Merge signals if caller already provided one
    const existingSignal = init?.signal || (args[0] as Request)?.signal;

    try {
      const response = await originalFetch.apply(this, [
        args[0],
        { ...init, signal: existingSignal || controller.signal },
      ]);
      clearTimeout(timeoutId);
      const responseTime = Math.round(performance.now() - start);

      if (!response.ok) {
        failedCalls++;
        const errorType = classifyError(response.status, url, false);
        if (errorType === 'rate_limit') rateLimitCount++;
        else if (errorType === 'server_error') serverErrorCount++;
        else if (errorType === 'third_party') thirdPartyErrorCount++;

        // Try to read response body for error details
        let respBody: string | undefined;
        try {
          const cloned = response.clone();
          const text = await cloned.text();
          respBody = text.slice(0, 300);
        } catch { /* ignore */ }

        push({
          id: genId(),
          errorType,
          statusCode: response.status,
          url: url.slice(0, 200),
          method: method.toUpperCase(),
          responseTime,
          modelName: extractModelName(url, bodyStr),
          userId: extractUserId(),
          message: `${response.status} ${response.statusText}`,
          responseBody: respBody,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          page: location.href,
        });
      } else {
        // Successful call, just update stats
        notify();
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const responseTime = Math.round(performance.now() - start);
      failedCalls++;

      const isTimeout = err?.name === 'AbortError';
      if (isTimeout) timeoutCount++;

      const errorType = classifyError(undefined, url, isTimeout);

      push({
        id: genId(),
        errorType,
        url: url.slice(0, 200),
        method: method.toUpperCase(),
        responseTime,
        modelName: extractModelName(url, bodyStr),
        userId: extractUserId(),
        message: isTimeout ? `请求超时 (>${DEFAULT_TIMEOUT_MS}ms)` : (err?.message || 'Network Error'),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        page: location.href,
      });

      throw err;
    }
  };
}

export function getApiErrors(): ApiError[] {
  return apiErrors;
}

export function getApiCallStats(): ApiCallStats {
  return getStats();
}

export function clearApiErrors() {
  apiErrors = [];
  totalCalls = 0;
  failedCalls = 0;
  rateLimitCount = 0;
  serverErrorCount = 0;
  timeoutCount = 0;
  thirdPartyErrorCount = 0;
  listeners.forEach((fn) => fn(apiErrors, getStats()));
}

export function subscribeApiErrors(fn: ApiErrorListener): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

/**
 * 前端异常监控 - 全局错误采集器
 * 捕获 JS 运行错误、Promise 未捕获异常、资源加载失败、网络错误
 */

export interface FrontendError {
  id: string;
  type: 'js_error' | 'promise_rejection' | 'white_screen' | 'resource_error' | 'network_error';
  message: string;
  stack?: string;
  userAgent: string;
  page: string;
  timestamp: number;
  /** 资源加载失败时的资源 URL */
  resourceUrl?: string;
  /** 网络错误的请求信息 */
  requestInfo?: string;
  /** 额外上下文 */
  extra?: Record<string, unknown>;
}

type ErrorListener = (errors: FrontendError[]) => void;

const MAX_ERRORS = 500;
let errors: FrontendError[] = [];
let listeners: ErrorListener[] = [];
let installed = false;

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function push(error: FrontendError) {
  errors = [error, ...errors].slice(0, MAX_ERRORS);
  listeners.forEach((fn) => fn(errors));
}

function baseInfo(): Pick<FrontendError, 'userAgent' | 'page' | 'timestamp'> {
  return {
    userAgent: navigator.userAgent,
    page: location.href,
    timestamp: Date.now(),
  };
}

/** 安装全局错误监听 */
export function installErrorTracker() {
  if (installed) return;
  installed = true;

  // 1. JS 运行错误
  window.addEventListener('error', (e: ErrorEvent) => {
    // 过滤资源加载错误（会在下面的 capture 处理）
    if (e.target && (e.target as HTMLElement).tagName) return;
    push({
      id: genId(),
      type: 'js_error',
      message: e.message || 'Unknown JS Error',
      stack: e.error?.stack,
      ...baseInfo(),
    });
  });

  // 2. Promise 未捕获异常
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason = e.reason;
    push({
      id: genId(),
      type: 'promise_rejection',
      message: reason?.message || String(reason) || 'Unhandled Promise Rejection',
      stack: reason?.stack,
      ...baseInfo(),
    });
  });

  // 3. 资源加载失败（img / script / link / etc.）
  window.addEventListener(
    'error',
    (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || !target.tagName) return;
      const tagName = target.tagName.toLowerCase();
      if (['img', 'script', 'link', 'video', 'audio', 'source'].includes(tagName)) {
        const url =
          (target as HTMLImageElement).src ||
          (target as HTMLLinkElement).href ||
          (target as HTMLSourceElement).src ||
          '';
        push({
          id: genId(),
          type: 'resource_error',
          message: `资源加载失败: <${tagName}>`,
          resourceUrl: url,
          ...baseInfo(),
        });
      }
    },
    true // 必须用 capture 阶段
  );

  // 4. 网络请求错误 - 拦截 fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    try {
      const response = await originalFetch.apply(this, args);
      if (!response.ok && response.status >= 500) {
        push({
          id: genId(),
          type: 'network_error',
          message: `Fetch ${response.status}: ${response.statusText}`,
          requestInfo: typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url,
          ...baseInfo(),
        });
      }
      return response;
    } catch (err: any) {
      push({
        id: genId(),
        type: 'network_error',
        message: err?.message || 'Network request failed',
        requestInfo: typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url,
        stack: err?.stack,
        ...baseInfo(),
      });
      throw err;
    }
  };

  // 5. 白屏检测 - 页面加载 5 秒后检查 body 内容
  setTimeout(() => {
    const body = document.body;
    if (body && body.children.length === 0) {
      push({
        id: genId(),
        type: 'white_screen',
        message: '疑似白屏：页面 body 无子元素',
        ...baseInfo(),
      });
    } else if (body) {
      // 检查 root 节点是否为空
      const root = document.getElementById('root');
      if (root && root.children.length === 0) {
        push({
          id: genId(),
          type: 'white_screen',
          message: '疑似白屏：#root 容器无子元素',
          ...baseInfo(),
        });
      }
    }
  }, 5000);
}

export function getErrors(): FrontendError[] {
  return errors;
}

export function clearErrors() {
  errors = [];
  listeners.forEach((fn) => fn(errors));
}

export function subscribe(fn: ErrorListener): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

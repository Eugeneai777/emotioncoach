/**
 * 稳定性监控 - 数据采集层
 * 1. 请求级数据采集：ID、时间戳、用户、IP、路径、来源、状态、错误、耗时
 * 2. 第三方依赖监控：成功率、响应时间、错误类型、超时、限流
 * 3. 系统资源采集：CPU、内存、连接数
 */

// ==================== 请求级数据 ====================

export interface RequestRecord {
  requestId: string;
  timestamp: number;
  userId?: string;
  ip: string;
  path: string;
  /** H5 / voice / api */
  source: 'h5' | 'voice' | 'api' | 'unknown';
  success: boolean;
  errorCode?: number;
  errorType?: string;
  /** 总耗时 ms */
  totalDuration: number;
  /** 第三方耗时 ms（仅外部 API 调用） */
  thirdPartyDuration?: number;
  statusCode?: number;
  method: string;
}

// ==================== 第三方依赖监控 ====================

export interface ThirdPartyStats {
  name: string;
  totalCalls: number;
  successCalls: number;
  successRate: number;
  avgResponseTime: number;
  maxResponseTime: number;
  errorTypes: Record<string, number>;
  timeoutCount: number;
  rateLimitCount: number;
}

// ==================== 系统资源 ====================

export interface SystemResources {
  /** 逻辑 CPU 核数 */
  cpuCores: number;
  /** JS 堆使用 MB（仅 Chrome） */
  memoryUsedMB: number | null;
  /** JS 堆上限 MB（仅 Chrome） */
  memoryLimitMB: number | null;
  /** 内存使用率 % */
  memoryUsagePercent: number | null;
  /** 当前活跃连接数（通过 PerformanceObserver 估算） */
  activeConnections: number;
  /** 页面运行时长 s */
  uptimeSeconds: number;
  /** 采集时间 */
  timestamp: number;
}

// ==================== 内部存储 ====================

const MAX_RECORDS = 1000;
const THIRD_PARTY_HOSTS: Record<string, string> = {
  'ai.gateway.lovable.dev': 'Lovable AI',
  'api.openai.com': 'OpenAI',
  'api.elevenlabs.io': 'ElevenLabs',
  'api.weixin.qq.com': '微信API',
  'api.unsplash.com': 'Unsplash',
  'api.resend.com': 'Resend',
};

let requestRecords: RequestRecord[] = [];
let thirdPartyRecords: Map<string, RequestRecord[]> = new Map();
let installed = false;
let bootTime = Date.now();

// QPS 追踪
let qpsSamples: { time: number; count: number }[] = [];
let peakQps = 0;
let peakQpsTime = 0;
let lastSampleTime = 0;
let currentSecondCount = 0;

type StabilityListener = (data: StabilitySnapshot) => void;
let listeners: StabilityListener[] = [];

export interface StabilitySnapshot {
  requests: RequestRecord[];
  thirdPartyStats: ThirdPartyStats[];
  systemResources: SystemResources;
  summary: RequestSummary;
  healthMetrics: HealthMetrics;
}

export interface RequestSummary {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  successRate: number;
  avgDuration: number;
  p95Duration: number;
  errorDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
}

// ==================== 核心健康指标 ====================

export interface SuccessRateMetrics {
  realtime: number;
  oneMinute: number;
  fiveMinutes: number;
  oneHour: number;
  today: number;
}

export interface ResponseTimeMetrics {
  avg: number;
  p95: number;
  p99: number;
  max: number;
  timeoutRatio: number;
}

export interface QpsMetrics {
  current: number;
  oneMinuteAvg: number;
  peakQps: number;
  peakTime: number;
  /** 最近60个采样点的 QPS 趋势 */
  trend: { time: number; qps: number }[];
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  typeDistribution: { type: string; count: number; percent: number }[];
  topErrorPaths: { path: string; count: number; lastTime: number }[];
  recentErrors: RequestRecord[];
}

export interface TimeoutMetrics {
  timeoutCount: number;
  timeoutRatio: number;
  topTimeoutPaths: { path: string; count: number; avgDuration: number }[];
}

export interface HealthMetrics {
  successRate: SuccessRateMetrics;
  responseTime: ResponseTimeMetrics;
  qps: QpsMetrics;
  errors: ErrorMetrics;
  timeout: TimeoutMetrics;
}

// ==================== 工具函数 ====================

function genRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function detectSource(url: string, init?: RequestInit): RequestRecord['source'] {
  if (url.includes('voice') || url.includes('speech') || url.includes('audio') || url.includes('whisper')) {
    return 'voice';
  }
  if (url.includes('/functions/v1/') || url.includes('/rest/v1/')) {
    return 'api';
  }
  return 'h5';
}

function extractPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.slice(0, 120);
  } catch {
    return url.slice(0, 120);
  }
}

function getThirdPartyName(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    for (const [host, name] of Object.entries(THIRD_PARTY_HOSTS)) {
      if (hostname.includes(host)) return name;
    }
  } catch { /* ignore */ }
  return null;
}

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

function classifyErrorType(status?: number, isTimeout?: boolean): string | undefined {
  if (isTimeout) return 'timeout';
  if (!status) return 'network_error';
  if (status === 429) return 'rate_limit';
  if (status === 401 || status === 403) return 'auth_error';
  if (status >= 500) return 'server_error';
  if (status >= 400) return 'client_error';
  return undefined;
}

// ==================== 请求级采集（拦截 fetch） ====================

function shouldSkip(url: string): boolean {
  return (
    url.includes('/@vite') ||
    url.includes('/node_modules/') ||
    url.endsWith('.js') ||
    url.endsWith('.css') ||
    url.endsWith('.png') ||
    url.endsWith('.svg') ||
    url.endsWith('.woff') ||
    url.endsWith('.woff2') ||
    url.endsWith('.ico') ||
    url.includes('hot-update')
  );
}

function pushRecord(record: RequestRecord) {
  requestRecords = [record, ...requestRecords].slice(0, MAX_RECORDS);

  const tpName = getThirdPartyName(record.path);
  if (tpName) {
    const existing = thirdPartyRecords.get(tpName) || [];
    thirdPartyRecords.set(tpName, [record, ...existing].slice(0, 200));
  }

  // QPS 追踪
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec === lastSampleTime) {
    currentSecondCount++;
  } else {
    if (lastSampleTime > 0) {
      qpsSamples.push({ time: lastSampleTime * 1000, count: currentSecondCount });
      if (currentSecondCount > peakQps) {
        peakQps = currentSecondCount;
        peakQpsTime = lastSampleTime * 1000;
      }
      qpsSamples = qpsSamples.slice(-120);
    }
    lastSampleTime = nowSec;
    currentSecondCount = 1;
  }

  notifyListeners();
}

function notifyListeners() {
  const snapshot = getStabilitySnapshot();
  listeners.forEach((fn) => fn(snapshot));
}

// ==================== 第三方统计计算 ====================

function computeThirdPartyStats(): ThirdPartyStats[] {
  const stats: ThirdPartyStats[] = [];

  for (const [name, records] of thirdPartyRecords.entries()) {
    if (records.length === 0) continue;

    const successCalls = records.filter((r) => r.success).length;
    const times = records.map((r) => r.totalDuration).sort((a, b) => a - b);
    const avg = times.reduce((s, t) => s + t, 0) / times.length;

    const errorTypes: Record<string, number> = {};
    let timeoutCount = 0;
    let rateLimitCount = 0;

    records.forEach((r) => {
      if (!r.success && r.errorType) {
        errorTypes[r.errorType] = (errorTypes[r.errorType] || 0) + 1;
        if (r.errorType === 'timeout') timeoutCount++;
        if (r.errorType === 'rate_limit') rateLimitCount++;
      }
    });

    stats.push({
      name,
      totalCalls: records.length,
      successCalls,
      successRate: records.length > 0 ? (successCalls / records.length) * 100 : 100,
      avgResponseTime: Math.round(avg),
      maxResponseTime: times[times.length - 1] || 0,
      errorTypes,
      timeoutCount,
      rateLimitCount,
    });
  }

  return stats.sort((a, b) => a.successRate - b.successRate);
}

// ==================== 系统资源采集 ====================

function collectSystemResources(): SystemResources {
  const perf = performance as any;
  let memoryUsedMB: number | null = null;
  let memoryLimitMB: number | null = null;
  let memoryUsagePercent: number | null = null;

  if (perf.memory) {
    memoryUsedMB = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
    memoryLimitMB = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024);
    memoryUsagePercent = memoryLimitMB > 0 ? Math.round((memoryUsedMB / memoryLimitMB) * 100) : null;
  }

  // 估算活跃连接数（基于 PerformanceResourceTiming）
  let activeConnections = 0;
  try {
    const entries = performance.getEntriesByType('resource');
    const recent = entries.filter((e) => e.startTime > performance.now() - 60000);
    const uniqueOrigins = new Set(recent.map((e) => {
      try { return new URL((e as PerformanceResourceTiming).name).origin; } catch { return ''; }
    }));
    activeConnections = uniqueOrigins.size;
  } catch { /* ignore */ }

  return {
    cpuCores: navigator.hardwareConcurrency || 0,
    memoryUsedMB,
    memoryLimitMB,
    memoryUsagePercent,
    activeConnections,
    uptimeSeconds: Math.round((Date.now() - bootTime) / 1000),
    timestamp: Date.now(),
  };
}

// ==================== 请求汇总统计 ====================

function computeRequestSummary(): RequestSummary {
  const total = requestRecords.length;
  const success = requestRecords.filter((r) => r.success).length;
  const failed = total - success;

  const durations = requestRecords.map((r) => r.totalDuration).sort((a, b) => a - b);
  const avg = total > 0 ? Math.round(durations.reduce((s, d) => s + d, 0) / total) : 0;
  const p95 = total > 0 ? durations[Math.floor(total * 0.95)] || 0 : 0;

  const errorDist: Record<string, number> = {};
  const sourceDist: Record<string, number> = {};

  requestRecords.forEach((r) => {
    sourceDist[r.source] = (sourceDist[r.source] || 0) + 1;
    if (!r.success && r.errorType) {
      errorDist[r.errorType] = (errorDist[r.errorType] || 0) + 1;
    }
  });

  return {
    totalRequests: total,
    successRequests: success,
    failedRequests: failed,
    successRate: total > 0 ? Math.round((success / total) * 1000) / 10 : 100,
    avgDuration: avg,
    p95Duration: Math.round(p95),
    errorDistribution: errorDist,
    sourceDistribution: sourceDist,
  };
}

// ==================== 核心健康指标计算 ====================

function filterByTime(records: RequestRecord[], ms: number): RequestRecord[] {
  const cutoff = Date.now() - ms;
  return records.filter((r) => r.timestamp >= cutoff);
}

function successRateOf(records: RequestRecord[]): number {
  if (records.length === 0) return 100;
  return Math.round((records.filter((r) => r.success).length / records.length) * 1000) / 10;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

function computeHealthMetrics(): HealthMetrics {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const rt = filterByTime(requestRecords, 10000); // ~realtime 10s
  const m1 = filterByTime(requestRecords, 60000);
  const m5 = filterByTime(requestRecords, 300000);
  const h1 = filterByTime(requestRecords, 3600000);
  const today = requestRecords.filter((r) => r.timestamp >= todayStart.getTime());

  // 成功率
  const successRate: SuccessRateMetrics = {
    realtime: successRateOf(rt),
    oneMinute: successRateOf(m1),
    fiveMinutes: successRateOf(m5),
    oneHour: successRateOf(h1),
    today: successRateOf(today),
  };

  // 响应时间
  const allDurations = requestRecords.map((r) => r.totalDuration).sort((a, b) => a - b);
  const timeoutRecords = requestRecords.filter((r) => r.errorType === 'timeout');
  const responseTime: ResponseTimeMetrics = {
    avg: allDurations.length > 0 ? Math.round(allDurations.reduce((s, d) => s + d, 0) / allDurations.length) : 0,
    p95: percentile(allDurations, 0.95),
    p99: percentile(allDurations, 0.99),
    max: allDurations[allDurations.length - 1] || 0,
    timeoutRatio: requestRecords.length > 0 ? Math.round((timeoutRecords.length / requestRecords.length) * 1000) / 10 : 0,
  };

  // QPS
  const currentQps = currentSecondCount;
  const m1Count = m1.length;
  const oneMinuteAvg = Math.round((m1Count / 60) * 10) / 10;

  // 趋势：聚合最近60个秒级采样
  const trendPoints = qpsSamples.slice(-60).map((s) => ({ time: s.time, qps: s.count }));

  const qps: QpsMetrics = {
    current: currentQps,
    oneMinuteAvg,
    peakQps,
    peakTime: peakQpsTime,
    trend: trendPoints,
  };

  // 错误监控
  const failed = requestRecords.filter((r) => !r.success);
  const errorTypeMap: Record<string, number> = {};
  const errorPathMap: Record<string, { count: number; lastTime: number }> = {};

  failed.forEach((r) => {
    const t = r.errorType || 'unknown';
    errorTypeMap[t] = (errorTypeMap[t] || 0) + 1;
    if (!errorPathMap[r.path]) {
      errorPathMap[r.path] = { count: 0, lastTime: 0 };
    }
    errorPathMap[r.path].count++;
    errorPathMap[r.path].lastTime = Math.max(errorPathMap[r.path].lastTime, r.timestamp);
  });

  const typeDistribution = Object.entries(errorTypeMap)
    .map(([type, count]) => ({ type, count, percent: failed.length > 0 ? Math.round((count / failed.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  const topErrorPaths = Object.entries(errorPathMap)
    .map(([path, d]) => ({ path, count: d.count, lastTime: d.lastTime }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const errors: ErrorMetrics = {
    totalErrors: failed.length,
    errorRate: requestRecords.length > 0 ? Math.round((failed.length / requestRecords.length) * 1000) / 10 : 0,
    typeDistribution,
    topErrorPaths,
    recentErrors: failed.slice(0, 20),
  };

  // 超时监控
  const timeoutPathMap: Record<string, { count: number; totalDuration: number }> = {};
  timeoutRecords.forEach((r) => {
    if (!timeoutPathMap[r.path]) timeoutPathMap[r.path] = { count: 0, totalDuration: 0 };
    timeoutPathMap[r.path].count++;
    timeoutPathMap[r.path].totalDuration += r.totalDuration;
  });

  const topTimeoutPaths = Object.entries(timeoutPathMap)
    .map(([path, d]) => ({ path, count: d.count, avgDuration: Math.round(d.totalDuration / d.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const timeout: TimeoutMetrics = {
    timeoutCount: timeoutRecords.length,
    timeoutRatio: requestRecords.length > 0 ? Math.round((timeoutRecords.length / requestRecords.length) * 1000) / 10 : 0,
    topTimeoutPaths,
  };

  return { successRate, responseTime, qps, errors, timeout };
}

// ==================== 对外 API ====================

export function getStabilitySnapshot(): StabilitySnapshot {
  return {
    requests: requestRecords,
    thirdPartyStats: computeThirdPartyStats(),
    systemResources: collectSystemResources(),
    summary: computeRequestSummary(),
    healthMetrics: computeHealthMetrics(),
  };
}

export function getRecentRequests(limit = 50): RequestRecord[] {
  return requestRecords.slice(0, limit);
}

export function clearStabilityData() {
  requestRecords = [];
  thirdPartyRecords = new Map();
  qpsSamples = [];
  peakQps = 0;
  peakQpsTime = 0;
  lastSampleTime = 0;
  currentSecondCount = 0;
  bootTime = Date.now();
  notifyListeners();
}

export function subscribeStability(fn: StabilityListener): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

// ==================== 安装采集器 ====================

export function installStabilityCollector() {
  if (installed) return;
  installed = true;
  bootTime = Date.now();

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
    const init = args[1] as RequestInit | undefined;

    if (shouldSkip(url)) {
      return originalFetch.apply(this, args);
    }

    const requestId = genRequestId();
    const method = init?.method || (args[0] as Request)?.method || 'GET';
    const start = performance.now();

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Math.round(performance.now() - start);
      const isSuccess = response.ok;
      const errorType = isSuccess ? undefined : classifyErrorType(response.status, false);

      pushRecord({
        requestId,
        timestamp: Date.now(),
        userId: extractUserId(),
        ip: 'client',
        path: extractPath(url),
        source: detectSource(url, init),
        success: isSuccess,
        errorCode: isSuccess ? undefined : response.status,
        errorType,
        totalDuration: duration,
        thirdPartyDuration: getThirdPartyName(url) ? duration : undefined,
        statusCode: response.status,
        method: method.toUpperCase(),
      });

      return response;
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      const isTimeout = err?.name === 'AbortError';

      pushRecord({
        requestId,
        timestamp: Date.now(),
        userId: extractUserId(),
        ip: 'client',
        path: extractPath(url),
        source: detectSource(url, init),
        success: false,
        errorType: classifyErrorType(undefined, isTimeout),
        totalDuration: duration,
        thirdPartyDuration: getThirdPartyName(url) ? duration : undefined,
        method: method.toUpperCase(),
      });

      throw err;
    }
  };
}

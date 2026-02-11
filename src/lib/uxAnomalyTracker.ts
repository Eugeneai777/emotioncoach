/**
 * 用户体验异常监控
 * 监控：请求时间>10秒、用户中途取消、连续3次失败、短时间多次重试
 * 重点关注：智能通话、财富卡点测评、支付体验等核心业务
 */

export type UxAnomalyType = 'slow_request' | 'user_cancel' | 'consecutive_fail' | 'frequent_retry';

export type BusinessScene =
  | 'ai_coach_call'
  | 'human_coach_call'
  | 'wealth_assessment'
  | 'payment'
  | 'team_coaching_enroll'
  | 'scl90_assessment'
  | 'other';

export interface UxAnomaly {
  id: string;
  type: UxAnomalyType;
  scene: BusinessScene;
  /** 场景中文名 */
  sceneLabel: string;
  /** 用户 ID */
  userId?: string;
  /** 异常详情 */
  message: string;
  /** 请求耗时 ms（slow_request 时有值） */
  duration?: number;
  /** 连续失败次数（consecutive_fail 时有值） */
  failCount?: number;
  /** 重试次数（frequent_retry 时有值） */
  retryCount?: number;
  /** 时间戳 */
  timestamp: number;
  /** 当前页面 */
  page: string;
  /** 额外上下文 */
  extra?: Record<string, unknown>;
}

export interface UxAnomalyStats {
  slowRequestCount: number;
  cancelCount: number;
  consecutiveFailCount: number;
  frequentRetryCount: number;
  total: number;
}

type UxAnomalyListener = (anomalies: UxAnomaly[], stats: UxAnomalyStats) => void;

const SCENE_LABELS: Record<BusinessScene, string> = {
  ai_coach_call: 'AI智能通话',
  human_coach_call: '真人教练通话',
  wealth_assessment: '财富卡点测评',
  payment: '支付流程',
  team_coaching_enroll: '团体辅导报名',
  scl90_assessment: 'SCL-90测评',
  other: '其他',
};

const MAX_ANOMALIES = 500;
const SLOW_THRESHOLD_MS = 10_000;
const CONSECUTIVE_FAIL_THRESHOLD = 3;
const RETRY_WINDOW_MS = 60_000; // 1 分钟内重试
const RETRY_COUNT_THRESHOLD = 3; // 1 分钟内 ≥3 次算频繁重试

let anomalies: UxAnomaly[] = [];
let listeners: UxAnomalyListener[] = [];

// 统计数据
let slowRequestCount = 0;
let cancelCount = 0;
let consecutiveFailCount = 0;
let frequentRetryCount = 0;

// ---- 连续失败追踪 (per user+scene) ----
const failStreaks: Map<string, { count: number; lastTime: number }> = new Map();

// ---- 重试追踪 (per user+scene) ----
const retryHistory: Map<string, number[]> = new Map();

function genId(): string {
  return `ux-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStats(): UxAnomalyStats {
  return {
    slowRequestCount,
    cancelCount,
    consecutiveFailCount,
    frequentRetryCount,
    total: slowRequestCount + cancelCount + consecutiveFailCount + frequentRetryCount,
  };
}

function push(anomaly: UxAnomaly) {
  anomalies = [anomaly, ...anomalies].slice(0, MAX_ANOMALIES);
  listeners.forEach((fn) => fn(anomalies, getStats()));
}

function getUserId(): string | undefined {
  try {
    const raw = localStorage.getItem('sb-vlsuzskvykddwrxbmcbu-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.user?.id?.slice(0, 8) || undefined;
    }
  } catch { /* ignore */ }
  return undefined;
}

function userSceneKey(scene: BusinessScene): string {
  return `${getUserId() || 'anon'}:${scene}`;
}

// ========== 公开 API ==========

/** 1. 记录慢请求 (>10s) */
export function trackSlowRequest(scene: BusinessScene, durationMs: number, extra?: Record<string, unknown>) {
  if (durationMs < SLOW_THRESHOLD_MS) return;
  slowRequestCount++;
  push({
    id: genId(),
    type: 'slow_request',
    scene,
    sceneLabel: SCENE_LABELS[scene],
    userId: getUserId(),
    message: `请求耗时 ${(durationMs / 1000).toFixed(1)}s，超过 ${SLOW_THRESHOLD_MS / 1000}s 阈值`,
    duration: Math.round(durationMs),
    timestamp: Date.now(),
    page: location.href,
    extra,
  });
}

/** 2. 记录用户中途取消 */
export function trackUserCancel(scene: BusinessScene, reason?: string, extra?: Record<string, unknown>) {
  cancelCount++;
  push({
    id: genId(),
    type: 'user_cancel',
    scene,
    sceneLabel: SCENE_LABELS[scene],
    userId: getUserId(),
    message: reason || '用户中途取消操作',
    timestamp: Date.now(),
    page: location.href,
    extra,
  });
}

/** 3. 记录操作失败（内部会追踪连续失败） */
export function trackOperationFail(scene: BusinessScene, errorMsg: string, extra?: Record<string, unknown>) {
  const key = userSceneKey(scene);
  const streak = failStreaks.get(key) || { count: 0, lastTime: 0 };

  // 如果距离上次失败超过 5 分钟，重置计数
  if (Date.now() - streak.lastTime > 5 * 60_000) {
    streak.count = 0;
  }
  streak.count++;
  streak.lastTime = Date.now();
  failStreaks.set(key, streak);

  if (streak.count >= CONSECUTIVE_FAIL_THRESHOLD) {
    consecutiveFailCount++;
    push({
      id: genId(),
      type: 'consecutive_fail',
      scene,
      sceneLabel: SCENE_LABELS[scene],
      userId: getUserId(),
      message: `连续失败 ${streak.count} 次: ${errorMsg}`,
      failCount: streak.count,
      timestamp: Date.now(),
      page: location.href,
      extra,
    });
  }

  // 同时追踪重试频率
  trackRetryInternal(scene);
}

/** 4. 记录操作成功（重置连续失败计数） */
export function trackOperationSuccess(scene: BusinessScene) {
  const key = userSceneKey(scene);
  failStreaks.delete(key);
}

/** 5. 记录用户重试 */
export function trackRetry(scene: BusinessScene, extra?: Record<string, unknown>) {
  trackRetryInternal(scene, extra);
}

function trackRetryInternal(scene: BusinessScene, extra?: Record<string, unknown>) {
  const key = userSceneKey(scene);
  const now = Date.now();
  const history = retryHistory.get(key) || [];
  const recent = history.filter((t) => now - t < RETRY_WINDOW_MS);
  recent.push(now);
  retryHistory.set(key, recent);

  if (recent.length >= RETRY_COUNT_THRESHOLD) {
    frequentRetryCount++;
    push({
      id: genId(),
      type: 'frequent_retry',
      scene,
      sceneLabel: SCENE_LABELS[scene],
      userId: getUserId(),
      message: `${RETRY_WINDOW_MS / 1000}秒内重试 ${recent.length} 次`,
      retryCount: recent.length,
      timestamp: Date.now(),
      page: location.href,
      extra,
    });
    // 上报后清空，避免重复告警
    retryHistory.set(key, [now]);
  }
}

/**
 * 创建业务操作计时器
 * 自动追踪慢请求、取消、失败/成功
 */
export function createUxTracker(scene: BusinessScene, extra?: Record<string, unknown>) {
  const start = performance.now();
  let finished = false;

  return {
    /** 操作成功完成 */
    success() {
      if (finished) return;
      finished = true;
      const elapsed = performance.now() - start;
      trackSlowRequest(scene, elapsed, extra);
      trackOperationSuccess(scene);
    },
    /** 操作失败 */
    fail(errorMsg: string) {
      if (finished) return;
      finished = true;
      const elapsed = performance.now() - start;
      trackSlowRequest(scene, elapsed, extra);
      trackOperationFail(scene, errorMsg, extra);
    },
    /** 用户主动取消 */
    cancel(reason?: string) {
      if (finished) return;
      finished = true;
      trackUserCancel(scene, reason, extra);
    },
  };
}

// ========== 订阅/读取 ==========

export function getUxAnomalies(): UxAnomaly[] {
  return anomalies;
}

export function getUxAnomalyStats(): UxAnomalyStats {
  return getStats();
}

export function clearUxAnomalies() {
  anomalies = [];
  slowRequestCount = 0;
  cancelCount = 0;
  consecutiveFailCount = 0;
  frequentRetryCount = 0;
  failStreaks.clear();
  retryHistory.clear();
  listeners.forEach((fn) => fn(anomalies, getStats()));
}

export function subscribeUxAnomalies(fn: UxAnomalyListener): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

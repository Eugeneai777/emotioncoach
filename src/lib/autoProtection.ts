/**
 * 自动保护机制
 * 1. 自动限流：全局限流、接口限流、动态调整
 * 2. 自动降级：备用模型、简化响应、缓存数据
 * 3. 自动熔断：成功率阈值、第三方异常、定时恢复
 * 4. 自动维护模式：维护页面、暂停AI调用
 */

// ==================== 类型定义 ====================

export type ProtectionEventType =
  | 'rate_limit_triggered'
  | 'rate_limit_adjusted'
  | 'degradation_activated'
  | 'degradation_deactivated'
  | 'circuit_open'
  | 'circuit_half_open'
  | 'circuit_closed'
  | 'maintenance_entered'
  | 'maintenance_exited';

export interface ProtectionEvent {
  id: string;
  type: ProtectionEventType;
  target: string;
  message: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

// ==================== 1. 自动限流 ====================

export interface RateLimitConfig {
  /** 全局每秒最大请求数 */
  globalRps: number;
  /** 接口级限流规则 */
  pathLimits: Record<string, { maxPerMinute: number }>;
  /** 是否开启动态调整 */
  dynamicAdjust: boolean;
  /** 动态调整灵敏度 0~1 */
  sensitivity: number;
}

interface RateLimitState {
  globalCounter: number[];
  pathCounters: Map<string, number[]>;
  currentGlobalRps: number;
  adjustedLimits: Map<string, number>;
  blockedCount: number;
  lastAdjustTime: number;
}

// ==================== 2. 自动降级 ====================

export type DegradationStrategy = 'backup_model' | 'simplified_response' | 'cached_data';

export interface DegradationConfig {
  enabled: boolean;
  /** 错误率阈值触发降级 (%) */
  errorThreshold: number;
  /** 延迟阈值触发降级 (ms) */
  latencyThreshold: number;
  /** 备用模型名 */
  backupModel: string;
  /** 简化响应模板 */
  simplifiedTemplate: string;
  /** 缓存TTL (s) */
  cacheTtl: number;
}

export interface DegradationState {
  active: boolean;
  strategy: DegradationStrategy | null;
  activatedAt: number | null;
  reason: string;
  fallbackCount: number;
  cacheHitCount: number;
}

// ==================== 3. 自动熔断 ====================

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerConfig {
  /** 成功率低于此值触发熔断 (%) */
  successRateThreshold: number;
  /** 评估窗口 (s) */
  evaluationWindow: number;
  /** 最少样本数才评估 */
  minimumSamples: number;
  /** 熔断后多久尝试恢复 (s) */
  recoveryTimeout: number;
  /** 半开状态允许的请求数 */
  halfOpenMaxRequests: number;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  openedAt: number | null;
  halfOpenAt: number | null;
  consecutiveSuccesses: number;
  target: string;
}

// ==================== 4. 自动维护模式 ====================

export interface MaintenanceConfig {
  /** 是否启用自动维护检测 */
  autoDetect: boolean;
  /** 连续多少次熔断后进入维护模式 */
  circuitBreakThreshold: number;
  /** 维护模式提示信息 */
  message: string;
}

export interface MaintenanceState {
  active: boolean;
  enteredAt: number | null;
  reason: string;
  aiCallsPaused: boolean;
  manualOverride: boolean;
}

// ==================== 综合状态 ====================

export interface ProtectionStatus {
  rateLimit: {
    config: RateLimitConfig;
    state: RateLimitState;
  };
  degradation: {
    config: DegradationConfig;
    state: DegradationState;
  };
  circuitBreakers: Map<string, { config: CircuitBreakerConfig; state: CircuitBreakerState }>;
  maintenance: {
    config: MaintenanceConfig;
    state: MaintenanceState;
  };
  events: ProtectionEvent[];
}

// ==================== 实现 ====================

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  globalRps: 50,
  pathLimits: {
    '/functions/v1/chat': { maxPerMinute: 30 },
    '/functions/v1/emotion-coach': { maxPerMinute: 20 },
    '/functions/v1/emotion-realtime-token': { maxPerMinute: 10 },
  },
  dynamicAdjust: true,
  sensitivity: 0.5,
};

const DEFAULT_DEGRADATION: DegradationConfig = {
  enabled: true,
  errorThreshold: 20,
  latencyThreshold: 10000,
  backupModel: 'google/gemini-2.5-flash-lite',
  simplifiedTemplate: '系统繁忙，请稍后再试。我们正在处理您的请求。',
  cacheTtl: 300,
};

const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  successRateThreshold: 50,
  evaluationWindow: 60,
  minimumSamples: 10,
  recoveryTimeout: 30,
  halfOpenMaxRequests: 3,
};

const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  autoDetect: true,
  circuitBreakThreshold: 3,
  message: '系统正在维护中，请稍后再来。我们正在努力恢复服务。',
};

// 全局状态
let rateLimitState: RateLimitState = {
  globalCounter: [],
  pathCounters: new Map(),
  currentGlobalRps: DEFAULT_RATE_LIMIT.globalRps,
  adjustedLimits: new Map(),
  blockedCount: 0,
  lastAdjustTime: Date.now(),
};

let degradationState: DegradationState = {
  active: false,
  strategy: null,
  activatedAt: null,
  reason: '',
  fallbackCount: 0,
  cacheHitCount: 0,
};

let circuitBreakers: Map<string, { config: CircuitBreakerConfig; state: CircuitBreakerState }> = new Map();

let maintenanceState: MaintenanceState = {
  active: false,
  enteredAt: null,
  reason: '',
  aiCallsPaused: false,
  manualOverride: false,
};

let protectionEvents: ProtectionEvent[] = [];
const MAX_EVENTS = 200;

let rateLimitConfig = { ...DEFAULT_RATE_LIMIT };
let degradationConfig = { ...DEFAULT_DEGRADATION };
let maintenanceConfig = { ...DEFAULT_MAINTENANCE };

let listeners: Array<() => void> = [];
let consecutiveCircuitBreaks = 0;

function notify() {
  listeners.forEach((fn) => fn());
}

function addEvent(type: ProtectionEventType, target: string, message: string, details?: Record<string, unknown>) {
  const evt: ProtectionEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    target,
    message,
    timestamp: Date.now(),
    details,
  };
  protectionEvents.unshift(evt);
  if (protectionEvents.length > MAX_EVENTS) protectionEvents.length = MAX_EVENTS;
  notify();
}

// ==================== 限流逻辑 ====================

function cleanOldTimestamps(arr: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return arr.filter((t) => t > cutoff);
}

export function checkRateLimit(path: string): boolean {
  const now = Date.now();

  // 全局限流检查（1秒窗口）
  rateLimitState.globalCounter = cleanOldTimestamps(rateLimitState.globalCounter, 1000);
  if (rateLimitState.globalCounter.length >= rateLimitState.currentGlobalRps) {
    rateLimitState.blockedCount++;
    addEvent('rate_limit_triggered', '全局', `全局限流触发：当前 ${rateLimitState.globalCounter.length} req/s，阈值 ${rateLimitState.currentGlobalRps}`);
    return false;
  }
  rateLimitState.globalCounter.push(now);

  // 接口级限流检查（1分钟窗口）
  const pathKey = Object.keys(rateLimitConfig.pathLimits).find((k) => path.includes(k));
  if (pathKey) {
    const limit = rateLimitConfig.pathLimits[pathKey].maxPerMinute;
    const adjustedLimit = rateLimitState.adjustedLimits.get(pathKey) ?? limit;
    let counter = rateLimitState.pathCounters.get(pathKey) || [];
    counter = cleanOldTimestamps(counter, 60000);
    if (counter.length >= adjustedLimit) {
      rateLimitState.blockedCount++;
      addEvent('rate_limit_triggered', pathKey, `接口限流触发：${pathKey} 当前 ${counter.length}/min，阈值 ${adjustedLimit}`);
      rateLimitState.pathCounters.set(pathKey, counter);
      return false;
    }
    counter.push(now);
    rateLimitState.pathCounters.set(pathKey, counter);
  }

  // 动态调整
  if (rateLimitConfig.dynamicAdjust && now - rateLimitState.lastAdjustTime > 10000) {
    dynamicAdjustLimits();
    rateLimitState.lastAdjustTime = now;
  }

  return true;
}

function dynamicAdjustLimits() {
  const errorRate = getRecentErrorRate();
  const factor = rateLimitConfig.sensitivity;

  if (errorRate > 30) {
    // 高错误率时收紧限流
    const newRps = Math.max(5, Math.floor(rateLimitState.currentGlobalRps * (1 - factor * 0.3)));
    if (newRps !== rateLimitState.currentGlobalRps) {
      rateLimitState.currentGlobalRps = newRps;
      addEvent('rate_limit_adjusted', '全局', `动态限流收紧：错误率 ${errorRate.toFixed(1)}%，RPS 调整至 ${newRps}`);
    }
  } else if (errorRate < 5) {
    // 低错误率时放宽限流
    const newRps = Math.min(rateLimitConfig.globalRps, Math.ceil(rateLimitState.currentGlobalRps * (1 + factor * 0.1)));
    if (newRps !== rateLimitState.currentGlobalRps) {
      rateLimitState.currentGlobalRps = newRps;
      addEvent('rate_limit_adjusted', '全局', `动态限流放宽：错误率 ${errorRate.toFixed(1)}%，RPS 恢复至 ${newRps}`);
    }
  }
}

function getRecentErrorRate(): number {
  // 从稳定性数据中获取最近错误率
  try {
    const { getStabilitySnapshot } = require('@/lib/stabilityDataCollector');
    const snap = getStabilitySnapshot();
    return 100 - snap.healthMetrics.successRate.overall;
  } catch {
    return 0;
  }
}

// ==================== 降级逻辑 ====================

export function evaluateDegradation(errorRate: number, avgLatency: number) {
  if (!degradationConfig.enabled) return;

  if (!degradationState.active) {
    if (errorRate > degradationConfig.errorThreshold) {
      activateDegradation('backup_model', `错误率 ${errorRate.toFixed(1)}% 超过阈值 ${degradationConfig.errorThreshold}%`);
    } else if (avgLatency > degradationConfig.latencyThreshold) {
      activateDegradation('simplified_response', `平均延迟 ${Math.round(avgLatency)}ms 超过阈值 ${degradationConfig.latencyThreshold}ms`);
    }
  } else {
    // 检查是否可以恢复
    if (errorRate < degradationConfig.errorThreshold * 0.5 && avgLatency < degradationConfig.latencyThreshold * 0.5) {
      deactivateDegradation('指标已恢复到正常水平');
    }
  }
}

function activateDegradation(strategy: DegradationStrategy, reason: string) {
  degradationState = {
    active: true,
    strategy,
    activatedAt: Date.now(),
    reason,
    fallbackCount: degradationState.fallbackCount,
    cacheHitCount: degradationState.cacheHitCount,
  };
  const strategyLabels: Record<DegradationStrategy, string> = {
    backup_model: `切换备用模型: ${degradationConfig.backupModel}`,
    simplified_response: '启用简化响应模式',
    cached_data: '返回缓存数据',
  };
  addEvent('degradation_activated', strategy, `自动降级激活：${strategyLabels[strategy]}。原因：${reason}`);
}

function deactivateDegradation(reason: string) {
  degradationState.active = false;
  degradationState.strategy = null;
  degradationState.activatedAt = null;
  degradationState.reason = '';
  addEvent('degradation_deactivated', '系统', `降级已恢复：${reason}`);
}

export function getDegradedResponse(): string | null {
  if (!degradationState.active) return null;
  if (degradationState.strategy === 'simplified_response') {
    degradationState.fallbackCount++;
    return degradationConfig.simplifiedTemplate;
  }
  if (degradationState.strategy === 'cached_data') {
    degradationState.cacheHitCount++;
    return null; // 调用方应自行查缓存
  }
  return null;
}

export function getActiveModel(): string | null {
  if (degradationState.active && degradationState.strategy === 'backup_model') {
    degradationState.fallbackCount++;
    return degradationConfig.backupModel;
  }
  return null;
}

// ==================== 熔断逻辑 ====================

function getOrCreateBreaker(target: string): { config: CircuitBreakerConfig; state: CircuitBreakerState } {
  if (!circuitBreakers.has(target)) {
    circuitBreakers.set(target, {
      config: { ...DEFAULT_CIRCUIT_BREAKER },
      state: {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        openedAt: null,
        halfOpenAt: null,
        consecutiveSuccesses: 0,
        target,
      },
    });
  }
  return circuitBreakers.get(target)!;
}

export function recordResult(target: string, success: boolean) {
  const breaker = getOrCreateBreaker(target);
  const { config, state } = breaker;
  const now = Date.now();

  if (success) {
    state.successCount++;
    state.consecutiveSuccesses++;
    if (state.state === 'half_open' && state.consecutiveSuccesses >= config.halfOpenMaxRequests) {
      state.state = 'closed';
      state.failureCount = 0;
      state.openedAt = null;
      state.halfOpenAt = null;
      state.consecutiveSuccesses = 0;
      consecutiveCircuitBreaks = Math.max(0, consecutiveCircuitBreaks - 1);
      addEvent('circuit_closed', target, `熔断器恢复关闭：${target} 连续 ${config.halfOpenMaxRequests} 次成功`);
      checkMaintenanceRecovery();
    }
  } else {
    state.failureCount++;
    state.lastFailureTime = now;
    state.consecutiveSuccesses = 0;

    const total = state.successCount + state.failureCount;
    if (state.state === 'closed' && total >= config.minimumSamples) {
      const successRate = (state.successCount / total) * 100;
      if (successRate < config.successRateThreshold) {
        state.state = 'open';
        state.openedAt = now;
        consecutiveCircuitBreaks++;
        addEvent('circuit_open', target, `熔断器打开：${target} 成功率 ${successRate.toFixed(1)}% < ${config.successRateThreshold}%`);
        checkAutoMaintenance();
        scheduleRecoveryAttempt(target);
      }
    } else if (state.state === 'half_open') {
      state.state = 'open';
      state.openedAt = now;
      consecutiveCircuitBreaks++;
      addEvent('circuit_open', target, `半开探测失败，${target} 重新熔断`);
      checkAutoMaintenance();
      scheduleRecoveryAttempt(target);
    }
  }
}

function scheduleRecoveryAttempt(target: string) {
  const breaker = circuitBreakers.get(target);
  if (!breaker) return;
  setTimeout(() => {
    if (breaker.state.state === 'open') {
      breaker.state.state = 'half_open';
      breaker.state.halfOpenAt = Date.now();
      breaker.state.consecutiveSuccesses = 0;
      breaker.state.failureCount = 0;
      breaker.state.successCount = 0;
      addEvent('circuit_half_open', target, `熔断器进入半开状态：${target} 开始探测恢复`);
      notify();
    }
  }, breaker.config.recoveryTimeout * 1000);
}

export function isCircuitOpen(target: string): boolean {
  const breaker = circuitBreakers.get(target);
  if (!breaker) return false;
  return breaker.state.state === 'open';
}

// ==================== 维护模式 ====================

function checkAutoMaintenance() {
  if (!maintenanceConfig.autoDetect || maintenanceState.manualOverride) return;
  if (consecutiveCircuitBreaks >= maintenanceConfig.circuitBreakThreshold && !maintenanceState.active) {
    enterMaintenance(`连续 ${consecutiveCircuitBreaks} 次熔断触发，系统自动进入维护模式`);
  }
}

function checkMaintenanceRecovery() {
  if (!maintenanceState.active || maintenanceState.manualOverride) return;
  // 所有熔断器都关闭时自动退出维护
  const allClosed = Array.from(circuitBreakers.values()).every((b) => b.state.state === 'closed');
  if (allClosed) {
    exitMaintenance('所有服务已恢复正常');
  }
}

function enterMaintenance(reason: string) {
  maintenanceState = {
    active: true,
    enteredAt: Date.now(),
    reason,
    aiCallsPaused: true,
    manualOverride: false,
  };
  addEvent('maintenance_entered', '系统', `进入维护模式：${reason}`);
}

function exitMaintenance(reason: string) {
  maintenanceState = {
    active: false,
    enteredAt: null,
    reason: '',
    aiCallsPaused: false,
    manualOverride: false,
  };
  consecutiveCircuitBreaks = 0;
  addEvent('maintenance_exited', '系统', `退出维护模式：${reason}`);
}

// ==================== 公开 API ====================

export function toggleMaintenance(active: boolean, reason?: string) {
  if (active) {
    maintenanceState.manualOverride = true;
    enterMaintenance(reason || '管理员手动开启维护模式');
  } else {
    exitMaintenance(reason || '管理员手动关闭维护模式');
    maintenanceState.manualOverride = false;
  }
  notify();
}

export function toggleDegradation(active: boolean) {
  if (active) {
    activateDegradation('backup_model', '管理员手动开启降级');
  } else {
    deactivateDegradation('管理员手动关闭降级');
  }
  notify();
}

export function resetCircuitBreaker(target: string) {
  const breaker = circuitBreakers.get(target);
  if (breaker) {
    breaker.state = {
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      openedAt: null,
      halfOpenAt: null,
      consecutiveSuccesses: 0,
      target,
    };
    addEvent('circuit_closed', target, `管理员手动重置熔断器：${target}`);
    checkMaintenanceRecovery();
    notify();
  }
}

export function updateRateLimitConfig(partial: Partial<RateLimitConfig>) {
  rateLimitConfig = { ...rateLimitConfig, ...partial };
  if (partial.globalRps !== undefined) {
    rateLimitState.currentGlobalRps = partial.globalRps;
  }
  notify();
}

export function updateDegradationConfig(partial: Partial<DegradationConfig>) {
  degradationConfig = { ...degradationConfig, ...partial };
  notify();
}

export function updateMaintenanceConfig(partial: Partial<MaintenanceConfig>) {
  maintenanceConfig = { ...maintenanceConfig, ...partial };
  notify();
}

export function getProtectionStatus(): ProtectionStatus {
  return {
    rateLimit: {
      config: { ...rateLimitConfig },
      state: { ...rateLimitState },
    },
    degradation: {
      config: { ...degradationConfig },
      state: { ...degradationState },
    },
    circuitBreakers: new Map(circuitBreakers),
    maintenance: {
      config: { ...maintenanceConfig },
      state: { ...maintenanceState },
    },
    events: [...protectionEvents],
  };
}

export function subscribeProtection(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function isMaintenanceActive(): boolean {
  return maintenanceState.active;
}

export function isAiPaused(): boolean {
  return maintenanceState.active && maintenanceState.aiCallsPaused;
}

/**
 * 监控数据上报模块
 * 批量、节流地将监控数据写入数据库
 * 混合模式：轻量数据直接 SDK 写入，重要数据可通过 Edge Function
 */

import { supabase } from "@/integrations/supabase/client";
import { detectPlatform, type MonitorPlatform } from "./platformDetector";
import type { FrontendError } from "./frontendErrorTracker";
import type { ApiError } from "./apiErrorTracker";
import type { UxAnomaly } from "./uxAnomalyTracker";

// ========== 批量缓冲 ==========
const FLUSH_INTERVAL = 5000; // 5秒批量上报
const MAX_BATCH_SIZE = 20;

interface PendingBatch {
  frontendErrors: any[];
  apiErrors: any[];
  uxAnomalies: any[];
  stabilityRecords: any[];
}

let pending: PendingBatch = {
  frontendErrors: [],
  apiErrors: [],
  uxAnomalies: [],
  stabilityRecords: [],
};

let flushTimer: ReturnType<typeof setInterval> | null = null;
let installed = false;

function getPlatform(): MonitorPlatform {
  try {
    return detectPlatform();
  } catch {
    return 'unknown';
  }
}

/** 启动定时上报 */
export function installMonitorReporter() {
  if (installed) return;
  installed = true;

  flushTimer = setInterval(flushAll, FLUSH_INTERVAL);

  // 页面卸载时尽量上报
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushAll();
    }
  });
}

/** 上报前端异常 */
export function reportFrontendError(error: FrontendError) {
  pending.frontendErrors.push({
    error_type: error.type,
    message: error.message?.slice(0, 2000) || 'Unknown',
    stack: error.stack?.slice(0, 4000),
    page: error.page?.slice(0, 500),
    resource_url: error.resourceUrl?.slice(0, 500),
    request_info: error.requestInfo?.slice(0, 500),
    user_agent: error.userAgent?.slice(0, 500),
    user_id: getAuthUserId(),
    platform: getPlatform(),
    extra: error.extra ? JSON.stringify(error.extra) : null,
  });

  if (pending.frontendErrors.length >= MAX_BATCH_SIZE) {
    flushFrontendErrors();
  }
}

/** 上报接口异常 */
export function reportApiError(error: ApiError) {
  pending.apiErrors.push({
    error_type: error.errorType,
    status_code: error.statusCode,
    url: error.url?.slice(0, 500),
    method: error.method,
    response_time: error.responseTime,
    model_name: error.modelName,
    user_id: getAuthUserId(),
    message: error.message?.slice(0, 2000),
    response_body: error.responseBody?.slice(0, 1000),
    page: error.page?.slice(0, 500),
    user_agent: error.userAgent?.slice(0, 500),
    platform: getPlatform(),
  });

  if (pending.apiErrors.length >= MAX_BATCH_SIZE) {
    flushApiErrors();
  }
}

/** 上报体验异常 */
export function reportUxAnomaly(anomaly: UxAnomaly) {
  pending.uxAnomalies.push({
    anomaly_type: anomaly.type,
    scene: anomaly.scene,
    scene_label: anomaly.sceneLabel,
    user_id: getAuthUserId(),
    message: anomaly.message?.slice(0, 2000),
    duration: anomaly.duration,
    fail_count: anomaly.failCount,
    retry_count: anomaly.retryCount,
    page: anomaly.page?.slice(0, 500),
    platform: getPlatform(),
    extra: anomaly.extra ? JSON.stringify(anomaly.extra) : null,
  });

  if (pending.uxAnomalies.length >= MAX_BATCH_SIZE) {
    flushUxAnomalies();
  }
}

/** 上报稳定性请求记录（采样 - 仅失败或慢请求） */
export function reportStabilityRecord(record: {
  path: string;
  method: string;
  statusCode?: number;
  success: boolean;
  totalDuration: number;
  errorType?: string;
  source: string;
  userId?: string;
  page?: string;
  thirdPartyName?: string;
}) {
  // 采样策略：失败请求全部上报，成功请求 10% 采样
  if (record.success && Math.random() > 0.1) return;

  pending.stabilityRecords.push({
    request_path: record.path?.slice(0, 500),
    method: record.method,
    status_code: record.statusCode,
    success: record.success,
    total_duration: record.totalDuration,
    error_type: record.errorType,
    source: record.source,
    user_id: getAuthUserId(),
    page: record.page?.slice(0, 500),
    user_agent: navigator.userAgent?.slice(0, 500),
    platform: getPlatform(),
    third_party_name: record.thirdPartyName,
  });

  if (pending.stabilityRecords.length >= MAX_BATCH_SIZE) {
    flushStabilityRecords();
  }
}

// ========== 批量写入 ==========

async function flushFrontendErrors() {
  const batch = pending.frontendErrors.splice(0, MAX_BATCH_SIZE);
  if (batch.length === 0) return;
  try {
    await supabase.from('monitor_frontend_errors').insert(batch);
  } catch (e) {
    console.warn('[MonitorReporter] Failed to flush frontend errors:', e);
  }
}

async function flushApiErrors() {
  const batch = pending.apiErrors.splice(0, MAX_BATCH_SIZE);
  if (batch.length === 0) return;
  try {
    await supabase.from('monitor_api_errors').insert(batch);
  } catch (e) {
    console.warn('[MonitorReporter] Failed to flush api errors:', e);
  }
}

async function flushUxAnomalies() {
  const batch = pending.uxAnomalies.splice(0, MAX_BATCH_SIZE);
  if (batch.length === 0) return;
  try {
    await supabase.from('monitor_ux_anomalies').insert(batch);
  } catch (e) {
    console.warn('[MonitorReporter] Failed to flush ux anomalies:', e);
  }
}

async function flushStabilityRecords() {
  const batch = pending.stabilityRecords.splice(0, MAX_BATCH_SIZE);
  if (batch.length === 0) return;
  try {
    await supabase.from('monitor_stability_records').insert(batch);
  } catch (e) {
    console.warn('[MonitorReporter] Failed to flush stability records:', e);
  }
}

function flushAll() {
  flushFrontendErrors();
  flushApiErrors();
  flushUxAnomalies();
  flushStabilityRecords();
}

// ========== 工具 ==========

function getAuthUserId(): string | null {
  try {
    const raw = localStorage.getItem('sb-vlsuzskvykddwrxbmcbu-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.user?.id || null;
    }
  } catch { /* ignore */ }
  return null;
}

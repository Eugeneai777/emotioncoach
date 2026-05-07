/**
 * OG 分享健康上报工具
 * 在 DynamicOGMeta 组件中检测并上报 OG 相关异常
 */

import { supabase } from "@/integrations/supabase/client";
import { detectPlatform } from "@/lib/platformDetector";

type OGIssueType = 'image_load_failed' | 'config_missing' | 'config_incomplete' | 'image_url_invalid' | 'share_failed' | 'share_action';

interface OGHealthReport {
  pageKey: string;
  pagePath: string;
  issueType: OGIssueType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  imageUrl?: string;
  extra?: Record<string, unknown>;
}

// 防抖：同一 pageKey + issueType 在 5 分钟内只上报一次
const reportedCache = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

function shouldReport(key: string): boolean {
  const last = reportedCache.get(key);
  if (last && Date.now() - last < COOLDOWN_MS) return false;
  reportedCache.set(key, Date.now());
  return true;
}

export async function reportOGHealth(report: OGHealthReport): Promise<void> {
  const cacheKey = `${report.pageKey}:${report.issueType}`;
  if (!shouldReport(cacheKey)) return;

  try {
    const { data: userData } = await supabase.auth.getUser();
    
    await (supabase as any)
      .from('monitor_og_health')
      .insert({
        page_key: report.pageKey,
        page_path: report.pagePath,
        issue_type: report.issueType,
        severity: report.severity,
        message: report.message,
        image_url: report.imageUrl,
        user_id: userData?.user?.id || null,
        user_agent: navigator.userAgent,
        platform: detectPlatform(),
        extra: report.extra || null,
      });
  } catch (e) {
    // 静默失败，不影响用户体验
    console.warn('[OG Health] Report failed:', e);
  }
}

const wechatDiagnosticCache = new Map<string, number>();
const WECHAT_DIAGNOSTIC_COOLDOWN_MS = 30 * 1000;

function getWechatTraceId(): string {
  try {
    const key = 'wechat_share_trace_id';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const generated = `wxshare_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, generated);
    return generated;
  } catch {
    return `wxshare_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export async function reportWechatShareDiagnostic(report: {
  stage: string;
  severity?: 'critical' | 'warning' | 'info';
  message: string;
  imageUrl?: string;
  extra?: Record<string, unknown>;
}): Promise<void> {
  const traceId = getWechatTraceId();
  const cacheKey = `${traceId}:${report.stage}:${report.message}`;
  const last = wechatDiagnosticCache.get(cacheKey);
  if (last && Date.now() - last < WECHAT_DIAGNOSTIC_COOLDOWN_MS) return;
  wechatDiagnosticCache.set(cacheKey, Date.now());

  try {
    const { data: userData } = await supabase.auth.getUser();
    await (supabase as any)
      .from('monitor_og_health')
      .insert({
        page_key: 'wechat_share',
        page_path: `${window.location.pathname}${window.location.search || ''}`,
        issue_type: `wechat_jssdk_${report.stage}`,
        severity: report.severity || 'info',
        message: report.message,
        image_url: report.imageUrl,
        user_id: userData?.user?.id || null,
        user_agent: navigator.userAgent,
        platform: detectPlatform(),
        extra: {
          traceId,
          stage: report.stage,
          href: window.location.href,
          entryUrl: (window as any).__WECHAT_ENTRY_URL__ || null,
          referrer: document.referrer || null,
          visibilityState: document.visibilityState,
          wxExists: !!(window as any).wx,
          ...report.extra,
        },
      });
  } catch (e) {
    console.warn('[WechatShareDiagnostic] Report failed:', e);
  }
}

/**
 * 检查 OG 图片是否可加载
 */
export function checkOGImageHealth(
  imageUrl: string,
  pageKey: string,
  pagePath: string
): void {
  if (!imageUrl) {
    reportOGHealth({
      pageKey,
      pagePath,
      issueType: 'image_url_invalid',
      severity: 'critical',
      message: `OG 图片 URL 为空`,
    });
    return;
  }

  // 简单 URL 格式校验
  try {
    new URL(imageUrl);
  } catch {
    reportOGHealth({
      pageKey,
      pagePath,
      issueType: 'image_url_invalid',
      severity: 'critical',
      message: `OG 图片 URL 格式无效: ${imageUrl}`,
      imageUrl,
    });
    return;
  }

  // 异步检测图片是否可加载
  const img = new Image();
  img.onload = () => {
    // 检查图片尺寸是否合理（OG 图片应至少 200x200）
    if (img.naturalWidth < 200 || img.naturalHeight < 200) {
      reportOGHealth({
        pageKey,
        pagePath,
        issueType: 'image_url_invalid',
        severity: 'warning',
        message: `OG 图片尺寸过小: ${img.naturalWidth}x${img.naturalHeight}`,
        imageUrl,
        extra: { width: img.naturalWidth, height: img.naturalHeight },
      });
    }
  };
  img.onerror = () => {
    reportOGHealth({
      pageKey,
      pagePath,
      issueType: 'image_load_failed',
      severity: 'critical',
      message: `OG 图片加载失败: ${imageUrl}`,
      imageUrl,
    });
  };
  img.src = imageUrl;
}

/**
 * 记录用户分享行为
 */
export function reportShareAction(options: {
  method: 'webshare' | 'preview' | 'download';
  success: boolean;
  cancelled?: boolean;
  title?: string;
  filename?: string;
}): void {
  const pagePath = window.location.pathname;
  const pageKey = pagePath || '/';

  reportOGHealth({
    pageKey,
    pagePath,
    issueType: 'share_action',
    severity: 'info',
    message: `用户分享: ${options.method} ${options.success ? '成功' : options.cancelled ? '取消' : '失败'}`,
    extra: {
      method: options.method,
      success: options.success,
      cancelled: options.cancelled || false,
      title: options.title,
      filename: options.filename,
    },
  });
}

/**
 * 检查 OG 配置完整性
 */
export function checkOGConfigCompleteness(
  config: { ogTitle?: string; description?: string; image?: string; url?: string },
  pageKey: string,
  pagePath: string,
  isCustomized: boolean
): void {
  const missing: string[] = [];
  if (!config.ogTitle) missing.push('og:title');
  if (!config.description) missing.push('og:description');
  if (!config.image) missing.push('og:image');
  if (!config.url) missing.push('og:url');

  if (missing.length > 0) {
    reportOGHealth({
      pageKey,
      pagePath,
      issueType: 'config_incomplete',
      severity: missing.includes('og:image') ? 'critical' : 'warning',
      message: `OG 配置缺失字段: ${missing.join(', ')}`,
      extra: { missingFields: missing, isCustomized },
    });
  }
}

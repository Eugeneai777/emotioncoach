/**
 * OG 分享健康上报工具
 * 在 DynamicOGMeta 组件中检测并上报 OG 相关异常
 */

import { supabase } from "@/integrations/supabase/client";
import { detectPlatform } from "@/lib/platformDetector";

type OGIssueType = 'image_load_failed' | 'config_missing' | 'config_incomplete' | 'image_url_invalid' | 'share_failed';

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

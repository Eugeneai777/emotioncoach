import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';
import { dispatchEmergencyAlerts } from '../_shared/emergencyAlert.ts';

/**
 * OG 分享健康监控定时检查（每15分钟）
 * 检测：图片加载失败、配置缺失、配置不完整等
 * 触发企业微信告警
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 验证 cron / admin 身份
  const cronError = validateCronSecret(req);
  if (cronError) {
    const authHeader = req.headers.get('authorization') || '';
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) {
      return cronError;
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const alerts: Array<{ type: string; alertType?: string; level: string; message: string; details: string }> = [];
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    // 1. 检查最近15分钟内的 critical 级别 OG 异常
    const { data: criticalIssues, count: criticalCount } = await supabase
      .from('monitor_og_health')
      .select('*', { count: 'exact' })
      .eq('severity', 'critical')
      .eq('status', 'open')
      .gte('created_at', fifteenMinAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if ((criticalCount || 0) > 0) {
      const summary = (criticalIssues || [])
        .slice(0, 5)
        .map(i => `- [${i.issue_type}] ${i.message}${i.page_key ? ` (页面: ${i.page_key})` : ''}${i.platform ? ` 平台: ${i.platform}` : ''}`)
        .join('\n');

      alerts.push({
        type: 'og_health', alertType: 'og_critical_issues',
        level: 'critical',
        message: `OG分享异常预警：最近15分钟内检测到 ${criticalCount} 条严重分享问题`,
        details: `最新异常记录:\n${summary}`,
      });
    }

    // 2. 检查图片加载失败集中爆发（15分钟内 > 5 条 image_load_failed）
    const { count: imageFailCount } = await supabase
      .from('monitor_og_health')
      .select('*', { count: 'exact', head: true })
      .eq('issue_type', 'image_load_failed')
      .eq('status', 'open')
      .gte('created_at', fifteenMinAgo);

    if ((imageFailCount || 0) > 5) {
      alerts.push({
        type: 'og_health', alertType: 'og_image_load_failed',
        level: 'critical',
        message: `OG图片加载异常：最近15分钟内 ${imageFailCount} 次图片加载失败`,
        details: `大量用户分享时无法正常显示预览图片，可能影响传播效果，请检查图片CDN或存储服务`,
      });
    }

    // 3. 检查同一页面1小时内反复出现异常（> 10 条）
    const { data: recentIssues } = await supabase
      .from('monitor_og_health')
      .select('page_key, issue_type')
      .eq('status', 'open')
      .gte('created_at', oneHourAgo);

    if (recentIssues && recentIssues.length > 0) {
      const pageCounts = new Map<string, number>();
      for (const issue of recentIssues) {
        const key = issue.page_key || 'unknown';
        pageCounts.set(key, (pageCounts.get(key) || 0) + 1);
      }

      const hotPages = Array.from(pageCounts.entries())
        .filter(([_, count]) => count >= 10)
        .sort((a, b) => b[1] - a[1]);

      if (hotPages.length > 0 && alerts.length === 0) {
        const pageSummary = hotPages
          .slice(0, 5)
          .map(([page, count]) => `- 页面 ${page}: ${count} 条异常`)
          .join('\n');

        alerts.push({
          type: 'og_health', alertType: 'og_hot_pages',
          level: 'high',
          message: `OG配置异常集中：${hotPages.length} 个页面在1小时内反复出现分享问题`,
          details: `高频异常页面:\n${pageSummary}`,
        });
      }
    }

    // 4. 检查 warning 级别堆积（15分钟内 > 20 条未处理 warning）
    const { count: warningCount } = await supabase
      .from('monitor_og_health')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'warning')
      .eq('status', 'open')
      .gte('created_at', fifteenMinAgo);

    if ((warningCount || 0) > 20 && alerts.length === 0) {
      alerts.push({
        type: 'og_health', alertType: 'og_warning_backlog',
        level: 'high',
        message: `OG分享警告堆积：最近15分钟内累计 ${warningCount} 条未处理警告`,
        details: `大量页面OG配置存在问题（如图片尺寸不合规、缺少描述字段等），建议批量排查`,
      });
    }

    // 推送告警（统一冷却去重 + 日志）
    const dispatchResult = await dispatchEmergencyAlerts(supabase, supabaseUrl, serviceKey,
      alerts.map((a: any) => ({
        source: 'og_health',
        level: a.level,
        alertType: a.alertType || a.type,
        message: a.message,
        details: a.details,
      }))
    );

    console.log(`OG health check completed. ${alerts.length} alerts, sent=${dispatchResult.sent}, skipped=${dispatchResult.skipped}`);

    return new Response(JSON.stringify({ success: true, alerts_count: alerts.length, alerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('check-og-health-alerts error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

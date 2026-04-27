import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 验证 cron secret、anon key（pg_cron）或 admin 身份
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const cronSecret = Deno.env.get('CRON_SECRET');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const srvKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const isCron = (cronSecret && token === cronSecret) || 
                 (anonKey && token === anonKey) || 
                 (srvKey && token === srvKey);

  if (!isCron) {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const requestMode = await req.clone().json().then((body) => body?.mode).catch(() => null);
  const normalizeOnly = requestMode === 'normalize' || new URL(req.url).searchParams.get('mode') === 'normalize';
  const alerts: Array<{ type: string; level: string; message: string; details: string }> = [];
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const extractPath = (url?: string | null) => {
    if (!url) return '';
    try { return new URL(url).pathname; } catch { return url; }
  };

  const getKnownNoActionReason = (err: any) => {
    const url = String(err.url || '');
    const body = String(err.response_body || err.message || '');
    const includesAny = (...parts: string[]) => parts.some((part) => url.includes(part) || body.includes(part));

    if (err.error_type === 'client_error' && includesAny('/auth/v1/token', 'invalid_grant', 'Invalid login credentials')) {
      return '用户登录凭据/token 状态导致的客户端拦截，属正常行为，已自动标记为无需处理。';
    }
    if (err.error_type === 'client_error' && includesAny('余额不足', 'Insufficient quota')) {
      return '业务规则正常拦截（余额/额度不足），无需技术修复。';
    }
    if ((err.error_type === 'network_fail' || err.error_type === 'timeout') && includesAny('monitor_api_errors', 'monitor_frontend_errors', 'monitor_stability_records', 'monitor_ux_anomalies')) {
      return '监控上报在页面关闭/切换时被中断，属低价值噪声，已自动降噪。';
    }
    if ((err.error_type === 'network_fail' || err.error_type === 'timeout') && includesAny('check-order-status')) {
      return '支付状态轮询被中断或超时，多由用户离开页面/未完成支付触发，已自动标记为无需处理。';
    }
    if ((err.error_type === 'network_fail' || err.error_type === 'timeout') && includesAny('/auth/v1/user', '/auth/v1/token')) {
      return '微信/移动端认证请求被网络或页面生命周期中断；非服务端代码错误，已自动标记为无需处理。';
    }
    if (
      err.error_type === 'server_error' &&
      err.status_code === 503 &&
      includesAny('SUPABASE_EDGE_RUNTIME_ERROR', 'Service is temporarily unavailable')
    ) {
      return '后端函数运行时短暂不可用，业务代码未执行；属于平台瞬时波动，已自动标记为无需处理。';
    }
    return null;
  };

  const markSelfHealedApiErrors = async () => {
    const { data: errors } = await supabase
      .from('monitor_api_errors')
      .select('id, url, status_code, error_type, response_body, created_at, user_id')
      .eq('status', 'pending')
      .gte('created_at', twentyFourHoursAgo)
      .in('error_type', ['server_error', 'network_fail', 'timeout']);

    if (!errors?.length) return 0;

    const { data: successes } = await supabase
      .from('monitor_stability_records')
      .select('request_path, status_code, success, created_at, user_id')
      .eq('success', true)
      .gte('created_at', twentyFourHoursAgo)
      .limit(1000);

    if (!successes?.length) return 0;

    const healedIds = errors
      .filter((err: any) => {
        const path = extractPath(err.url);
        const isTransientRuntime =
          (path.includes('/functions/v1/') &&
            (err.status_code === 503 || err.error_type === 'network_fail' || err.error_type === 'timeout' || String(err.response_body || '').includes('Service is temporarily unavailable'))) ||
          (path === '/auth/v1/user' && (err.error_type === 'timeout' || err.error_type === 'network_fail')) ||
          (path === '/auth/v1/token' && (err.error_type === 'timeout' || err.error_type === 'network_fail'));
        if (!isTransientRuntime) return false;

        const errTime = new Date(err.created_at).getTime();
        return successes.some((ok: any) => {
          const okTime = new Date(ok.created_at).getTime();
          const retryWindowMs = path.startsWith('/auth/v1/') ? 5 * 60 * 1000 : 3 * 60 * 1000;
          const withinRetryWindow = okTime >= errTime && okTime - errTime <= retryWindowMs;
          const sameUser = !err.user_id || !ok.user_id || err.user_id === ok.user_id;
          return withinRetryWindow && sameUser && ok.request_path === path;
        });
      })
      .map((err: any) => err.id);

    if (healedIds.length === 0) return 0;

    await supabase
      .from('monitor_api_errors')
      .update({
        status: 'ignored',
        diagnosis: '重试后已有同一路径成功请求，判定为短暂连接/运行时波动，已自动降噪。',
        fix_suggestion: '无需人工处理；继续观察同一路径是否持续失败。',
        diagnosed_at: new Date().toISOString(),
      })
      .in('id', healedIds);

    return healedIds.length;
  };

  const markNoActionApiErrors = async () => {
    const { data: errors } = await supabase
      .from('monitor_api_errors')
      .select('id, url, error_type, response_body, message, created_at')
      .eq('status', 'pending')
      .gte('created_at', twentyFourHoursAgo)
      .in('error_type', ['client_error', 'server_error', 'network_fail', 'timeout']);

    const noAction = (errors || [])
      .map((err: any) => ({ id: err.id, reason: getKnownNoActionReason(err) }))
      .filter((item: any) => item.reason);

    if (noAction.length === 0) return 0;

    for (const item of noAction) {
      await supabase
        .from('monitor_api_errors')
        .update({
          status: 'ignored',
          diagnosis: item.reason,
          fix_suggestion: '无需人工处理；若同类失败持续高频出现，再按聚合趋势排查。',
          diagnosed_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    }

    return noAction.length;
  };

  try {
    const noActionCount = await markNoActionApiErrors();
    const selfHealedCount = await markSelfHealedApiErrors();
    if (noActionCount > 0) {
      console.log(`Auto-muted ${noActionCount} no-action API errors.`);
    }
    if (selfHealedCount > 0) {
      console.log(`Auto-muted ${selfHealedCount} self-healed API errors.`);
    }

    if (normalizeOnly) {
      return new Response(JSON.stringify({ success: true, noActionCount, selfHealedCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. 检查 API 错误突增（15分钟内 > 10 条）
    const { count: apiErrorCount } = await supabase
      .from('monitor_api_errors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('created_at', fifteenMinAgo);

    if ((apiErrorCount || 0) > 10) {
      // 查询详情用于聚合
      const { data: apiErrors } = await supabase
        .from('monitor_api_errors')
        .select('method, url, error_type, status_code, message')
        .eq('status', 'pending')
        .gte('created_at', fifteenMinAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      const apiAgg = new Map<string, { count: number; msg: string }>();
      for (const e of (apiErrors || [])) {
        const key = `${e.method} ${e.url} [${e.error_type}]${e.status_code ? ` ${e.status_code}` : ''}`;
        const existing = apiAgg.get(key);
        if (existing) {
          existing.count++;
        } else {
          apiAgg.set(key, { count: 1, msg: (e.message || '').slice(0, 80) });
        }
      }
      const apiTop = Array.from(apiAgg.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([k, v]) => `- ${k} x${v.count}: ${v.msg}`)
        .join('\n');

      alerts.push({
        type: 'api_monitor',
        level: 'high',
        message: `API 错误突增预警：最近15分钟内出现 ${apiErrorCount} 条接口错误`,
        details: `错误数量: ${apiErrorCount}，超过阈值 10 条\n\n错误分布（Top 5）:\n${apiTop}`,
      });
    }

    // 2. 检查前端错误突增（15分钟内 > 15 条）
    const { count: feErrorCount } = await supabase
      .from('monitor_frontend_errors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fifteenMinAgo);

    if ((feErrorCount || 0) > 15) {
      // 查询详情用于聚合
      const { data: feErrors } = await supabase
        .from('monitor_frontend_errors')
        .select('error_type, message, page')
        .gte('created_at', fifteenMinAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      const feAgg = new Map<string, { count: number; pages: Set<string> }>();
      for (const e of (feErrors || [])) {
        const key = `[${e.error_type}] ${(e.message || '').slice(0, 80)}`;
        const existing = feAgg.get(key);
        if (existing) {
          existing.count++;
          if (e.page) existing.pages.add(e.page);
        } else {
          const pages = new Set<string>();
          if (e.page) pages.add(e.page);
          feAgg.set(key, { count: 1, pages });
        }
      }
      const feTop = Array.from(feAgg.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([k, v]) => `- ${k} x${v.count} (页面: ${[...v.pages].join(', ') || '未知'})`)
        .join('\n');

      alerts.push({
        type: 'stability',
        level: 'high',
        message: `前端错误突增预警：最近15分钟内出现 ${feErrorCount} 条前端错误`,
        details: `错误数量: ${feErrorCount}，超过阈值 15 条\n\n错误分布（Top 5）:\n${feTop}`,
      });
    }

    // 3. 检查未处理的高危风险内容
    const { data: pendingRisks, count: riskCount } = await supabase
      .from('monitor_risk_content')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .in('risk_level', ['critical', 'high'])
      .order('created_at', { ascending: false })
      .limit(5);

    if ((riskCount || 0) > 0) {
      const riskSummary = (pendingRisks || [])
        .map(r => `- [${r.risk_level}] ${r.risk_type}: ${r.content_preview?.slice(0, 50)}`)
        .join('\n');
      alerts.push({
        type: 'risk_content',
        level: 'critical',
        message: `${riskCount} 条高危风险内容待处理`,
        details: `最新风险记录:\n${riskSummary}`,
      });
    }

    // 4. 检查 UX 体验异常突增（15分钟内 > 20 条）
    const { count: uxAnomalyCount } = await supabase
      .from('monitor_ux_anomalies')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fifteenMinAgo);

    if ((uxAnomalyCount || 0) > 20) {
      // 获取分布详情
      const { data: uxDetails } = await supabase
        .from('monitor_ux_anomalies')
        .select('anomaly_type, scene')
        .gte('created_at', fifteenMinAgo)
        .limit(50);

      const typeCounts = new Map<string, number>();
      for (const d of (uxDetails || [])) {
        const key = `${d.anomaly_type}(${d.scene || '未知'})`;
        typeCounts.set(key, (typeCounts.get(key) || 0) + 1);
      }
      const topTypes = Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `- ${k}: ${v} 条`)
        .join('\n');

      alerts.push({
        type: 'stability',
        level: 'high',
        message: `UX 体验异常突增预警：最近15分钟内出现 ${uxAnomalyCount} 条体验异常`,
        details: `异常类型分布:\n${topTypes}`,
      });
    }

    // 推送告警
    if (alerts.length > 0) {
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true);

      for (const alert of alerts) {
        const matchedContacts = (contacts || []).filter(c =>
          c.alert_types?.includes(alert.type) &&
          c.alert_levels?.includes(alert.level)
        );

        for (const contact of matchedContacts) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-emergency-alert`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
              body: JSON.stringify({
                webhook_url: contact.wecom_webhook_url,
                contact_name: contact.name,
                alert_type: alert.type,
                alert_level: alert.level,
                message: alert.message,
                details: alert.details,
              }),
            });

            await supabase.from('emergency_alert_logs').insert({
              contact_id: contact.id,
              contact_name: contact.name,
              alert_type: alert.type,
              alert_level: alert.level,
              message: alert.message,
              status: 'sent',
            });
          } catch (e) {
            console.error(`Failed to send alert to ${contact.name}:`, e);
          }
        }
      }
    }

    console.log(`Monitor check completed. ${alerts.length} alerts triggered.`);

    return new Response(JSON.stringify({ success: true, alerts_count: alerts.length, alerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('check-monitor-alerts error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

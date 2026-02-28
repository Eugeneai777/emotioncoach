import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

/**
 * 用户异常监控定时检查（每15分钟）
 * 检测：高频调用、异地登录、可疑操作等
 * 触发企业微信告警
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 验证 cron / admin 身份
  const cronError = validateCronSecret(req);
  if (cronError) {
    // fallback: check if authenticated user
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

  const alerts: Array<{ type: string; level: string; message: string; details: string }> = [];
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    // 1. 检查最近15分钟未处理的高危用户异常
    const { data: criticalAnomalies, count: criticalCount } = await supabase
      .from('monitor_user_anomalies')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .in('severity', ['critical', 'high'])
      .gte('created_at', fifteenMinAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if ((criticalCount || 0) > 0) {
      const summary = (criticalAnomalies || [])
        .slice(0, 5)
        .map(a => `- [${a.severity}] ${a.anomaly_type}: ${a.title || a.message?.slice(0, 60)}${a.user_id ? ` (用户: ${a.user_id.slice(0, 8)}...)` : ''}${a.ip_address ? ` IP: ${a.ip_address}` : ''}`)
        .join('\n');

      alerts.push({
        type: 'user_anomaly',
        level: (criticalAnomalies || []).some(a => a.severity === 'critical') ? 'critical' : 'high',
        message: `用户异常预警：最近15分钟内检测到 ${criticalCount} 条高危异常行为`,
        details: `最新异常记录:\n${summary}`,
      });
    }

    // 2. 检查高频调用异常（同一用户1小时内 > 5 条异常）
    const { data: frequentAnomalies } = await supabase
      .from('monitor_user_anomalies')
      .select('user_id, anomaly_type')
      .gte('created_at', oneHourAgo)
      .eq('status', 'pending');

    if (frequentAnomalies && frequentAnomalies.length > 0) {
      // 按用户聚合
      const userCounts = new Map<string, number>();
      for (const a of frequentAnomalies) {
        if (a.user_id) {
          userCounts.set(a.user_id, (userCounts.get(a.user_id) || 0) + 1);
        }
      }

      const heavyUsers = Array.from(userCounts.entries())
        .filter(([_, count]) => count >= 5)
        .sort((a, b) => b[1] - a[1]);

      if (heavyUsers.length > 0) {
        const userSummary = heavyUsers
          .slice(0, 5)
          .map(([uid, count]) => `- 用户 ${uid.slice(0, 8)}...: ${count} 条异常`)
          .join('\n');

        // 避免与上面重复告警
        if (alerts.length === 0) {
          alerts.push({
            type: 'user_anomaly',
            level: 'high',
            message: `高频异常用户预警：${heavyUsers.length} 个用户在1小时内触发多次异常`,
            details: `频繁异常用户:\n${userSummary}`,
          });
        }
      }
    }

    // 3. 检查异地登录集中爆发（15分钟内 > 3 条 login 类异常）
    const { count: loginAnomalyCount } = await supabase
      .from('monitor_user_anomalies')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fifteenMinAgo)
      .in('anomaly_type', ['suspicious_login', 'multi_location_login', 'frequent_login']);

    if ((loginAnomalyCount || 0) > 3) {
      alerts.push({
        type: 'user_anomaly',
        level: 'critical',
        message: `异地登录预警：最近15分钟内检测到 ${loginAnomalyCount} 条可疑登录行为`,
        details: `可能存在账号被盗或批量攻击，请立即核查`,
      });
    }

    // 推送告警
    if (alerts.length > 0) {
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true);

      for (const alert of alerts) {
        const matchedContacts = (contacts || []).filter((c: any) =>
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
            console.error(`Failed to send user anomaly alert to ${contact.name}:`, e);
          }
        }
      }
    }

    console.log(`User anomaly check completed. ${alerts.length} alerts triggered.`);

    return new Response(JSON.stringify({ success: true, alerts_count: alerts.length, alerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('check-user-anomaly-alerts error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

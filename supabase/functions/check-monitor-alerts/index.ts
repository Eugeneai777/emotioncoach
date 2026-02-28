import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 验证 cron secret 或 admin 身份
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const cronSecret = Deno.env.get('CRON_SECRET');
  const isCron = cronSecret && token === cronSecret;

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

  const alerts: Array<{ type: string; level: string; message: string; details: string }> = [];
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  try {
    // 1. 检查 API 错误突增（15分钟内 > 10 条）
    const { count: apiErrorCount } = await supabase
      .from('monitor_api_errors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fifteenMinAgo);

    if ((apiErrorCount || 0) > 10) {
      alerts.push({
        type: 'api_monitor',
        level: 'high',
        message: `API 错误突增预警：最近15分钟内出现 ${apiErrorCount} 条接口错误`,
        details: `错误数量: ${apiErrorCount}，超过阈值 10 条`,
      });
    }

    // 2. 检查前端错误突增（15分钟内 > 15 条）
    const { count: feErrorCount } = await supabase
      .from('monitor_frontend_errors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fifteenMinAgo);

    if ((feErrorCount || 0) > 15) {
      alerts.push({
        type: 'stability',
        level: 'high',
        message: `前端错误突增预警：最近15分钟内出现 ${feErrorCount} 条前端错误`,
        details: `错误数量: ${feErrorCount}，超过阈值 15 条`,
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

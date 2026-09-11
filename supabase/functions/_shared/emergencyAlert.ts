/**
 * 统一的企业微信告警分发（服务端定时巡检专用）
 * - 15 分钟冷却去重：同一 alert_source + alert_type 内不重复推送
 * - 按 emergency_contacts 的 alert_types / alert_levels 匹配联系人
 * - 统一写入 emergency_alert_logs（alert_source / send_status）
 */

export interface DispatchAlert {
  /** 告警来源模块，需与 emergency_contacts.alert_types 一致 */
  source: string;
  /** 告警级别 critical | high | medium */
  level: string;
  /** 告警子类型 */
  alertType: string;
  message: string;
  details?: string;
}

const COOLDOWN_MINUTES = 15;

/** 企业微信展示用的来源中文名 */
const SOURCE_LABELS: Record<string, string> = {
  api_monitor: '调用监控',
  cost_monitor: '成本监控',
  user_anomaly: '用户异常',
  stability: '稳定性监控',
  risk_content: '风险内容',
  og_health: 'OG分享监控',
};

export async function dispatchEmergencyAlerts(
  supabase: any,
  supabaseUrl: string,
  serviceKey: string,
  alerts: DispatchAlert[],
): Promise<{ sent: number; skipped: number; errors: string[] }> {
  const result = { sent: 0, skipped: 0, errors: [] as string[] };
  if (!alerts.length) return result;

  const cooldownSince = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000).toISOString();

  const { data: contacts } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('is_active', true);

  for (const alert of alerts) {
    // 冷却去重
    const { data: recent } = await supabase
      .from('emergency_alert_logs')
      .select('id')
      .eq('alert_source', alert.source)
      .eq('alert_type', alert.alertType)
      .eq('send_status', 'success')
      .gte('created_at', cooldownSince)
      .limit(1);

    if (recent && recent.length > 0) {
      result.skipped++;
      continue;
    }

    const matched = (contacts || []).filter((c: any) =>
      c.alert_types?.includes(alert.source) &&
      c.alert_levels?.includes(alert.level)
    );

    for (const contact of matched) {
      let sendStatus = 'success';
      let errorMessage: string | null = null;

      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-emergency-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({
            webhook_url: contact.wecom_webhook_url,
            contact_name: contact.name,
            alert_type: SOURCE_LABELS[alert.source] || alert.source,
            alert_level: alert.level,
            message: alert.message,
            details: alert.details,
          }),
        });

        if (!resp.ok) {
          sendStatus = 'failed';
          errorMessage = `HTTP ${resp.status}: ${(await resp.text()).slice(0, 300)}`;
        }
      } catch (e) {
        sendStatus = 'failed';
        errorMessage = e instanceof Error ? e.message : 'Unknown error';
      }

      if (sendStatus === 'success') {
        result.sent++;
      } else {
        result.errors.push(`${contact.name}: ${errorMessage}`);
      }

      await supabase.from('emergency_alert_logs').insert({
        contact_id: contact.id,
        contact_name: contact.name,
        alert_source: alert.source,
        alert_level: alert.level,
        alert_type: alert.alertType,
        message: alert.message,
        details: alert.details ?? null,
        send_status: sendStatus,
        error_message: errorMessage,
      });
    }
  }

  return result;
}

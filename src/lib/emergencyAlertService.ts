/**
 * 紧急告警服务 - 统一管理所有监控模块的企业微信告警推送
 * 支持告警去重（同一类型5分钟内不重复发送）、按来源/级别过滤联系人
 */

import { supabase } from "@/integrations/supabase/client";

export type AlertSource = 'api_monitor' | 'cost_monitor' | 'user_anomaly' | 'stability' | 'risk_content';

export interface EmergencyAlertPayload {
  /** 告警来源模块 */
  source: AlertSource;
  /** 告警级别 */
  level: 'critical' | 'high' | 'medium';
  /** 告警子类型 (如 error_rate_spike, cost_exceeded) */
  alertType: string;
  /** 告警消息 */
  message: string;
  /** 详细信息 */
  details?: string;
}

const SOURCE_LABELS: Record<AlertSource, string> = {
  api_monitor: '调用监控',
  cost_monitor: '成本监控',
  user_anomaly: '用户异常',
  stability: '稳定性监控',
  risk_content: '风险内容',
};

// Cooldown: same source+alertType won't fire within 5 minutes
const COOLDOWN_MS = 5 * 60 * 1000;
const recentAlerts = new Map<string, number>();

function getCooldownKey(source: string, alertType: string): string {
  return `${source}:${alertType}`;
}

function isInCooldown(source: string, alertType: string): boolean {
  const key = getCooldownKey(source, alertType);
  const last = recentAlerts.get(key);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

function markSent(source: string, alertType: string) {
  recentAlerts.set(getCooldownKey(source, alertType), Date.now());
}

/**
 * 触发紧急告警 - 自动查找匹配的联系人并推送企业微信消息
 */
export async function triggerEmergencyAlert(payload: EmergencyAlertPayload): Promise<{
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const result = { sent: 0, skipped: 0, errors: [] as string[] };

  // Check cooldown
  if (isInCooldown(payload.source, payload.alertType)) {
    result.skipped = 1;
    return result;
  }

  try {
    // Fetch active contacts matching source and level
    const { data: contacts, error } = await (supabase as any)
      .from('emergency_contacts')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!contacts?.length) return result;

    // Filter contacts by alert_types (source) and alert_levels (level)
    const matched = contacts.filter((c: any) => {
      const types: string[] = c.alert_types || [];
      const levels: string[] = c.alert_levels || [];
      return types.includes(payload.source) && levels.includes(payload.level);
    });

    if (!matched.length) return result;

    // Send to all matched contacts in parallel
    const promises = matched.map(async (contact: any) => {
      try {
        const { error: fnError } = await supabase.functions.invoke('send-emergency-alert', {
          body: {
            webhook_url: contact.wecom_webhook_url,
            contact_name: contact.name,
            alert_type: SOURCE_LABELS[payload.source] || payload.source,
            alert_level: payload.level,
            message: payload.message,
            details: payload.details,
          },
        });

        // Log the alert
        await (supabase as any).from('emergency_alert_logs').insert({
          contact_id: contact.id,
          contact_name: contact.name,
          alert_source: payload.source,
          alert_level: payload.level,
          alert_type: payload.alertType,
          message: payload.message,
          details: payload.details,
          send_status: fnError ? 'failed' : 'success',
          error_message: fnError?.message || null,
        });

        if (fnError) {
          result.errors.push(`${contact.name}: ${fnError.message}`);
        } else {
          result.sent++;
        }
      } catch (e: any) {
        result.errors.push(`${contact.name}: ${e.message}`);
      }
    });

    await Promise.all(promises);

    // Mark cooldown only if at least one sent successfully
    if (result.sent > 0) {
      markSent(payload.source, payload.alertType);
    }
  } catch (e: any) {
    result.errors.push(e.message);
  }

  return result;
}

/**
 * 获取最近的告警日志
 */
export async function getRecentAlertLogs(limit = 50) {
  const { data, error } = await (supabase as any)
    .from('emergency_alert_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

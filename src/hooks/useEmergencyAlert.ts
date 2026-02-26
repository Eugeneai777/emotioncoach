/**
 * React hook for triggering emergency alerts from monitoring components
 */

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { triggerEmergencyAlert, type EmergencyAlertPayload } from "@/lib/emergencyAlertService";

export function useEmergencyAlert() {
  const sending = useRef(false);

  const sendAlert = useCallback(async (payload: EmergencyAlertPayload) => {
    if (sending.current) return;
    sending.current = true;

    try {
      const result = await triggerEmergencyAlert(payload);

      if (result.sent > 0) {
        toast.info(`🚨 已推送紧急告警至 ${result.sent} 位联系人`, { duration: 4000 });
      }
      if (result.errors.length > 0) {
        console.warn('[EmergencyAlert] Errors:', result.errors);
      }

      return result;
    } catch (e) {
      console.error('[EmergencyAlert] Failed:', e);
    } finally {
      sending.current = false;
    }
  }, []);

  return { sendAlert };
}

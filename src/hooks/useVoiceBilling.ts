import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceBillingOptions {
  featureKey: string;
  pointsPerMinute?: number;
  sessionId: string;
  onQuotaChange?: (remaining: number) => void;
}

interface BillingState {
  lastBilledMinute: number;
  isDeducting: boolean;
  isPreDeducted: boolean;
  totalDeducted: number;
}

export function useVoiceBilling({
  featureKey,
  pointsPerMinute = 8,
  sessionId,
  onQuotaChange
}: UseVoiceBillingOptions) {
  const { toast } = useToast();
  const stateRef = useRef<BillingState>({
    lastBilledMinute: 0,
    isDeducting: false,
    isPreDeducted: false,
    totalDeducted: 0
  });

  // 预扣第一分钟
  const preDeductFirstMinute = useCallback(async (): Promise<boolean> => {
    if (stateRef.current.isPreDeducted) {
      console.log('[VoiceBilling] Already pre-deducted, skipping');
      return true;
    }

    try {
      console.log(`[VoiceBilling] Pre-deducting ${pointsPerMinute} points`);
      const { data, error } = await supabase.functions.invoke('deduct-quota', {
        body: {
          feature_key: featureKey,
          source: 'voice_chat',
          amount: pointsPerMinute,
          metadata: {
            minute: 1,
            session_id: sessionId,
            type: 'pre_deduction'
          }
        }
      });

      if (error || data?.error) {
        console.error('[VoiceBilling] Pre-deduction failed:', error || data?.error);
        return false;
      }

      stateRef.current.isPreDeducted = true;
      stateRef.current.lastBilledMinute = 1;
      stateRef.current.totalDeducted = pointsPerMinute;
      onQuotaChange?.(data.remaining_quota);
      console.log(`[VoiceBilling] Pre-deducted ${pointsPerMinute} points, remaining: ${data.remaining_quota}`);
      return true;
    } catch (e) {
      console.error('[VoiceBilling] Pre-deduction error:', e);
      return false;
    }
  }, [featureKey, pointsPerMinute, sessionId, onQuotaChange]);

  // 扣除指定分钟的费用
  const deductMinute = useCallback(async (minute: number): Promise<boolean> => {
    // 防重复
    if (minute <= stateRef.current.lastBilledMinute) {
      console.log(`[VoiceBilling] Minute ${minute} already billed, skipping`);
      return true;
    }

    // 防并发
    if (stateRef.current.isDeducting) {
      console.log('[VoiceBilling] Deduction in progress, skipping');
      return false;
    }

    stateRef.current.isDeducting = true;

    try {
      console.log(`[VoiceBilling] Deducting for minute ${minute}`);
      const { data, error } = await supabase.functions.invoke('deduct-quota', {
        body: {
          feature_key: featureKey,
          source: 'voice_chat',
          amount: pointsPerMinute,
          metadata: {
            minute,
            session_id: sessionId,
            type: 'billing'
          }
        }
      });

      if (error || data?.error) {
        console.error('[VoiceBilling] Deduction failed:', error || data?.error);
        toast({
          title: "点数不足",
          description: "余额不足，通话已自动结束",
          variant: "destructive"
        });
        return false;
      }

      stateRef.current.lastBilledMinute = minute;
      stateRef.current.totalDeducted += pointsPerMinute;
      onQuotaChange?.(data.remaining_quota);
      console.log(`[VoiceBilling] Deducted for minute ${minute}, remaining: ${data.remaining_quota}`);
      return true;
    } catch (e) {
      console.error('[VoiceBilling] Deduction error:', e);
      return false;
    } finally {
      stateRef.current.isDeducting = false;
    }
  }, [featureKey, pointsPerMinute, sessionId, toast, onQuotaChange]);

  // 退还预扣点数（连接失败时）
  const refundPreDeducted = useCallback(async (reason: string): Promise<boolean> => {
    if (!stateRef.current.isPreDeducted) {
      console.log('[VoiceBilling] Nothing to refund');
      return false;
    }

    try {
      console.log(`[VoiceBilling] Refunding ${pointsPerMinute} points, reason: ${reason}`);
      const { data, error } = await supabase.functions.invoke('refund-failed-voice-call', {
        body: {
          amount: pointsPerMinute,
          session_id: sessionId,
          reason,
          feature_key: featureKey
        }
      });

      if (error) {
        console.error('[VoiceBilling] Refund failed:', error);
        return false;
      }

      if (data?.success) {
        stateRef.current.isPreDeducted = false;
        stateRef.current.lastBilledMinute = 0;
        stateRef.current.totalDeducted = 0;
        onQuotaChange?.(data.remaining_quota);
        toast({
          title: "点数已退还",
          description: `${data.refunded_amount} 点已退还到您的账户`,
        });
        console.log(`[VoiceBilling] Refunded ${data.refunded_amount} points`);
        return true;
      }

      return false;
    } catch (e) {
      console.error('[VoiceBilling] Refund error:', e);
      return false;
    }
  }, [featureKey, pointsPerMinute, sessionId, toast, onQuotaChange]);

  // 短通话退款（通话结束时调用）
  const refundShortCall = useCallback(async (durationSeconds: number): Promise<boolean> => {
    // 只有在真正连接成功并预扣了点数的情况下才处理
    if (!stateRef.current.isPreDeducted || stateRef.current.lastBilledMinute === 0) {
      console.log('[VoiceBilling] No pre-deduction to refund for short call');
      return false;
    }

    let refundAmount = 0;
    let refundReason = '';

    // 10秒内：全额退款（可能是误触或连接问题）
    if (durationSeconds < 10) {
      refundAmount = pointsPerMinute;
      refundReason = 'call_too_short_under_10s';
    } 
    // 10-30秒：半额退款（可能是快速测试）
    else if (durationSeconds < 30) {
      refundAmount = Math.floor(pointsPerMinute / 2);
      refundReason = 'call_short_10_to_30s';
    }
    // 超过30秒：不退款
    else {
      console.log('[VoiceBilling] Call duration >= 30s, no refund');
      return false;
    }

    if (refundAmount === 0) return false;

    try {
      console.log(`[VoiceBilling] Short call refund: ${refundAmount} points, duration: ${durationSeconds}s, reason: ${refundReason}`);
      const { data, error } = await supabase.functions.invoke('refund-failed-voice-call', {
        body: {
          amount: refundAmount,
          session_id: sessionId,
          reason: refundReason,
          feature_key: featureKey
        }
      });

      if (error) {
        console.error('[VoiceBilling] Short call refund failed:', error);
        return false;
      }

      if (data?.success) {
        stateRef.current.totalDeducted -= refundAmount;
        onQuotaChange?.(data.remaining_quota);
        toast({
          title: "短通话退款",
          description: `通话时长较短，已退还 ${refundAmount} 点`,
        });
        console.log(`[VoiceBilling] Short call refunded ${refundAmount} points`);
        return true;
      }

      return false;
    } catch (e) {
      console.error('[VoiceBilling] Short call refund error:', e);
      return false;
    }
  }, [featureKey, pointsPerMinute, sessionId, toast, onQuotaChange]);

  // 获取当前计费状态
  const getBillingState = useCallback(() => ({
    lastBilledMinute: stateRef.current.lastBilledMinute,
    isPreDeducted: stateRef.current.isPreDeducted,
    totalDeducted: stateRef.current.totalDeducted
  }), []);

  // 恢复已扣费分钟（断线重连时）
  const restoreBilledMinutes = useCallback((minutes: number) => {
    stateRef.current.lastBilledMinute = minutes;
    stateRef.current.isPreDeducted = minutes > 0;
    stateRef.current.totalDeducted = minutes * pointsPerMinute;
    console.log(`[VoiceBilling] Restored billed minutes: ${minutes}`);
  }, [pointsPerMinute]);

  return {
    preDeductFirstMinute,
    deductMinute,
    refundPreDeducted,
    refundShortCall,
    getBillingState,
    restoreBilledMinutes,
    pointsPerMinute
  };
}

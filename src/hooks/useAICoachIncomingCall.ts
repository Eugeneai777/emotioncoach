import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AICoachCall {
  id: string;
  user_id: string;
  scenario: 'care' | 'reminder' | 'reactivation' | 'camp_followup' | 'emotion_check' | 'late_night_companion';
  call_status: 'pending' | 'ringing' | 'connected' | 'missed' | 'rejected' | 'completed';
  coach_type: string;
  opening_message: string | null;
  context: Record<string, any>;
  ring_started_at: string | null;
  created_at: string;
}

interface UseAICoachIncomingCallReturn {
  incomingCall: AICoachCall | null;
  answerCall: (callId: string) => Promise<{ openingMessage: string | null; coachType: string }>;
  rejectCall: (callId: string) => Promise<void>;
  isConnecting: boolean;
}

const SCENARIO_LABELS: Record<string, string> = {
  care: '想关心一下你最近的状态',
  reminder: '有一些重要事情想提醒你',
  reactivation: '好久没见，想跟你聊聊',
  camp_followup: '训练营今日任务还没完成哦',
  emotion_check: '感觉你最近情绪有些波动',
  late_night_companion: '深夜了，想陪你聊聊',
};

export function useAICoachIncomingCall(): UseAICoachIncomingCallReturn {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<AICoachCall | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // 检查是否有正在响铃的来电
    const checkExistingCall = async () => {
      const { data } = await supabase
        .from('ai_coach_calls')
        .select('*')
        .eq('user_id', user.id)
        .eq('call_status', 'ringing')
        .order('ring_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        // 检查是否超时（30秒内有效）
        const ringStartedAt = new Date(data.ring_started_at || data.created_at).getTime();
        const elapsed = Date.now() - ringStartedAt;
        if (elapsed < 30000) {
          setIncomingCall(data as AICoachCall);
        }
      }
    };

    checkExistingCall();

    // 订阅实时变更
    const channel = supabase
      .channel(`ai-coach-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_coach_calls',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const call = payload.new as AICoachCall;
          if (call.call_status === 'ringing') {
            console.log('[AICoachCall] Incoming call:', call);
            setIncomingCall(call);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_coach_calls',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const call = payload.new as AICoachCall;
          // 如果状态变为非 ringing，清除来电
          if (call.call_status !== 'ringing' && incomingCall?.id === call.id) {
            setIncomingCall(null);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id]);

  const answerCall = useCallback(async (callId: string): Promise<{ openingMessage: string | null; coachType: string }> => {
    if (!incomingCall) {
      throw new Error('No incoming call to answer');
    }

    setIsConnecting(true);

    try {
      // 更新状态为 connected
      const { error } = await supabase
        .from('ai_coach_calls')
        .update({
          call_status: 'connected',
          connected_at: new Date().toISOString(),
        })
        .eq('id', callId);

      if (error) {
        throw error;
      }

      const result = {
        openingMessage: incomingCall.opening_message,
        coachType: incomingCall.coach_type,
      };

      setIncomingCall(null);
      return result;
    } finally {
      setIsConnecting(false);
    }
  }, [incomingCall]);

  const rejectCall = useCallback(async (callId: string): Promise<void> => {
    try {
      await supabase
        .from('ai_coach_calls')
        .update({
          call_status: 'rejected',
          ended_at: new Date().toISOString(),
        })
        .eq('id', callId);

      setIncomingCall(null);
    } catch (error) {
      console.error('[AICoachCall] Reject error:', error);
    }
  }, []);

  return {
    incomingCall,
    answerCall,
    rejectCall,
    isConnecting,
  };
}

export { SCENARIO_LABELS };

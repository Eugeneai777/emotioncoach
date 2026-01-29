import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAICoachIncomingCall, AICoachCall } from '@/hooks/useAICoachIncomingCall';
import { AIIncomingCallDialog } from './AIIncomingCallDialog';
import { supabase } from '@/integrations/supabase/client';

interface AICoachCallContextValue {
  incomingCall: AICoachCall | null;
  isInAICall: boolean;
  currentCallData: {
    callId: string;
    openingMessage: string | null;
    coachType: string;
  } | null;
  clearCallData: () => void;
}

const AICoachCallContext = createContext<AICoachCallContextValue | null>(null);

export function useAICoachCallContext() {
  const context = useContext(AICoachCallContext);
  if (!context) {
    throw new Error('useAICoachCallContext must be used within AICoachCallProvider');
  }
  return context;
}

interface AICoachCallProviderProps {
  children: ReactNode;
}

// 教练类型到路由的映射
const COACH_ROUTES: Record<string, string> = {
  vibrant_life: '/coach/vibrant_life_sage',
  vibrant_life_sage: '/coach/vibrant_life_sage',
  emotion: '/emotion-coach',
  parent: '/parent-coach',
  parent_emotion: '/parent-coach',
  gratitude: '/coach/gratitude',
  story: '/story-coach',
  wealth: '/coach/wealth_coach_4_questions',
};

export function AICoachCallProvider({ children }: AICoachCallProviderProps) {
  const navigate = useNavigate();
  const { incomingCall, answerCall, rejectCall, isConnecting } = useAICoachIncomingCall();
  const [currentCallData, setCurrentCallData] = useState<{
    callId: string;
    openingMessage: string | null;
    coachType: string;
  } | null>(null);

  const handleAnswer = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const { openingMessage, coachType } = await answerCall(incomingCall.id);

      // 存储来电数据供语音页面使用
      setCurrentCallData({
        callId: incomingCall.id,
        openingMessage,
        coachType,
      });

      // 同时存储到 sessionStorage，防止页面刷新丢失
      sessionStorage.setItem('ai_incoming_call', JSON.stringify({
        callId: incomingCall.id,
        openingMessage,
        coachType,
        answeredAt: Date.now(),
      }));

      // 导航到对应的教练页面
      const route = COACH_ROUTES[coachType] || COACH_ROUTES.vibrant_life;
      navigate(route, {
        state: {
          isIncomingCall: true,
          aiCallId: incomingCall.id,
          openingMessage,
        },
      });
    } catch (error) {
      console.error('[AICoachCall] Answer error:', error);
    }
  }, [incomingCall, answerCall, navigate]);

  const handleReject = useCallback(async () => {
    if (!incomingCall) return;
    await rejectCall(incomingCall.id);
  }, [incomingCall, rejectCall]);

  const clearCallData = useCallback(() => {
    setCurrentCallData(null);
    sessionStorage.removeItem('ai_incoming_call');
  }, []);

  const isInAICall = !!currentCallData;

  return (
    <AICoachCallContext.Provider
      value={{
        incomingCall,
        isInAICall,
        currentCallData,
        clearCallData,
      }}
    >
      {children}

      {/* AI来电弹窗 */}
      <AIIncomingCallDialog
        isOpen={!!incomingCall && incomingCall.call_status === 'ringing'}
        scenario={incomingCall?.scenario || 'care'}
        coachType={incomingCall?.coach_type || 'vibrant_life'}
        onAnswer={handleAnswer}
        onReject={handleReject}
        isConnecting={isConnecting}
      />
    </AICoachCallContext.Provider>
  );
}

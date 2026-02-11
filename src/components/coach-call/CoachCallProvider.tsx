import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useCoachCall } from '@/hooks/useCoachCall';
import { CoachCallUI } from './CoachCallUI';
import { IncomingCallDialog } from './IncomingCallDialog';
import { supabase } from '@/integrations/supabase/client';
import { createUxTracker, trackUserCancel } from '@/lib/uxAnomalyTracker';

interface CallerInfo {
  id: string;
  name: string;
  avatar?: string;
}

interface CoachCallContextValue {
  startCall: (calleeId: string, calleeName: string, appointmentId?: string) => Promise<void>;
  isInCall: boolean;
}

const CoachCallContext = createContext<CoachCallContextValue | null>(null);

export function useCoachCallContext() {
  const context = useContext(CoachCallContext);
  if (!context) {
    throw new Error('useCoachCallContext must be used within CoachCallProvider');
  }
  return context;
}

interface CoachCallProviderProps {
  children: ReactNode;
}

export function CoachCallProvider({ children }: CoachCallProviderProps) {
  const [remoteName, setRemoteName] = useState('');
  const [remoteAvatar, setRemoteAvatar] = useState<string | undefined>();
  const [incomingCaller, setIncomingCaller] = useState<CallerInfo | null>(null);

  const handleIncomingCall = useCallback(async (callId: string, callerId: string, callerName: string) => {
    setIncomingCaller({
      id: callerId,
      name: callerName
    });
  }, []);

  const {
    callState,
    isMuted,
    isSpeakerOn,
    startCall: initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker
  } = useCoachCall({
    onIncomingCall: handleIncomingCall
  });

  const startCall = useCallback(async (calleeId: string, calleeName: string, appointmentId?: string) => {
    const tracker = createUxTracker('human_coach_call', { calleeId });
    setRemoteName(calleeName);
    setRemoteAvatar(undefined);
    try {
      await initiateCall(calleeId, appointmentId);
      tracker.success();
    } catch (e: any) {
      tracker.fail(e?.message || '发起通话失败');
    }
  }, [initiateCall]);

  const handleAnswer = useCallback(async () => {
    if (incomingCaller && callState.callId) {
      setRemoteName(incomingCaller.name);
      setRemoteAvatar(incomingCaller.avatar);
      await answerCall(callState.callId, incomingCaller.id);
      setIncomingCaller(null);
    }
  }, [incomingCaller, callState.callId, answerCall]);

  const handleReject = useCallback(async () => {
    if (incomingCaller && callState.callId) {
      trackUserCancel('human_coach_call', '用户拒接真人来电');
      await rejectCall(callState.callId, incomingCaller.id);
      setIncomingCaller(null);
    }
  }, [incomingCaller, callState.callId, rejectCall]);

  const isInCall = callState.status !== 'idle';

  return (
    <CoachCallContext.Provider value={{ startCall, isInCall }}>
      {children}
      
      {/* 来电弹窗 */}
      <IncomingCallDialog
        isOpen={!!incomingCaller && callState.status === 'ringing'}
        callerName={incomingCaller?.name || ''}
        callerAvatar={incomingCaller?.avatar}
        onAnswer={handleAnswer}
        onReject={handleReject}
      />

      {/* 通话界面 */}
      {callState.status !== 'idle' && callState.status !== 'ringing' && (
        <CoachCallUI
          status={callState.status}
          duration={callState.duration}
          isIncoming={callState.isIncoming}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          remoteName={remoteName}
          remoteAvatar={remoteAvatar}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
        />
      )}
    </CoachCallContext.Provider>
  );
}

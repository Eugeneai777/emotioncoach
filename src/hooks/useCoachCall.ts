import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CallState {
  callId: string | null;
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  remoteUserId: string | null;
  isIncoming: boolean;
  startTime: Date | null;
  duration: number;
}

interface UseCoachCallOptions {
  onIncomingCall?: (callId: string, callerId: string, callerName: string) => void;
}

export function useCoachCall(options?: UseCoachCallOptions) {
  const { toast } = useToast();
  const [callState, setCallState] = useState<CallState>({
    callId: null,
    status: 'idle',
    remoteUserId: null,
    isIncoming: false,
    startTime: null,
    duration: 0,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const signalChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 创建音频元素
  useEffect(() => {
    remoteAudioRef.current = document.createElement('audio');
    remoteAudioRef.current.autoplay = true;
    return () => {
      remoteAudioRef.current?.remove();
    };
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (signalChannelRef.current) {
      supabase.removeChannel(signalChannelRef.current);
      signalChannelRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  // 初始化 WebRTC 连接
  const initPeerConnection = useCallback(() => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
    
    const pc = new RTCPeerConnection(config);
    
    pc.ontrack = (event) => {
      console.log('Remote track received:', event.streams[0]);
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        endCall('connection_failed');
      }
    };
    
    pcRef.current = pc;
    return pc;
  }, []);

  // 发送信令
  const sendSignal = useCallback(async (callId: string, toUserId: string, type: string, data: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('coach_call_signals').insert({
      call_id: callId,
      from_user_id: user.id,
      to_user_id: toUserId,
      signal_type: type,
      signal_data: data
    });

    if (error) {
      console.error('Error sending signal:', error);
    }
  }, []);

  // 处理收到的信令
  const handleSignal = useCallback(async (signal: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    console.log('Received signal:', signal.signal_type);

    switch (signal.signal_type) {
      case 'offer':
        await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal(signal.call_id, signal.from_user_id, 'answer', answer);
        break;
        
      case 'answer':
        await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
        break;
        
      case 'ice-candidate':
        if (signal.signal_data) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data));
        }
        break;
        
      case 'hangup':
        endCall('remote_hangup');
        break;
        
      case 'reject':
        endCall('rejected');
        toast({
          title: "通话被拒绝",
          variant: "destructive"
        });
        break;
    }
  }, [sendSignal, toast]);

  // 订阅信令通道
  const subscribeToSignals = useCallback((callId: string, userId: string) => {
    const channel = supabase
      .channel(`call-signals-${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_call_signals',
          filter: `to_user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new.call_id === callId) {
            handleSignal(payload.new);
          }
        }
      )
      .subscribe();

    signalChannelRef.current = channel;
  }, [handleSignal]);

  // 发起通话
  const startCall = useCallback(async (calleeId: string, appointmentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "请先登录", variant: "destructive" });
        return null;
      }

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // 创建通话记录
      const { data: call, error } = await supabase.from('coach_calls').insert({
        caller_id: user.id,
        callee_id: calleeId,
        caller_type: 'user',
        call_status: 'ringing',
        appointment_id: appointmentId,
        started_at: new Date().toISOString()
      }).select().single();

      if (error || !call) {
        toast({ title: "创建通话失败", variant: "destructive" });
        cleanup();
        return null;
      }

      // 初始化 WebRTC
      const pc = initPeerConnection();
      
      // 添加本地音频轨道
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // 收集 ICE 候选
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(call.id, calleeId, 'ice-candidate', event.candidate);
        }
      };

      // 创建 offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 发送 offer
      await sendSignal(call.id, calleeId, 'offer', offer);

      // 订阅信令
      subscribeToSignals(call.id, user.id);

      setCallState({
        callId: call.id,
        status: 'calling',
        remoteUserId: calleeId,
        isIncoming: false,
        startTime: new Date(),
        duration: 0
      });

      return call.id;
    } catch (error: any) {
      console.error('Error starting call:', error);
      toast({
        title: "发起通话失败",
        description: error.message || "请检查麦克风权限",
        variant: "destructive"
      });
      cleanup();
      return null;
    }
  }, [toast, cleanup, initPeerConnection, sendSignal, subscribeToSignals]);

  // 接听来电
  const answerCall = useCallback(async (callId: string, callerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // 初始化 WebRTC
      const pc = initPeerConnection();
      
      // 添加本地音频轨道
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // 收集 ICE 候选
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(callId, callerId, 'ice-candidate', event.candidate);
        }
      };

      // 订阅信令
      subscribeToSignals(callId, user.id);

      // 更新通话状态
      await supabase.from('coach_calls').update({
        call_status: 'connected',
        connected_at: new Date().toISOString()
      }).eq('id', callId);

      setCallState({
        callId,
        status: 'connected',
        remoteUserId: callerId,
        isIncoming: true,
        startTime: new Date(),
        duration: 0
      });

      // 开始计时
      durationIntervalRef.current = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

    } catch (error: any) {
      console.error('Error answering call:', error);
      toast({
        title: "接听失败",
        description: error.message,
        variant: "destructive"
      });
      cleanup();
    }
  }, [toast, cleanup, initPeerConnection, sendSignal, subscribeToSignals]);

  // 拒绝来电
  const rejectCall = useCallback(async (callId: string, callerId: string) => {
    await sendSignal(callId, callerId, 'reject', {});
    
    await supabase.from('coach_calls').update({
      call_status: 'rejected',
      ended_at: new Date().toISOString(),
      end_reason: 'rejected'
    }).eq('id', callId);

    setCallState({
      callId: null,
      status: 'idle',
      remoteUserId: null,
      isIncoming: false,
      startTime: null,
      duration: 0
    });
  }, [sendSignal]);

  // 结束通话
  const endCall = useCallback(async (reason: string = 'user_hangup') => {
    const { callId, remoteUserId, duration } = callState;
    
    if (callId && remoteUserId) {
      await sendSignal(callId, remoteUserId, 'hangup', {});
      
      await supabase.from('coach_calls').update({
        call_status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        end_reason: reason
      }).eq('id', callId);
    }

    cleanup();
    
    setCallState({
      callId: null,
      status: 'idle',
      remoteUserId: null,
      isIncoming: false,
      startTime: null,
      duration: 0
    });
  }, [callState, sendSignal, cleanup]);

  // 切换静音
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // 切换扬声器
  const toggleSpeaker = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  }, [isSpeakerOn]);

  // 监听来电
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupIncomingCallListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('incoming-calls')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'coach_calls',
            filter: `callee_id=eq.${user.id}`
          },
          async (payload) => {
            const call = payload.new as any;
            if (call.call_status === 'ringing') {
              // 获取呼叫者信息
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', call.caller_id)
                .single();

              setCallState({
                callId: call.id,
                status: 'ringing',
                remoteUserId: call.caller_id,
                isIncoming: true,
                startTime: null,
                duration: 0
              });

              options?.onIncomingCall?.(
                call.id,
                call.caller_id,
                profile?.display_name || '未知用户'
              );
            }
          }
        )
        .subscribe();
    };

    setupIncomingCallListener();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [options]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    isMuted,
    isSpeakerOn,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker
  };
}

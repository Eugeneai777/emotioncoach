import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TeenVoiceChatProps {
  accessToken: string;
  parentUserId: string;
  teenNickname?: string;
  customGreeting?: string;
  avatarEmoji?: string;
  onClose: () => void;
}

export default function TeenVoiceChat({
  accessToken,
  parentUserId,
  teenNickname,
  customGreeting,
  avatarEmoji = '✨',
  onClose
}: TeenVoiceChatProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'ended'>('connecting');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const billingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBilledMinuteRef = useRef<number>(0);
  const isPreDeductedRef = useRef<boolean>(false);

  // Billing - deduct from parent's account
  const deductQuota = useCallback(async (amount: number) => {
    try {
      const { error } = await supabase.functions.invoke('deduct-quota', {
        body: {
          feature: 'teen_realtime_voice',
          parent_user_id: parentUserId,
          amount
        }
      });
      if (error) {
        console.error('Deduction error:', error);
      }
    } catch (err) {
      console.error('Failed to deduct quota:', err);
    }
  }, [parentUserId]);

  // 🔧 Refund pre-deducted quota on connection failure - 增强日志
  // 🔧 重要：退款到父账户（parentUserId），而非当前登录用户
  const refundPreDeductedQuota = useCallback(async (reason: string): Promise<boolean> => {
    const currentBilledMinute = lastBilledMinuteRef.current;
    console.log(`[TeenVoiceChat] 🔄 refundPreDeductedQuota called - isPreDeducted: ${isPreDeductedRef.current}, currentBilledMinute: ${currentBilledMinute}, reason: ${reason}`);
    
    if (!isPreDeductedRef.current) {
      console.log('[TeenVoiceChat] ⏭️ Skip refund: not pre-deducted');
      return false;
    }
    
    try {
      const requestBody = {
        amount: 8,
        session_id: `teen_${Date.now()}`,
        reason,
        feature_key: 'teen_realtime_voice',
        target_user_id: parentUserId  // 🔧 退款到父账户
      };
      console.log(`[TeenVoiceChat] 📡 Sending refund request to parent ${parentUserId}:`, JSON.stringify(requestBody));
      
      const { data, error } = await supabase.functions.invoke('refund-failed-voice-call', {
        body: requestBody
      });
      
      console.log('[TeenVoiceChat] 📦 Refund response:', JSON.stringify({ data, error }));
      
      if (error) {
        console.error('[TeenVoiceChat] ❌ Refund API error:', error);
        return false;
      }
      
      if (data?.success) {
        console.log(`[TeenVoiceChat] ✅ Refund successful: ${data.refunded_amount} points returned to parent, new balance: ${data.remaining_quota}`);
        isPreDeductedRef.current = false;
        lastBilledMinuteRef.current = 0;
        toast({
          title: "点数已退还",
          description: "8 点已退还到账户",
        });
        return true;
      } else {
        console.warn('[TeenVoiceChat] ⚠️ Refund response without success:', data);
        return false;
      }
    } catch (e) {
      console.error('[TeenVoiceChat] 💥 Refund exception:', e);
      return false;
    }
  }, [toast, parentUserId]);

  // 🔧 使用 ref 追踪最新的 duration，解决闭包问题
  const durationRef = useRef(0);
  
  // 保持 durationRef 与 duration 同步
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Initialize WebRTC connection
  const initConnection = useCallback(async () => {
    try {
      // 🔧 Pre-deduct first minute (8 points) before connecting
      await deductQuota(8);
      isPreDeductedRef.current = true;
      lastBilledMinuteRef.current = 1; // 🔧 修正：预扣后设为1，表示第1分钟已扣
      
      // Get ephemeral token from edge function
      const { data, error } = await supabase.functions.invoke('teen-realtime-token', {
        body: { access_token: accessToken }
      });

      if (error || !data?.client_secret?.value) {
        // Connection failed - refund pre-deducted quota
        await refundPreDeductedQuota('token_fetch_failed');
        throw new Error(data?.error || '无法建立连接');
      }

      const ephemeralKey = data.client_secret.value;
      const realtimeUrl = data.realtime_url || 'https://api.openai.com/v1/realtime';

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up audio element
      audioRef.current = document.createElement('audio');
      audioRef.current.autoplay = true;

      pc.ontrack = (e) => {
        if (audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
        }
      };

      // Add local audio track
      let ms;
      try {
        ms = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (micError) {
        // Microphone access failed - refund
        await refundPreDeductedQuota('microphone_access_denied');
        throw new Error('麦克风权限被拒绝');
      }
      
      pc.addTrack(ms.getTracks()[0]);

      // Set up data channel
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('Received event:', event.type);

          if (event.type === 'response.audio.delta') {
            setIsSpeaking(true);
          } else if (event.type === 'response.audio.done') {
            setIsSpeaking(false);
          } else if (event.type === 'error') {
            console.error('API Error:', event.error);
          }
        } catch (err) {
          console.error('Failed to parse event:', err);
        }
      });

      dc.addEventListener('open', () => {
        console.log('Data channel open');
        setStatus('connected');
        
        // Start duration timer
        durationTimerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);

        // First minute already deducted in pre-deduction
        // 🔧 修复：使用 durationRef.current 获取最新的 duration 值
        billingTimerRef.current = setInterval(() => {
          const currentMinute = Math.floor(durationRef.current / 60) + 1; // 第几分钟
          if (currentMinute > lastBilledMinuteRef.current) {
            console.log(`[TeenVoiceChat] Billing minute ${currentMinute}, duration: ${durationRef.current}s`);
            deductQuota(8);
            lastBilledMinuteRef.current = currentMinute;
          }
        }, 10000); // 每10秒检查一次，更精确
      });

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI Realtime API
      const model = 'gpt-realtime-mini';
      const sdpResponse = await fetch(`${realtimeUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        }
      });

      if (!sdpResponse.ok) {
        // WebRTC connection failed - refund
        await refundPreDeductedQuota('webrtc_connection_failed');
        throw new Error('连接失败');
      }

      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text()
      };

      await pc.setRemoteDescription(answer);
      console.log('WebRTC connection established');

    } catch (err) {
      console.error('Connection error:', err);
      setErrorMessage(err instanceof Error ? err.message : '连接失败');
      setStatus('error');
    }
  }, [accessToken, deductQuota, refundPreDeductedQuota]);

  // 🔧 短通话退款函数 - 增强日志
  // 🔧 重要：退款到父账户（parentUserId）
  const refundShortCall = useCallback(async (durationSeconds: number): Promise<boolean> => {
    const currentBilledMinute = lastBilledMinuteRef.current;
    console.log(`[TeenVoiceChat] 🔄 refundShortCall called - durationSeconds: ${durationSeconds}, currentBilledMinute: ${currentBilledMinute}, isPreDeducted: ${isPreDeductedRef.current}`);
    
    if (!isPreDeductedRef.current) {
      console.log('[TeenVoiceChat] ⏭️ Skip short call refund: not pre-deducted');
      return false;
    }

    // 只处理第一分钟的退款（后续分钟用户已实际使用）
    if (currentBilledMinute > 1) {
      console.log('[TeenVoiceChat] ⏭️ Skip short call refund: multiple minutes billed');
      return false;
    }

    let refundAmount = 0;
    let refundReason = '';

    // 10秒内：全额退款
    if (durationSeconds < 10) {
      refundAmount = 8;
      refundReason = 'call_too_short_under_10s';
      console.log(`[TeenVoiceChat] 📊 Short call < 10s: full refund (${refundAmount} points)`);
    } 
    // 10-30秒：半额退款
    else if (durationSeconds < 30) {
      refundAmount = 4;
      refundReason = 'call_short_10_to_30s';
      console.log(`[TeenVoiceChat] 📊 Short call 10-30s: half refund (${refundAmount} points)`);
    } else {
      console.log('[TeenVoiceChat] ⏭️ Call duration >= 30s, no refund needed');
      return false;
    }

    if (refundAmount === 0) {
      console.log('[TeenVoiceChat] ⏭️ Calculated refund amount is 0, skipping');
      return false;
    }

    try {
      const requestBody = {
        amount: refundAmount,
        session_id: `teen_${Date.now()}`,
        reason: refundReason,
        feature_key: 'teen_realtime_voice',
        target_user_id: parentUserId  // 🔧 退款到父账户
      };
      console.log(`[TeenVoiceChat] 📡 Sending short call refund to parent ${parentUserId}:`, JSON.stringify(requestBody));
      
      const { data, error } = await supabase.functions.invoke('refund-failed-voice-call', {
        body: requestBody
      });

      console.log('[TeenVoiceChat] 📦 Short call refund response:', JSON.stringify({ data, error }));

      if (error) {
        console.error('[TeenVoiceChat] ❌ Short call refund API error:', error);
        return false;
      }

      if (data?.success) {
        isPreDeductedRef.current = false;
        lastBilledMinuteRef.current = 0;
        toast({
          title: "短通话退款",
          description: `通话时长较短，已退还 ${refundAmount} 点`,
        });
        console.log(`[TeenVoiceChat] ✅ Short call refunded ${refundAmount} points to parent, new balance: ${data.remaining_quota}`);
        return true;
      } else {
        console.warn('[TeenVoiceChat] ⚠️ Short call refund response without success:', data);
        return false;
      }
    } catch (e) {
      console.error('[TeenVoiceChat] 💥 Short call refund exception:', e);
      return false;
    }
  }, [toast, parentUserId]);

  // End call - 🔧 增强日志
  const endCall = useCallback(async () => {
    // Clear timers
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    if (billingTimerRef.current) {
      clearInterval(billingTimerRef.current);
    }

    // 🔧 退款逻辑优化 - 使用 durationRef 确保获取最新值
    const finalDuration = durationRef.current;
    const finalBilledMinute = lastBilledMinuteRef.current;
    console.log(`[TeenVoiceChat] 🔚 EndCall - finalDuration: ${finalDuration}s, finalBilledMinute: ${finalBilledMinute}, isPreDeducted: ${isPreDeductedRef.current}`);
    
    if (isPreDeductedRef.current) {
      if (finalDuration === 0) {
        // 🔧 修复：预扣了点数但通话从未真正开始，全额退款
        console.log('[TeenVoiceChat] 🔄 Call never started (duration=0), attempting full refund');
        await refundPreDeductedQuota('call_never_started');
      } else if (finalDuration > 0) {
        // 🔧 短通话退款检查
        console.log('[TeenVoiceChat] 🔄 Checking short call refund eligibility');
        await refundShortCall(finalDuration);
      }
    }

    // Close connections
    if (dcRef.current) {
      dcRef.current.close();
    }
    if (pcRef.current) {
      pcRef.current.close();
    }

    setStatus('ended');
  }, [refundShortCall, refundPreDeductedQuota]);

  // Initialize on mount
  useEffect(() => {
    initConnection();

    return () => {
      endCall();
    };
  }, []);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center max-w-sm shadow-lg">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">连接失败</h2>
          <p className="text-muted-foreground text-sm mb-6">{errorMessage}</p>
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-violet-500 to-pink-500"
          >
            返回
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center max-w-sm shadow-lg">
          <div className="text-4xl mb-4">💜</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">聊天结束</h2>
          <p className="text-muted-foreground text-sm mb-2">
            通话时长：{formatDuration(duration)}
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            希望你感觉好一些了
          </p>
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-violet-500 to-pink-500"
          >
            再聊一次
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center px-6">
      {/* Connecting state */}
      {status === 'connecting' && (
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-300 mx-auto mb-4" />
          <p className="text-violet-200">正在连接...</p>
        </div>
      )}

      {/* Connected state */}
      {status === 'connected' && (
        <>
          {/* AI avatar with speaking animation */}
          <div className="relative mb-8">
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center"
              animate={isSpeaking ? {
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 0 0 rgba(167, 139, 250, 0.4)',
                  '0 0 0 20px rgba(167, 139, 250, 0)',
                  '0 0 0 0 rgba(167, 139, 250, 0)'
                ]
              } : {}}
              transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
            >
              <span className="text-5xl">{avatarEmoji}</span>
            </motion.div>

            {/* Status indicator */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
              <span className="text-xs text-white">
                {isSpeaking ? '在说话...' : '在听...'}
              </span>
            </div>
          </div>

          {/* Duration */}
          <p className="text-violet-200 text-lg font-medium mb-8">
            {formatDuration(duration)}
          </p>

          {/* Greeting */}
          <p className="text-violet-100 text-center mb-12 max-w-xs">
            {teenNickname 
              ? `${teenNickname}，${customGreeting || '我在听～说说你的想法吧'}`
              : customGreeting || '我在听～说说你的想法吧'
            }
          </p>

          {/* End call button */}
          <motion.button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>

          <p className="text-violet-300 text-xs mt-4">点击结束聊天</p>
        </>
      )}

      {/* Privacy footer */}
      <div className="fixed bottom-6 left-0 right-0">
        <p className="text-xs text-center text-violet-300/60">
          🔒 对话内容绝对保密
        </p>
      </div>
    </div>
  );
}

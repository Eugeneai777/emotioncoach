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
  onClose: () => void;
}

export default function TeenVoiceChat({
  accessToken,
  parentUserId,
  teenNickname,
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

  // Initialize WebRTC connection
  const initConnection = useCallback(async () => {
    try {
      // Get ephemeral token from edge function
      const { data, error } = await supabase.functions.invoke('teen-realtime-token', {
        body: { access_token: accessToken }
      });

      if (error || !data?.client_secret?.value) {
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
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
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

        // Initial deduction (8 points for first minute)
        deductQuota(8);
        lastBilledMinuteRef.current = 0;

        // Billing timer - deduct 8 points per minute
        billingTimerRef.current = setInterval(() => {
          const currentMinute = Math.floor(duration / 60);
          if (currentMinute > lastBilledMinuteRef.current) {
            deductQuota(8);
            lastBilledMinuteRef.current = currentMinute;
          }
        }, 60000);
      });

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI Realtime API
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${realtimeUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        }
      });

      if (!sdpResponse.ok) {
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
  }, [accessToken, deductQuota, duration]);

  // End call
  const endCall = useCallback(() => {
    // Clear timers
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    if (billingTimerRef.current) {
      clearInterval(billingTimerRef.current);
    }

    // Close connections
    if (dcRef.current) {
      dcRef.current.close();
    }
    if (pcRef.current) {
      pcRef.current.close();
    }

    setStatus('ended');
  }, []);

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
              <span className="text-5xl">✨</span>
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
              ? `${teenNickname}，我在听～说说你的想法吧`
              : '我在听～说说你的想法吧'
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

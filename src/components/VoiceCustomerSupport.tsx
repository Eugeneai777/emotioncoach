import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
}

interface VoiceCustomerSupportProps {
  onClose?: () => void;
}

const VoiceCustomerSupport: React.FC<VoiceCustomerSupportProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);

      // Step 1: Voice to text
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (transcriptionError || !transcriptionData?.text) {
        throw new Error(transcriptionError?.message || '语音识别失败');
      }

      const userText = transcriptionData.text;
      setMessages(prev => [...prev, { role: 'user', content: userText }]);

      // Step 2: Get AI response - build messages array from conversation history
      const conversationMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText }
      ];
      
      const { data: supportData, error: supportError } = await supabase.functions.invoke('customer-support', {
        body: { 
          messages: conversationMessages,
          sessionId 
        }
      });

      if (supportError || !supportData?.reply) {
        throw new Error(supportError?.message || 'AI回复失败');
      }

      const aiReply = supportData.reply;

      // Step 3: Text to speech
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: aiReply }
      });

      let audioUrl: string | undefined;
      if (!ttsError && ttsData?.audioContent) {
        audioUrl = `data:audio/mpeg;base64,${ttsData.audioContent}`;
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: aiReply,
        audioUrl 
      }]);

      // Auto-play AI response
      if (audioUrl) {
        playAudio(audioUrl);
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error(error instanceof Error ? error.message : '处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    
    audio.play().catch(err => {
      console.error('Audio playback error:', err);
      setIsPlaying(false);
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          <span className="font-medium text-foreground">智能语音客服</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Mic className="w-12 h-12 mb-4 text-teal-400" />
            <p className="text-sm">按住下方按钮开始说话</p>
            <p className="text-xs mt-1">我会用语音回复您</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  {msg.audioUrl && msg.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 px-2 text-xs"
                      onClick={() => playAudio(msg.audioUrl!)}
                    >
                      <Volume2 className="w-3 h-3 mr-1" />
                      播放
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Recording Controls */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-r from-teal-50/50 to-cyan-50/50">
        <div className="flex items-center justify-center gap-4">
          {isPlaying && (
            <Button
              variant="outline"
              size="icon"
              onClick={stopAudio}
              className="h-12 w-12 rounded-full"
            >
              <Volume2 className="w-5 h-5 text-teal-600" />
            </Button>
          )}
          
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className={`h-16 w-16 rounded-full transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600'
            }`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-2">
          {isProcessing ? '正在处理...' : isRecording ? '松开结束录音' : '按住说话'}
        </p>
      </div>
    </Card>
  );
};

export default VoiceCustomerSupport;

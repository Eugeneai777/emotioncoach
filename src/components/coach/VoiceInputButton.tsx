import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isWeChatMiniProgram, isWeChatBrowser } from "@/utils/platform";
import { acquireMicrophone, releaseMicrophone } from "@/utils/microphoneManager";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  primaryColor?: string;
  showSuccessToast?: boolean;
}

export const VoiceInputButton = ({ 
  onTranscript, 
  disabled = false,
  primaryColor = "teal",
  showSuccessToast = true
}: VoiceInputButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const isWechat = isWeChatBrowser();

  const startRecording = async () => {
    // 检查浏览器是否支持 getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (isWechat) {
        toast({
          title: "语音功能受限",
          description: "请使用微信键盘的语音输入功能",
        });
      } else {
        toast({
          title: "浏览器不支持语音录制",
          description: "请使用 Chrome、Safari 等现代浏览器",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      // 使用共享麦克风管理器获取流（自动缓存，减少弹窗）
      const stream = await acquireMicrophone();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      if (isWechat) {
        toast({
          title: "请使用键盘语音输入",
          description: "点击微信键盘上的语音按钮进行输入",
        });
      } else {
        toast({
          title: "无法访问麦克风",
          description: "请确保已授予麦克风权限",
          variant: "destructive",
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        onTranscript(data.text);
        if (showSuccessToast) {
          toast({
            title: "语音转换成功",
            description: "已将语音转为文字",
          });
        }
      } else {
        toast({
          title: "未识别到语音",
          description: "请重新录制",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "语音转换失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getButtonStyles = () => {
    if (isRecording) {
      return "bg-red-500 hover:bg-red-600 text-white animate-pulse";
    }
    if (isProcessing) {
      return "bg-muted text-muted-foreground";
    }
    return "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground";
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`h-11 w-11 min-w-[44px] min-h-[44px] rounded-full shrink-0 transition-all ${getButtonStyles()}`}
      title={isRecording ? "点击停止录音" : "点击开始语音输入"}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <Mic className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};

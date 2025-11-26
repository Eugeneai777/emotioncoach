import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  declarationText: string;
  onGeneratePoster: () => Promise<Blob | null>;
}

export const VoiceRecorder = ({ declarationText, onGeneratePoster }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "开始录音",
        description: "请大声朗读你的宣言",
      });
    } catch (error) {
      console.error("录音失败:", error);
      toast({
        title: "录音失败",
        description: "请检查麦克风权限",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "录音完成",
        description: "可以播放或下载录音",
      });
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioURL) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const downloadAudio = () => {
    if (!audioURL) return;

    const link = document.createElement('a');
    link.href = audioURL;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `宣言朗读_${timestamp}.webm`;
    link.click();

    toast({
      title: "已下载录音",
      description: "录音文件已保存",
    });
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs sm:text-sm font-semibold text-foreground">语音朗读</Label>
      
      {audioURL && (
        <audio
          ref={audioRef}
          src={audioURL}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      <div className="flex gap-2">
        {!isRecording && !audioURL && (
          <Button
            onClick={startRecording}
            variant="outline"
            className="flex-1"
          >
            <Mic className="w-4 h-4 mr-2" />
            开始录音
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex-1 animate-pulse"
          >
            <Square className="w-4 h-4 mr-2" />
            停止录音
          </Button>
        )}

        {audioURL && !isRecording && (
          <>
            <Button
              onClick={togglePlayback}
              variant="outline"
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  播放
                </>
              )}
            </Button>
            <Button
              onClick={downloadAudio}
              variant="outline"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                setAudioURL(null);
                setIsPlaying(false);
              }}
              variant="ghost"
              size="icon"
            >
              <Square className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {!audioURL && (
        <p className="text-xs text-muted-foreground">
          🎤 录制你朗读宣言的声音，让能量通过声音传递
        </p>
      )}
    </div>
  );
};

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Check, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StageConfig {
  name: string;
  englishName: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
}

interface VoiceRecordingItemProps {
  index: number;
  reminder: string;
  stageConfig: StageConfig;
  hasRecording: boolean;
  storagePath?: string;
  duration?: number;
  onRecordingComplete: (index: number, storagePath: string, duration: number) => void;
  onRecordingDelete: (index: number) => void;
}

const VoiceRecordingItem = ({
  index,
  reminder,
  stageConfig,
  hasRecording,
  storagePath,
  duration,
  onRecordingComplete,
  onRecordingDelete
}: VoiceRecordingItemProps) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = async () => {
    if (!recordedUrl && !storagePath) return;

    try {
      let audioUrl = recordedUrl;
      
      // If playing from storage
      if (!audioUrl && storagePath) {
        const { data, error } = await supabase.storage
          .from('voice-recordings')
          .download(storagePath);
        
        if (error) throw error;
        audioUrl = URL.createObjectURL(data);
      }

      if (!audioUrl) return;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing recording:', error);
      toast.error('播放失败');
    }
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const saveRecording = async () => {
    if (!recordedBlob || !user) return;

    setIsUploading(true);
    try {
      const filePath = `${user.id}/reminder_${index}.webm`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(filePath, recordedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const durationSec = (Date.now() - startTimeRef.current) / 1000;

      // Save to database
      const { error: dbError } = await supabase
        .from('user_voice_recordings')
        .upsert({
          user_id: user.id,
          reminder_index: index,
          storage_path: filePath,
          duration_seconds: durationSec
        }, { onConflict: 'user_id,reminder_index' });

      if (dbError) throw dbError;

      onRecordingComplete(index, filePath, durationSec);
      setRecordedBlob(null);
      setRecordedUrl(null);
      toast.success('录音已保存');
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteRecording = async () => {
    if (!user || !storagePath) return;

    try {
      // Delete from storage
      await supabase.storage.from('voice-recordings').remove([storagePath]);

      // Delete from database
      const { error } = await supabase
        .from('user_voice_recordings')
        .delete()
        .eq('user_id', user.id)
        .eq('reminder_index', index);

      if (error) throw error;

      onRecordingDelete(index);
      toast.success('录音已删除');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('删除失败');
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    return `${Math.round(seconds)}秒`;
  };

  return (
    <div className={cn(
      "bg-white/70 backdrop-blur rounded-xl p-4 border",
      stageConfig.bgClass.replace('bg-', 'border-').replace('/20', '/30')
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
      <span className={cn(
        "text-xs px-2 py-0.5 rounded-full",
        stageConfig.bgClass,
        stageConfig.textClass
      )}>
        {stageConfig.name}
      </span>
        <span className="text-xs text-muted-foreground">#{index + 1}</span>
        {hasRecording && (
          <span className="text-xs text-teal-600 flex items-center gap-1 ml-auto">
            <Check className="h-3 w-3" />
            已录制 {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Reminder Text */}
      <p className="text-sm text-foreground/80 mb-3 leading-relaxed">
        {reminder}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Recording state */}
        {isRecording ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            className="gap-1"
          >
            <Square className="h-3 w-3" />
            停止
          </Button>
        ) : recordedBlob ? (
          /* Preview state */
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={isPlaying ? stopPlaying : playRecording}
              className="gap-1"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              试听
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={discardRecording}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              重录
            </Button>
            <Button
              size="sm"
              onClick={saveRecording}
              disabled={isUploading}
              className="gap-1 bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
            >
              <Check className="h-3 w-3" />
              {isUploading ? '保存中...' : '保存'}
            </Button>
          </>
        ) : hasRecording ? (
          /* Saved state */
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={isPlaying ? stopPlaying : playRecording}
              className="gap-1"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              播放
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={startRecording}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              重录
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={deleteRecording}
              className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        ) : (
          /* Initial state */
          <Button
            size="sm"
            onClick={startRecording}
            className="gap-1 bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
          >
            <Mic className="h-3 w-3" />
            开始录音
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoiceRecordingItem;

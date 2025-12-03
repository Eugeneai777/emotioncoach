import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, Volume2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StageConfig {
  name: string;
  englishName: string;
  colorClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

interface VoicePlaybackItemProps {
  index: number;
  reminder: string;
  stageConfig: StageConfig;
  storagePath?: string;
  duration?: number;
  onDelete: (index: number) => void;
}

const VoicePlaybackItem = ({
  index,
  reminder,
  stageConfig,
  storagePath,
  duration,
  onDelete
}: VoicePlaybackItemProps) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    return `${Math.floor(seconds)}秒`;
  };

  const handlePlay = async () => {
    if (!storagePath) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('voice-recordings')
        .download(storagePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      if (audioRef.current) {
        audioRef.current.src = url;
      } else {
        audioRef.current = new Audio(url);
      }

      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('播放失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !storagePath) return;
    if (!confirm('确定删除这条语音吗？')) return;

    setIsDeleting(true);
    try {
      // Stop playback if playing
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('voice-recordings')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_voice_recordings')
        .delete()
        .eq('user_id', user.id)
        .eq('reminder_index', index);

      if (dbError) throw dbError;

      onDelete(index);
      toast.success('已删除');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!storagePath) return null;

  return (
    <div className={`bg-white/60 backdrop-blur rounded-xl p-3 border ${stageConfig.borderClass}`}>
      <div className="flex items-start gap-3">
        {/* Index badge */}
        <div className={`w-7 h-7 rounded-full ${stageConfig.bgClass} flex items-center justify-center flex-shrink-0`}>
          <span className={`text-xs font-medium ${stageConfig.textClass}`}>{index + 1}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-teal-800 leading-relaxed line-clamp-2">{reminder}</p>
          <div className="flex items-center gap-2 mt-1">
            <Volume2 className="w-3 h-3 text-teal-400" />
            <span className="text-xs text-teal-500">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-100"
            onClick={handlePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoicePlaybackItem;

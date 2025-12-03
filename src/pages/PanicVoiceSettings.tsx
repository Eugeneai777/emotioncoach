import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Sparkles, ChevronRight, Volume2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cognitiveReminders, getStageConfig } from "@/config/cognitiveReminders";
import VoicePlaybackItem from "@/components/panic/VoicePlaybackItem";

interface RecordingStatus {
  [key: number]: {
    storagePath: string;
    duration?: number;
  };
}

const PanicVoiceSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecordings();
    }
  }, [user]);

  const fetchRecordings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_voice_recordings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const status: RecordingStatus = {};
      data?.forEach((recording: any) => {
        status[recording.reminder_index] = {
          storagePath: recording.storage_path,
          duration: recording.duration_seconds
        };
      });
      setRecordingStatus(status);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (index: number) => {
    setRecordingStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[index];
      return newStatus;
    });
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    
    if (!confirm('确定要删除所有语音吗？此操作不可恢复。')) return;

    try {
      const paths = Object.values(recordingStatus).map(s => s.storagePath);
      
      if (paths.length > 0) {
        await supabase.storage.from('voice-recordings').remove(paths);
      }

      const { error } = await supabase
        .from('user_voice_recordings')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setRecordingStatus({});
      toast.success('所有语音已删除');
    } catch (error) {
      console.error('Error deleting all recordings:', error);
      toast.error('删除失败，请重试');
    }
  };

  const generatedCount = Object.keys(recordingStatus).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-teal-100">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-teal-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium text-teal-800">语音提醒设置</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* AI Generate Banner */}
      <div className="p-4 pb-0">
        <button
          className="w-full bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur rounded-2xl p-4 border border-amber-200/50 hover:border-amber-300 transition-all text-left"
          onClick={() => navigate('/voice-clone-setup')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">AI 一键生成全部语音</p>
                <p className="text-xs text-amber-600/70">使用温柔 AI 声音，一键生成全部 32 条</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </div>
        </button>
      </div>

      {/* Progress */}
      <div className="p-4">
        <div className="bg-white/60 backdrop-blur rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-teal-500" />
              <span className="text-teal-700 font-medium">已生成语音</span>
            </div>
            <span className="text-teal-600">{generatedCount}/32</span>
          </div>
          <div className="h-2 bg-teal-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-300"
              style={{ width: `${(generatedCount / 32) * 100}%` }}
            />
          </div>
          {generatedCount === 0 && (
            <p className="text-sm text-teal-600/70 mt-2">
              点击上方按钮一键生成全部语音提醒
            </p>
          )}
        </div>

        {generatedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAll}
            className="w-full mb-4 text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除所有语音
          </Button>
        )}
      </div>

      {/* Voice List */}
      <div className="px-4 pb-8 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-teal-600">加载中...</div>
        ) : generatedCount === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-teal-400" />
            </div>
            <p className="text-teal-600/70 text-sm">还没有生成语音</p>
            <p className="text-teal-500/60 text-xs mt-1">使用 AI 一键生成全部 32 条语音提醒</p>
          </div>
        ) : (
          cognitiveReminders.map((reminder, index) => {
            const status = recordingStatus[index];
            if (!status) return null;
            
            const stageConfig = getStageConfig(index);
            return (
              <VoicePlaybackItem
                key={index}
                index={index}
                reminder={reminder}
                stageConfig={stageConfig}
                storagePath={status.storagePath}
                duration={status.duration}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default PanicVoiceSettings;

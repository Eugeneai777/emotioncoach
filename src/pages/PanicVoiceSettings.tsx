import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Trash2, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cognitiveReminders, getStageConfig } from "@/config/cognitiveReminders";
import VoiceRecordingItem from "@/components/panic/VoiceRecordingItem";

interface VoiceRecording {
  reminder_index: number;
  storage_path: string;
  duration_seconds: number | null;
}

interface RecordingStatus {
  [key: number]: {
    hasRecording: boolean;
    storagePath?: string;
    duration?: number;
  };
}

const PanicVoiceSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>({});
  const [loading, setLoading] = useState(true);
  const [voiceCloneStatus, setVoiceCloneStatus] = useState<string>('none');

  useEffect(() => {
    if (user) {
      fetchRecordings();
      checkVoiceCloneStatus();
    }
  }, [user]);

  const checkVoiceCloneStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('voice_clone_status')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setVoiceCloneStatus(data.voice_clone_status || 'none');
    }
  };

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
          hasRecording: true,
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

  const handleRecordingComplete = (index: number, storagePath: string, duration: number) => {
    setRecordingStatus(prev => ({
      ...prev,
      [index]: { hasRecording: true, storagePath, duration }
    }));
  };

  const handleRecordingDelete = (index: number) => {
    setRecordingStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[index];
      return newStatus;
    });
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    
    if (!confirm('确定要删除所有录音吗？此操作不可恢复。')) return;

    try {
      // Delete from storage
      const paths = Object.values(recordingStatus)
        .filter(s => s.storagePath)
        .map(s => s.storagePath!);
      
      if (paths.length > 0) {
        await supabase.storage.from('voice-recordings').remove(paths);
      }

      // Delete from database
      const { error } = await supabase
        .from('user_voice_recordings')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setRecordingStatus({});
      toast.success('所有录音已删除');
    } catch (error) {
      console.error('Error deleting all recordings:', error);
      toast.error('删除失败，请重试');
    }
  };

  const recordedCount = Object.keys(recordingStatus).length;

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
          <h1 className="text-lg font-medium text-teal-800">录制我的声音</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* AI Clone Banner */}
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
                <p className="text-sm font-medium text-amber-800">
                  {voiceCloneStatus === 'ready' ? 'AI 声音克隆已就绪' : 'AI 一键生成全部语音'}
                </p>
                <p className="text-xs text-amber-600/70">
                  {voiceCloneStatus === 'ready' 
                    ? '点击重新生成或管理克隆声音' 
                    : '录制 3 个样本，AI 生成全部 32 条'}
                </p>
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
            <span className="text-teal-700 font-medium">手动录制进度</span>
            <span className="text-teal-600">{recordedCount}/32</span>
          </div>
          <div className="h-2 bg-teal-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-300"
              style={{ width: `${(recordedCount / 32) * 100}%` }}
            />
          </div>
          <p className="text-sm text-teal-600/70 mt-2">
            或者手动逐条录制，打造专属提醒
          </p>
        </div>

        {recordedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAll}
            className="w-full mb-4 text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除所有录音
          </Button>
        )}
      </div>

      {/* Recordings List */}
      <div className="px-4 pb-8 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-teal-600">加载中...</div>
        ) : (
          cognitiveReminders.map((reminder, index) => {
            const stageConfig = getStageConfig(index);
            return (
              <VoiceRecordingItem
                key={index}
                index={index}
                reminder={reminder}
                stageConfig={stageConfig}
                hasRecording={recordingStatus[index]?.hasRecording || false}
                storagePath={recordingStatus[index]?.storagePath}
                duration={recordingStatus[index]?.duration}
                onRecordingComplete={handleRecordingComplete}
                onRecordingDelete={handleRecordingDelete}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default PanicVoiceSettings;

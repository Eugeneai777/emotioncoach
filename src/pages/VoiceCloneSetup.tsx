import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles, Mic } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const VoiceCloneSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);

  const handleGenerateAllReminders = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setIsGenerating(true);
    setGenerateProgress(0);

    // Simulate progress since we can't get real-time updates
    const progressInterval = setInterval(() => {
      setGenerateProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 2000);

    try {
      const { data, error } = await supabase.functions.invoke('generate-all-reminders', {});

      clearInterval(progressInterval);
      setGenerateProgress(100);

      if (error) throw error;

      toast.success(`成功生成 ${data.generated} 条语音提醒！`);
      
      setTimeout(() => {
        navigate('/panic-voice-settings');
      }, 1500);
    } catch (error: any) {
      console.error('Error generating reminders:', error);
      toast.error(error.message || '生成失败，请重试');
      clearInterval(progressInterval);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-teal-100">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/panic-voice-settings')}
            className="text-teal-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium text-teal-800">AI 语音生成</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Main content */}
        <div className="bg-white/60 backdrop-blur rounded-2xl p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
            <Mic className="w-10 h-10 text-teal-500" />
          </div>
          <h2 className="text-xl font-medium text-teal-800 mb-2">AI 一键生成语音</h2>
          <p className="text-sm text-teal-600/70 leading-relaxed">
            使用温柔舒缓的 AI 声音
            <br />
            为你生成全部 32 条恐慌缓解提醒语音
          </p>
        </div>

        {/* Features */}
        <div className="bg-white/40 backdrop-blur rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-teal-800">专业级语音合成</p>
              <p className="text-xs text-teal-600/70">采用先进 AI 技术，音质清晰自然</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-teal-800">温柔舒缓的声线</p>
              <p className="text-xs text-teal-600/70">精选温暖女声，传递安全与陪伴</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-teal-800">一键完成</p>
              <p className="text-xs text-teal-600/70">约 2-3 分钟即可生成全部 32 条</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-teal-700">生成进度</span>
              <span className="text-sm text-teal-600">{Math.round(generateProgress)}%</span>
            </div>
            <Progress value={generateProgress} className="h-2" />
            <p className="text-xs text-teal-500/70 mt-2 text-center">
              正在生成语音，请稍候...
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 h-12 text-base"
            disabled={isGenerating}
            onClick={handleGenerateAllReminders}
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 正在生成...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" /> 一键生成全部 32 条语音</>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/panic-voice-settings')}
            disabled={isGenerating}
          >
            跳过，手动录制
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCloneSetup;

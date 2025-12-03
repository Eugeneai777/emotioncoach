import React, { useEffect, useState } from "react";
import { Wind, Mic, Bot, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type StartMode = 'cognitive' | 'breathing';
type VoiceSource = 'ai' | 'user';

interface ModeSelectorProps {
  onSelectMode: (mode: StartMode, voiceSource: VoiceSource) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasUserRecordings, setHasUserRecordings] = useState(false);
  const [recordingCount, setRecordingCount] = useState(0);
  const [selectedVoiceSource, setSelectedVoiceSource] = useState<VoiceSource>('ai');

  useEffect(() => {
    if (user) {
      checkUserRecordings();
    }
  }, [user]);

  const checkUserRecordings = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('user_voice_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!error && count && count > 0) {
      setHasUserRecordings(true);
      setRecordingCount(count);
      setSelectedVoiceSource('user'); // Default to user voice if available
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
      {/* 头部标题 */}
      <div className="text-5xl mb-6">🌿</div>
      <h2 className="text-2xl font-medium text-teal-800 text-center mb-2">
        你很安全
      </h2>
      <p className="text-teal-600/70 text-center mb-8 max-w-xs">
        我在这里陪着你
      </p>

      {/* 声音选择 */}
      {hasUserRecordings && (
        <div className="w-full max-w-[280px] mb-8">
          <p className="text-xs text-teal-600/60 text-center mb-3">选择声音来源</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedVoiceSource('user')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                selectedVoiceSource === 'user'
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg'
                  : 'bg-white/60 text-teal-700 hover:bg-white/80'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span className="text-sm">我的声音</span>
            </button>
            <button
              onClick={() => setSelectedVoiceSource('ai')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                selectedVoiceSource === 'ai'
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg'
                  : 'bg-white/60 text-teal-700 hover:bg-white/80'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm">AI 声音</span>
            </button>
          </div>
          {selectedVoiceSource === 'user' && recordingCount < 32 && (
            <p className="text-xs text-amber-600 text-center mt-2">
              已录制 {recordingCount}/32 条，未录制的将使用 AI 声音
            </p>
          )}
        </div>
      )}
      
      {/* 马上帮我 - 圆形按钮 */}
      <div className="relative mb-12">
        {/* 双层呼吸光晕 */}
        <div className="absolute inset-0 w-40 h-40 rounded-full bg-teal-300/30 blur-2xl animate-breathe" />
        <div className="absolute inset-0 w-40 h-40 rounded-full bg-cyan-300/25 blur-xl animate-breathe-delayed" />
        
        {/* 主按钮 - 160px 立体效果 */}
        <button
          className="relative w-40 h-40 rounded-full bg-gradient-to-b from-teal-400 via-cyan-500 to-teal-600 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 active:translate-y-1 ring-2 ring-white/20"
          style={{
            boxShadow: '0 8px 32px rgba(20,184,166,0.4), 0 4px 16px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={() => onSelectMode('cognitive', selectedVoiceSource)}
        >
          <span className="text-white font-semibold text-base tracking-wide">马上帮我</span>
        </button>
      </div>
      
      {/* 分割线 */}
      <div className="w-full max-w-[200px] flex items-center gap-3 mb-6">
        <Separator className="flex-1 bg-teal-200/50" />
        <span className="text-teal-400/60 text-xs">或者</span>
        <Separator className="flex-1 bg-teal-200/50" />
      </div>
      
      {/* 先做呼吸引导 - 文字链接 */}
      <button
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 transition-colors mb-6"
        onClick={() => onSelectMode('breathing', selectedVoiceSource)}
      >
        <Wind className="w-4 h-4" />
        <span className="text-sm">先做呼吸引导</span>
      </button>

      {/* 录制我的声音入口 - 卡片样式 */}
      <button
        className="w-full max-w-[280px] mt-4 bg-white/70 backdrop-blur rounded-2xl p-4 border border-teal-200/50 hover:bg-white/90 hover:border-teal-300 transition-all text-left"
        onClick={() => navigate('/panic-voice-settings')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Mic className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-teal-800">
                {hasUserRecordings ? '管理我的录音' : '录制我的声音'}
              </p>
              <p className="text-xs text-teal-500/70">
                {hasUserRecordings 
                  ? `已录制 ${recordingCount}/32 条` 
                  : '用自己的声音陪伴自己'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-400" />
        </div>
      </button>
    </div>
  );
};

export default ModeSelector;

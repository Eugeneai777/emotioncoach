import React, { useEffect, useState } from "react";
import { Wind, Volume2, ChevronRight, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EmotionType } from "@/config/emotionReliefConfig";

type StartMode = 'cognitive' | 'breathing';
type VoiceSource = 'ai';

interface ModeSelectorProps {
  onSelectMode: (mode: StartMode, voiceSource: VoiceSource) => void;
  onNavigate?: (path: string) => void;
  emotionType?: EmotionType;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode, onNavigate, emotionType }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasVoices, setHasVoices] = useState(false);
  const [voiceCount, setVoiceCount] = useState(0);

  useEffect(() => {
    if (user) {
      checkVoices();
    }
  }, [user]);

  const checkVoices = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('user_voice_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!error && count && count > 0) {
      setHasVoices(true);
      setVoiceCount(count);
    }
  };

  // 使用传入的情绪类型或默认值
  const title = emotionType?.title || "你很安全";
  const subtitle = emotionType?.subtitle || "我在这里陪着你";
  const emoji = emotionType?.emoji || "🌿";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 overflow-y-auto">
      {/* 头部标题 */}
      <div className="text-5xl mb-6">{emoji}</div>
      <h2 className="text-2xl font-medium text-teal-800 text-center mb-2">
        {title}
      </h2>
      <p className="text-teal-600/70 text-center mb-8 max-w-xs">
        {subtitle}
      </p>
      
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
          onClick={() => onSelectMode('cognitive', 'ai')}
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
        onClick={() => onSelectMode('breathing', 'ai')}
      >
        <Wind className="w-4 h-4" />
        <span className="text-sm">先做呼吸引导</span>
      </button>

      {/* 语音设置入口 */}
      <button
        className="w-full max-w-[280px] mt-4 bg-white/70 backdrop-blur rounded-2xl p-4 border border-teal-200/50 hover:bg-white/90 hover:border-teal-300 transition-all text-left"
        onClick={() => onNavigate ? onNavigate('/panic-voice-settings') : navigate('/panic-voice-settings')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-teal-800">
                {hasVoices ? '语音设置' : 'AI 语音生成'}
              </p>
              <p className="text-xs text-teal-500/70">
                {hasVoices 
                  ? `已生成 ${voiceCount}/32 条语音` 
                  : '一键生成 32 条语音提醒'}
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

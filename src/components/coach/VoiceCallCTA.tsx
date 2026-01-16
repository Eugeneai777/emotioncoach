import { useState, useCallback } from 'react';
import { Phone } from 'lucide-react';
import { usePersonalizedGreeting } from '@/hooks/usePersonalizedGreeting';
import { Skeleton } from '@/components/ui/skeleton';
import { preheatTokenEndpoint, prewarmMicrophoneStream } from '@/utils/RealtimeAudio';

interface VoiceCallCTAProps {
  onVoiceChatClick: () => void;
}

export const VoiceCallCTA = ({ onVoiceChatClick }: VoiceCallCTAProps) => {
  const [isRippling, setIsRippling] = useState(false);
  const [hasUsedVoiceChat, setHasUsedVoiceChat] = useState(() => {
    return localStorage.getItem('hasUsedVoiceChat') === 'true';
  });
  const { greeting, isLoading } = usePersonalizedGreeting();

  // 🚀 P0: 预热 Edge Function 和麦克风流
  const handlePreheat = useCallback(() => {
    Promise.all([
      preheatTokenEndpoint('vibrant-life-realtime-token'),
      prewarmMicrophoneStream()
    ]).catch(console.warn);
  }, []);

  const handleClick = () => {
    // 触发涟漪动画
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
    
    // 标记已使用过语音对话
    if (!hasUsedVoiceChat) {
      localStorage.setItem('hasUsedVoiceChat', 'true');
      setHasUsedVoiceChat(true);
    }
    
    // 调用语音对话
    onVoiceChatClick();
  };

  return (
    <div className={`flex flex-col items-center justify-center animate-in fade-in-50 duration-500 ${
      hasUsedVoiceChat ? 'py-8 pb-6' : 'py-8'
    }`}>
      {/* 欢迎语 */}
      <div className="text-center mb-12 animate-in fade-in-50 duration-700">
        {isLoading ? (
          <Skeleton className="h-7 w-48 mx-auto" />
        ) : (
          <p className="text-lg text-foreground/80">{greeting}</p>
        )}
      </div>

      {/* 大圆形品牌按钮 */}
      <button
        onClick={handleClick}
        onMouseEnter={handlePreheat}
        onTouchStart={handlePreheat}
        className="relative group focus:outline-none"
        aria-label="开始有劲AI语音对话"
      >
        {/* 柔和光晕层 */}
        <div className="absolute inset-[-28px] rounded-full animate-[glow_3s_ease-in-out_infinite] bg-gradient-to-r from-rose-300/30 via-pink-300/20 to-rose-300/30" />
        
        {/* 外圈呼吸动画 */}
        <div className="absolute inset-[-20px] bg-gradient-to-r from-rose-400 to-pink-400 rounded-full animate-pulse opacity-30" />
        <div className="absolute inset-[-10px] bg-gradient-to-r from-rose-500 to-pink-500 rounded-full animate-ping opacity-20" 
             style={{ animationDuration: '2s' }} />
        
        {/* 涟漪动画层 */}
        {isRippling && (
          <>
            <div className="absolute inset-0 bg-white/40 rounded-full animate-[ripple_0.6s_ease-out]" />
            <div className="absolute inset-[-28px] border-2 border-white/60 rounded-full animate-[ripple-expand_0.6s_ease-out]" />
          </>
        )}
        
        {/* 主按钮 - 添加按下反馈动画 */}
        <div className="relative w-56 h-56 bg-gradient-to-br from-rose-500 via-rose-400 to-pink-500 
                        rounded-full flex flex-col items-center justify-center 
                        shadow-2xl shadow-rose-500/40 
                        hover:scale-105 hover:shadow-rose-500/50 
                        active:scale-95 active:shadow-lg active:shadow-rose-500/60
                        transition-all duration-200 ease-out
                        overflow-hidden
                        group-active:from-rose-600 group-active:via-rose-500 group-active:to-pink-600">
          
          {/* 电话图标 - 添加按下时的微动效果 */}
          <div className="mb-5 p-4 bg-white/20 rounded-full backdrop-blur-sm
                          group-hover:bg-white/25 group-active:bg-white/30
                          group-active:scale-95 transition-all duration-200">
            <Phone className="w-10 h-10 text-white group-active:scale-110 transition-transform duration-200" />
          </div>
          
          {/* 品牌文字 */}
          <span className="text-white font-bold text-2xl tracking-wide text-center">有劲AI</span>
          <span className="text-white/90 text-base mt-2 text-center max-w-[85%] px-2">生活教练</span>
        </div>
      </button>
      
      {/* 操作提示 - 仅首次显示，调整间距 */}
      {!hasUsedVoiceChat && (
        <p className="mt-10 text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
          点击开始对话
        </p>
      )}
    </div>
  );
};

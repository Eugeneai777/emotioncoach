import { useState, useCallback } from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePersonalizedGreeting } from '@/hooks/usePersonalizedGreeting';
import { Skeleton } from '@/components/ui/skeleton';
import { preheatTokenEndpoint, prewarmMicrophoneStream } from '@/utils/RealtimeAudio';

interface EmotionVoiceCallCTAProps {
  onVoiceChatClick: () => void;
}

export const EmotionVoiceCallCTA = ({
  onVoiceChatClick,
}: EmotionVoiceCallCTAProps) => {
  const [isRippling, setIsRippling] = useState(false);
  const [hasUsedVoiceChat, setHasUsedVoiceChat] = useState(() => {
    return localStorage.getItem('hasUsedEmotionVoiceChat') === 'true';
  });
  const {
    greeting,
    isLoading
  } = usePersonalizedGreeting();

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
      localStorage.setItem('hasUsedEmotionVoiceChat', 'true');
      setHasUsedVoiceChat(true);
    }

    // 调用语音对话
    onVoiceChatClick();
  };

  return (
    <div className={`flex flex-col items-center justify-center animate-in fade-in-50 duration-500 ${hasUsedVoiceChat ? 'py-8 pb-6' : 'py-8'}`}>
      {/* 欢迎语 */}
      <div className="text-center mb-12 animate-in fade-in-50 duration-700">
        {isLoading ? (
          <Skeleton className="h-7 w-48 mx-auto" />
        ) : (
          <p className="text-lg text-foreground font-medium drop-shadow-sm">{greeting}</p>
        )}
      </div>

      {/* 大圆形品牌按钮 - 翠绿色主题 */}
      <button 
        onClick={handleClick}
        onMouseEnter={handlePreheat}
        onTouchStart={handlePreheat}
        className="relative group focus:outline-none touch-manipulation" 
        aria-label="开始情绪教练语音对话"
      >
        {/* 柔和光晕层 - 降低饱和度 */}
        <div className="absolute inset-[-28px] rounded-full animate-[glow_3s_ease-in-out_infinite] bg-gradient-to-r from-emerald-300/20 via-green-300/15 to-emerald-300/20" />
        
        {/* 外圈呼吸动画 - 降低透明度 */}
        <div className="absolute inset-[-20px] bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse opacity-20" />
        <div className="absolute inset-[-10px] bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-ping opacity-15" style={{
          animationDuration: '2s'
        }} />
        
        {/* 涟漪动画层 */}
        {isRippling && (
          <>
            <div className="absolute inset-0 bg-white/40 rounded-full animate-[ripple_0.6s_ease-out]" />
            <div className="absolute inset-[-28px] border-2 border-white/60 rounded-full animate-[ripple-expand_0.6s_ease-out]" />
          </>
        )}
        
        {/* 主按钮 - 翠绿渐变 - 响应式尺寸 */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 bg-gradient-to-br from-emerald-500 via-emerald-400 to-green-500 
                        rounded-full flex flex-col items-center justify-center 
                        shadow-2xl shadow-emerald-500/40 
                        hover:scale-105 hover:shadow-emerald-500/50 
                        active:scale-95 active:shadow-lg active:shadow-emerald-500/60
                        transition-all duration-200 ease-out
                        group-active:from-emerald-600 group-active:via-emerald-500 group-active:to-green-600">
          
          {/* 电话图标 */}
          <div className="mb-3 sm:mb-5 p-3 sm:p-4 bg-white/25 rounded-full backdrop-blur-sm
                          group-hover:bg-white/30 group-active:bg-white/35
                          group-active:scale-95 transition-all duration-200">
            <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg group-active:scale-110 transition-transform duration-200" />
          </div>
          
          {/* 品牌文字 - 增强阴影和对比度 */}
          <span className="text-white font-bold text-xl sm:text-2xl tracking-wide drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>情绪教练</span>
          
        </div>
      </button>
      
      {/* 操作提示 - 增强可见性 */}
      {!hasUsedVoiceChat && (
        <p className="mt-10 text-sm text-foreground font-medium flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
          点击开始对话
        </p>
      )}

      {/* 扣费规则提示 - 仅首次显示 */}
      {!hasUsedVoiceChat && (
        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700/40 max-w-sm shadow-sm">
          <div className="text-sm text-emerald-800 dark:text-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Phone className="w-4 h-4" />
                语音对话
              </span>
              <span className="font-bold">8点/分钟</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between cursor-help">
                    <span className="flex items-center gap-2 font-medium">
                      <MessageSquare className="w-4 h-4" />
                      文字对话
                    </span>
                    <span className="font-bold">1点/次</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>生成简报后才扣费</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center font-medium">
            语音更自然流畅，文字更经济实惠
          </p>
        </div>
      )}
    </div>
  );
};

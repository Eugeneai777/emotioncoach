import { useState } from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { usePersonalizedGreeting } from '@/hooks/usePersonalizedGreeting';
import { Skeleton } from '@/components/ui/skeleton';
interface ParentVoiceCallCTAProps {
  onVoiceChatClick: () => void;
  hasCompletedIntake?: boolean;
}
export const ParentVoiceCallCTA = ({
  onVoiceChatClick,
  hasCompletedIntake
}: ParentVoiceCallCTAProps) => {
  const [isRippling, setIsRippling] = useState(false);
  const [hasUsedVoiceChat, setHasUsedVoiceChat] = useState(() => {
    return localStorage.getItem('hasUsedParentVoiceChat') === 'true';
  });
  const {
    greeting,
    isLoading
  } = usePersonalizedGreeting();
  const handleClick = () => {
    // 触发涟漪动画
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);

    // 标记已使用过语音对话
    if (!hasUsedVoiceChat) {
      localStorage.setItem('hasUsedParentVoiceChat', 'true');
      setHasUsedVoiceChat(true);
    }

    // 调用语音对话
    onVoiceChatClick();
  };
  return <div className={`flex flex-col items-center justify-center animate-in fade-in-50 duration-500 ${hasUsedVoiceChat ? 'py-8 pb-6' : 'py-8'}`}>
      {/* 欢迎语 */}
      <div className="text-center mb-12 animate-in fade-in-50 duration-700">
        {isLoading ? <Skeleton className="h-7 w-48 mx-auto" /> : <p className="text-lg text-foreground/80">{greeting}</p>}
      </div>

      {/* 大圆形品牌按钮 - 紫粉色主题 */}
      <button onClick={handleClick} className="relative group focus:outline-none" aria-label="开始亲子教练语音对话">
        {/* 柔和光晕层 */}
        <div className="absolute inset-[-28px] rounded-full animate-[glow_3s_ease-in-out_infinite] bg-gradient-to-r from-purple-300/30 via-pink-300/20 to-purple-300/30" />
        
        {/* 外圈呼吸动画 */}
        <div className="absolute inset-[-20px] bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse opacity-30" />
        <div className="absolute inset-[-10px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-20" style={{
        animationDuration: '2s'
      }} />
        
        {/* 涟漪动画层 */}
        {isRippling && <>
            <div className="absolute inset-0 bg-white/40 rounded-full animate-[ripple_0.6s_ease-out]" />
            <div className="absolute inset-[-28px] border-2 border-white/60 rounded-full animate-[ripple-expand_0.6s_ease-out]" />
          </>}
        
        {/* 主按钮 - 紫粉渐变 - 响应式尺寸 */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 bg-gradient-to-br from-purple-500 via-purple-400 to-pink-500 
                        rounded-full flex flex-col items-center justify-center 
                        shadow-2xl shadow-purple-500/40 
                        hover:scale-105 hover:shadow-purple-500/50 
                        active:scale-95 active:shadow-lg active:shadow-purple-500/60
                        transition-all duration-200 ease-out
                        group-active:from-purple-600 group-active:via-purple-500 group-active:to-pink-600">
          
          {/* 电话图标 */}
          <div className="mb-3 sm:mb-5 p-3 sm:p-4 bg-white/20 rounded-full backdrop-blur-sm
                          group-hover:bg-white/25 group-active:bg-white/30
                          group-active:scale-95 transition-all duration-200">
            <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white group-active:scale-110 transition-transform duration-200" />
          </div>
          
          {/* 品牌文字 */}
          <span className="text-white font-bold text-xl sm:text-2xl tracking-wide">亲子教练</span>
          
        </div>
      </button>
      
      {/* 模式提示 */}
      {hasCompletedIntake && <p className="mt-8 text-sm text-purple-600 bg-purple-50 px-4 py-2 rounded-full">
          ✨ 已根据问卷定制专属对话
        </p>}
      
      {/* 操作提示 - 仅首次显示 */}
      {!hasUsedVoiceChat && <p className="mt-10 text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          点击开始对话
        </p>}

      {/* 扣费规则提示 */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30 max-w-sm">
        <div className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              语音对话
            </span>
            <span className="font-semibold">8点/分钟</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              文字对话
            </span>
            <span className="font-semibold">1点/次</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          语音更自然流畅，文字更经济实惠
        </p>
      </div>
    </div>;
};
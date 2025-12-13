import { useState } from 'react';
import { Phone } from 'lucide-react';

interface VoiceCallCTAProps {
  onVoiceChatClick: () => void;
}

export const VoiceCallCTA = ({ onVoiceChatClick }: VoiceCallCTAProps) => {
  const [isRippling, setIsRippling] = useState(false);

  const handleClick = () => {
    // 触发涟漪动画
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
    
    // 调用语音对话
    onVoiceChatClick();
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 animate-in fade-in-50 duration-500">
      {/* 大圆形品牌按钮 */}
      <button
        onClick={handleClick}
        className="relative group focus:outline-none"
        aria-label="开始有劲AI语音对话"
      >
        {/* 外圈呼吸动画 */}
        <div className="absolute inset-[-12px] bg-gradient-to-r from-rose-400 to-pink-400 rounded-full animate-pulse opacity-30" />
        <div className="absolute inset-[-6px] bg-gradient-to-r from-rose-500 to-pink-500 rounded-full animate-ping opacity-20" 
             style={{ animationDuration: '2s' }} />
        
        {/* 涟漪动画层 */}
        {isRippling && (
          <>
            <div className="absolute inset-0 bg-white/40 rounded-full animate-[ripple_0.6s_ease-out]" />
            <div className="absolute inset-[-20px] border-2 border-white/60 rounded-full animate-[ripple-expand_0.6s_ease-out]" />
          </>
        )}
        
        {/* 主按钮 */}
        <div className="relative w-44 h-44 bg-gradient-to-br from-rose-500 via-rose-400 to-pink-500 
                        rounded-full flex flex-col items-center justify-center 
                        shadow-2xl shadow-rose-500/40 
                        hover:scale-105 hover:shadow-rose-500/50 
                        active:scale-95
                        transition-all duration-300">
          
          {/* 电话图标 */}
          <div className="mb-2 p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Phone className="w-8 h-8 text-white" />
          </div>
          
          {/* 品牌文字 - 在按钮内部 */}
          <span className="text-white font-bold text-xl tracking-wide">有劲AI</span>
          <span className="text-white/90 text-sm mt-0.5">每个人的生活教练</span>
          
          {/* 操作提示 */}
          <span className="text-white/70 text-xs mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
            点击开始对话
          </span>
        </div>
      </button>
    </div>
  );
};

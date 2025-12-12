import React from "react";
import { EmotionType } from "@/config/emotionReliefConfig";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmotionIcon } from "@/components/icons/emotions";

interface EmotionReliefButtonProps {
  emotion: EmotionType;
  onClick: () => void;
  animationDelay?: number;
}

const EmotionReliefButton: React.FC<EmotionReliefButtonProps> = ({ 
  emotion, 
  onClick,
  animationDelay = 0 
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`
            relative h-20 w-full rounded-2xl overflow-hidden
            bg-gradient-to-br ${emotion.gradient}
            text-white
            shadow-[0_4px_0_0_rgba(0,0,0,0.15),0_6px_16px_-4px_rgba(0,0,0,0.2)]
            hover:-translate-y-1 hover:shadow-[0_6px_0_0_rgba(0,0,0,0.15),0_12px_24px_-6px_rgba(0,0,0,0.25)]
            active:translate-y-1 active:shadow-[0_1px_0_0_rgba(0,0,0,0.15),0_2px_4px_-2px_rgba(0,0,0,0.1)]
            transition-all duration-200 ease-out
            flex flex-col items-center justify-center gap-1
            group cursor-pointer
            animate-bounce-in opacity-0
          `}
          style={{ animationDelay: `${animationDelay}ms` }}
        >
          {/* 光晕脉冲背景 */}
          <div className="absolute inset-0 bg-white/20 rounded-full scale-50 animate-glow-pulse pointer-events-none" />
          
          {/* 顶部高光效果 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none" />
          
          {/* 左侧光泽 */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent pointer-events-none" />
          
          {/* SVG图标 - 呼吸动画 + 悬停摇摆 */}
          <div className="relative z-10 animate-emoji-breathe group-hover:animate-wiggle drop-shadow-md">
            <EmotionIcon type={emotion.id} className="w-10 h-10" />
          </div>
          
          {/* 标题 */}
          <span className="font-semibold text-sm tracking-wide drop-shadow-sm relative z-10">
            {emotion.title}
          </span>
          
          {/* 底部渐变边框效果 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px] text-center bg-card/95 backdrop-blur">
        <p className="text-xs text-muted-foreground">{emotion.subtitle}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default EmotionReliefButton;

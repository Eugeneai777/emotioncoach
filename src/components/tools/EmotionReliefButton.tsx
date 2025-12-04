import React from "react";
import { EmotionType } from "@/config/emotionReliefConfig";

interface EmotionReliefButtonProps {
  emotion: EmotionType;
  onClick: () => void;
}

const EmotionReliefButton: React.FC<EmotionReliefButtonProps> = ({ emotion, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-2xl bg-white/60 backdrop-blur-sm border-2 border-transparent
        hover:border-white hover:shadow-lg hover:scale-[1.02] 
        active:scale-[0.98] transition-all duration-200
        flex flex-col items-center text-center group overflow-hidden
      `}
    >
      {/* 背景渐变 hover 效果 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${emotion.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      {/* Emoji */}
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
        {emotion.emoji}
      </div>
      
      {/* 标题 */}
      <h3 className="font-semibold text-slate-700 mb-1">
        {emotion.title}
      </h3>
      
      {/* 副标题 - 截断显示 */}
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
        {emotion.subtitle}
      </p>
    </button>
  );
};

export default EmotionReliefButton;

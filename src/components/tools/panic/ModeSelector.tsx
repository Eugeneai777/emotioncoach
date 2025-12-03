import React from "react";
import { Brain, Wind } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type StartMode = 'cognitive' | 'breathing';

interface ModeSelectorProps {
  onSelectMode: (mode: StartMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
      {/* 头部标题 */}
      <div className="text-5xl mb-6">🌿</div>
      <h2 className="text-2xl font-medium text-teal-800 text-center mb-2">
        你很安全
      </h2>
      <p className="text-teal-600/70 text-center mb-12 max-w-xs">
        我在这里陪着你
      </p>
      
      {/* 马上帮我 - 圆形按钮 */}
      <div className="relative mb-10">
        {/* 双层呼吸光晕 */}
        <div className="absolute inset-0 w-28 h-28 rounded-full bg-teal-300/20 blur-xl animate-breathe" />
        <div className="absolute inset-0 w-28 h-28 rounded-full bg-cyan-300/25 blur-lg animate-breathe-delayed" />
        
        {/* 主按钮 */}
        <button
          className="relative w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 shadow-2xl shadow-teal-500/30 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95"
          onClick={() => onSelectMode('cognitive')}
        >
          <Brain className="w-8 h-8 text-white" />
          <span className="text-white font-medium text-sm">马上帮我</span>
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
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 transition-colors"
        onClick={() => onSelectMode('breathing')}
      >
        <Wind className="w-4 h-4" />
        <span className="text-sm">先做呼吸引导</span>
      </button>
    </div>
  );
};

export default ModeSelector;

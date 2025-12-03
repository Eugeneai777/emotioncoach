import React from "react";
import { Button } from "@/components/ui/button";
import { Brain, Wind } from "lucide-react";

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
        选择你想要的方式，我在这里陪着你
      </p>
      
      {/* 模式选择卡片 */}
      <div className="w-full max-w-sm space-y-4">
        {/* 马上帮我 - 实心按钮样式 */}
        <Button
          className="w-full h-auto py-6 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/25 flex flex-col items-start gap-2 transition-all"
          onClick={() => onSelectMode('cognitive')}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="text-lg font-medium text-white">马上帮我</div>
              <div className="text-sm text-white/80">用温暖的话语陪伴你</div>
            </div>
          </div>
        </Button>
        
        {/* 先做呼吸引导 - outline样式 */}
        <Button
          variant="outline"
          className="w-full h-auto py-6 px-6 rounded-2xl border-2 border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50/50 flex flex-col items-start gap-2 transition-all"
          onClick={() => onSelectMode('breathing')}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="text-lg font-medium text-teal-800">先做呼吸引导</div>
              <div className="text-sm text-teal-600/70">3轮呼吸后再继续</div>
            </div>
          </div>
        </Button>
      </div>
      
      <p className="mt-8 text-teal-500/50 text-xs">
        点击任一选项开始
      </p>
    </div>
  );
};

export default ModeSelector;

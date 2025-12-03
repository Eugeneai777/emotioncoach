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
        <Button
          variant="outline"
          className="w-full h-auto py-6 px-6 rounded-2xl border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50/50 flex flex-col items-start gap-2 transition-all"
          onClick={() => onSelectMode('cognitive')}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="text-lg font-medium text-teal-800">认知疏解</div>
              <div className="text-sm text-teal-600/70">用温暖的话语陪伴你</div>
            </div>
          </div>
        </Button>
        
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
              <div className="text-lg font-medium text-teal-800">呼吸引导</div>
              <div className="text-sm text-teal-600/70">先做3轮呼吸再继续</div>
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

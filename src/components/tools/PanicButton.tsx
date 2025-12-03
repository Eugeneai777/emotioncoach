import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Heart } from "lucide-react";
import PanicReliefFlow from "./PanicReliefFlow";

const PanicButton: React.FC = () => {
  const [showFlow, setShowFlow] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [pressProgress, setPressProgress] = useState(0);

  const handlePressStart = () => {
    setIsPressed(true);
    setPressProgress(0);
    
    // 长按计时器
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 1500) * 100, 100); // 1.5秒激活
      setPressProgress(progress);
      
      if (elapsed >= 1500) {
        clearInterval(timer);
        setShowFlow(true);
        setIsPressed(false);
        setPressProgress(0);
      }
    }, 50);
    
    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearInterval(pressTimer);
      setPressTimer(null);
    }
    setIsPressed(false);
    setPressProgress(0);
  };

  if (showFlow) {
    return <PanicReliefFlow onClose={() => setShowFlow(false)} />;
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-orange-50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-slate-700 flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          恐慌急救
        </CardTitle>
        <CardDescription className="text-slate-500">
          当你感到恐慌或焦虑时，长按下方按钮获得即时帮助
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-8">
        {/* 恐慌按钮 */}
        <div className="relative mb-6">
          {/* 进度环 */}
          <svg 
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-rose-200"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-rose-500 transition-all duration-100"
              strokeDasharray={`${pressProgress * 2.89} 289`}
            />
          </svg>
          
          {/* 按钮主体 */}
          <button
            className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 
              shadow-lg flex items-center justify-center transition-all duration-200
              ${isPressed ? 'scale-95 shadow-md' : 'hover:scale-105 hover:shadow-xl'}
              active:scale-95`}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
          >
            <Heart 
              className={`w-12 h-12 text-white transition-transform duration-200
                ${isPressed ? 'scale-90' : ''}`}
              fill="white"
            />
          </button>
        </div>
        
        <p className="text-sm text-slate-500 text-center">
          {isPressed ? '继续按住...' : '长按 1.5 秒激活'}
        </p>
        
        {/* 快速入口 */}
        <div className="mt-6 w-full space-y-2">
          <Button
            variant="ghost"
            className="w-full text-slate-600 hover:bg-rose-100"
            onClick={() => setShowFlow(true)}
          >
            直接进入（跳过长按）
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanicButton;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Hand, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PanicReliefFlow from "./PanicReliefFlow";

const PanicButton: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFlow, setShowFlow] = useState(false);

  if (showFlow) {
    return <PanicReliefFlow onClose={() => setShowFlow(false)} />;
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      {/* 背景装饰光晕 */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="text-center pb-2 relative z-10">
        <CardTitle className="text-xl text-slate-700 flex items-center justify-center gap-2">
          <Shield className="w-5 h-5 text-teal-500" />
          恐慌按钮
        </CardTitle>
        <CardDescription className="text-slate-500">
          感到不安时，这里是你的安全港湾 🌊
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-8 relative z-10">
        {/* 恐慌按钮 - 带呼吸动画 */}
        <div className="relative mb-6">
          {/* 外层呼吸光晕 */}
          <div className="absolute inset-[-16px] animate-breathe">
            <div className="w-full h-full rounded-full bg-teal-300/20 blur-xl" />
          </div>
          {/* 内层呼吸光晕 */}
          <div className="absolute inset-[-8px] animate-breathe-delayed">
            <div className="w-full h-full rounded-full bg-cyan-300/25 blur-lg" />
          </div>
          
          <button
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 
              shadow-lg shadow-teal-200/50 flex items-center justify-center transition-all duration-200
              hover:scale-105 hover:shadow-xl hover:shadow-teal-300/50 active:scale-95"
            onClick={() => setShowFlow(true)}
          >
            <Hand 
              className="w-12 h-12 text-white"
              strokeWidth={1.5}
            />
          </button>
        </div>
        
        <p className="text-sm text-teal-600/70 text-center mb-6">
          跟随呼吸，轻点开始
        </p>
        
        {/* 快速入口 */}
        <div className="w-full space-y-3">
          {user && (
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl border-2 border-teal-200 
                bg-white/70 backdrop-blur-sm hover:bg-teal-50 
                text-teal-700 shadow-sm gap-2"
              onClick={() => navigate('/panic-history')}
            >
              <History className="w-4 h-4" />
              查看历史记录
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PanicButton;

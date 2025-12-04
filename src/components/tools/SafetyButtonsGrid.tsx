import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shield, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { emotionTypes, EmotionType } from "@/config/emotionReliefConfig";
import EmotionReliefButton from "./EmotionReliefButton";
import EmotionReliefFlow from "./EmotionReliefFlow";

const SafetyButtonsGrid: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeEmotion, setActiveEmotion] = useState<EmotionType | null>(null);

  // 如果选中了某个情绪，显示流程
  if (activeEmotion) {
    return (
      <EmotionReliefFlow 
        emotionType={activeEmotion} 
        onClose={() => setActiveEmotion(null)} 
      />
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      {/* 背景装饰光晕 */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="text-center pb-3 relative z-10">
        <CardTitle className="text-lg text-slate-700 flex items-center justify-center gap-2">
          <Shield className="w-5 h-5 text-teal-500" />
          平安按钮
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm">
          感到不安时，选择你最需要的陪伴 🌊
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-3 pt-0">
        {/* 9按钮网格 */}
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-3 gap-2">
            {emotionTypes.map((emotion) => (
              <EmotionReliefButton
                key={emotion.id}
                emotion={emotion}
                onClick={() => setActiveEmotion(emotion)}
              />
            ))}
          </div>
        </TooltipProvider>
        
        {/* 历史记录入口 */}
        {user && (
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl border-2 border-teal-200 
              bg-white/70 backdrop-blur-sm hover:bg-teal-50 
              text-teal-700 shadow-sm gap-2 text-sm"
            onClick={() => navigate('/panic-history')}
          >
            <History className="w-4 h-4" />
            查看历史记录
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SafetyButtonsGrid;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shield, History, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { emotionTypes, EmotionType } from "@/config/emotionReliefConfig";
import EmotionReliefButton from "./EmotionReliefButton";
import EmotionReliefFlow from "./EmotionReliefFlow";
const SafetyButtonsGrid: React.FC = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [activeEmotion, setActiveEmotion] = useState<EmotionType | null>(null);

  // 如果选中了某个情绪，显示流程
  if (activeEmotion) {
    return <EmotionReliefFlow emotionType={activeEmotion} onClose={() => setActiveEmotion(null)} />;
  }
  return <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      {/* 背景装饰光晕 */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-200/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-200/30 rounded-full blur-2xl pointer-events-none" />
      
      <CardHeader className="text-center pb-2 pt-3 sm:pt-4 relative z-10 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg text-slate-700 flex items-center justify-center gap-1.5">
          情绪🆘按钮
          <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs text-teal-600 hover:text-teal-700 h-5 sm:h-6 px-1.5 sm:px-2" onClick={() => navigate('/emotion-button-intro')}>
            了解更多
          </Button>
        </CardTitle>
        <CardDescription className="text-slate-500 text-xs sm:text-sm">
          感到不安时，选择你最需要的陪伴 🌊
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-2 sm:space-y-3 pt-0 px-2 sm:px-4 pb-3 sm:pb-4">
        {/* 9按钮网格 */}
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {emotionTypes.map((emotion, index) => <EmotionReliefButton key={emotion.id} emotion={emotion} onClick={() => setActiveEmotion(emotion)} animationDelay={index * 60} />)}
          </div>
        </TooltipProvider>
        
        {/* 引导文案 */}
        <p className="text-center text-[10px] sm:text-xs text-slate-500 py-1.5 sm:py-2 border-t border-teal-100/50">
          🌿 按钮是即时的陪伴，教练是深入的梳理
        </p>
        
        {/* 底部按钮区域 */}
        {user ? <div className="space-y-1.5 sm:space-y-2">
            {/* 第一行：情绪教练 + 感恩教练 */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <Button className="h-8 sm:h-9 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 
                  text-white shadow-sm hover:shadow-md transition-all gap-1 text-xs sm:text-sm" onClick={() => navigate('/')}>
                <Heart className="w-3.5 h-3.5" />
                情绪教练
              </Button>
              <Button className="h-8 sm:h-9 rounded-lg bg-gradient-to-r from-pink-400 to-rose-400 
                  text-white shadow-sm hover:shadow-md transition-all gap-1 text-xs sm:text-sm" onClick={() => navigate('/gratitude-journal')}>
                💖 感恩教练
              </Button>
            </div>
            
            {/* 第二行：历史记录 */}
            <Button variant="outline" className="w-full h-7 sm:h-8 rounded-lg border border-teal-200 
                bg-white/70 backdrop-blur-sm hover:bg-teal-50 
                text-teal-700 shadow-sm gap-1 text-[10px] sm:text-xs" onClick={() => navigate('/panic-history')}>
              <History className="w-3 h-3" />
              历史记录
            </Button>
          </div> : <Button className="w-full h-8 sm:h-9 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 
              text-white shadow-sm hover:shadow-md transition-all gap-1 text-xs sm:text-sm" onClick={() => navigate('/')}>
            <Heart className="w-3.5 h-3.5" />
            开始情绪梳理
          </Button>}
      </CardContent>
    </Card>;
};
export default SafetyButtonsGrid;
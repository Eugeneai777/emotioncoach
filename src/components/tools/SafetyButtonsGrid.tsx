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
  return <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      {/* 背景装饰光晕 */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="text-center pb-3 relative z-10">
        <CardTitle className="text-lg text-slate-700 flex items-center justify-center gap-2">
          <Shield className="w-5 h-5 text-teal-500" />
          情绪🆘按钮
          <Button variant="ghost" size="sm" className="text-xs text-teal-600 hover:text-teal-700 h-6 px-2" onClick={() => navigate('/emotion-button-intro')}>
            
            了解更多
          </Button>
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm">
          感到不安时，选择你最需要的陪伴 🌊
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-3 pt-0">
        {/* 9按钮网格 */}
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {emotionTypes.map((emotion, index) => <EmotionReliefButton key={emotion.id} emotion={emotion} onClick={() => setActiveEmotion(emotion)} animationDelay={index * 60} />)}
          </div>
        </TooltipProvider>
        
        {/* 引导文案 */}
        <p className="text-center text-xs text-slate-500 py-2 border-t border-teal-100/50">
          🌿 按钮是即时的陪伴，教练是深入的梳理
        </p>
        
        {/* 底部按钮区域 */}
        {user ? <div className="space-y-2">
            {/* 第一行：情绪教练 + 感恩教练 */}
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 
                  text-white shadow-sm hover:shadow-md transition-all gap-1.5 text-sm" onClick={() => navigate('/')}>
                <Heart className="w-4 h-4" />
                情绪教练
              </Button>
              <Button className="h-10 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 
                  text-white shadow-sm hover:shadow-md transition-all gap-1.5 text-sm" onClick={() => navigate('/gratitude-journal')}>
                💖 感恩教练
              </Button>
            </div>
            
            {/* 第二行：历史记录 */}
            <Button variant="outline" className="w-full h-9 rounded-xl border-2 border-teal-200 
                bg-white/70 backdrop-blur-sm hover:bg-teal-50 
                text-teal-700 shadow-sm gap-1.5 text-xs" onClick={() => navigate('/panic-history')}>
              <History className="w-3.5 h-3.5" />
              历史记录
            </Button>
          </div> : <Button className="w-full h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 
              text-white shadow-sm hover:shadow-md transition-all gap-1.5 text-sm" onClick={() => navigate('/')}>
            <Heart className="w-4 h-4" />
            开始情绪梳理
          </Button>}
      </CardContent>
    </Card>;
};
export default SafetyButtonsGrid;
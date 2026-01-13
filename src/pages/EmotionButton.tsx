import React, { useState } from "react";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, Info, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { emotionTypes, EmotionType } from "@/config/emotionReliefConfig";
import EmotionReliefFlow from "@/components/tools/EmotionReliefFlow";
import { useAuth } from "@/hooks/useAuth";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";

const EmotionButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showTour, completeTour } = usePageTour('emotion_button');
  const [activeEmotion, setActiveEmotion] = useState<EmotionType | null>(null);

  if (activeEmotion) {
    return (
      <EmotionReliefFlow
        emotionType={activeEmotion}
        onClose={() => setActiveEmotion(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <DynamicOGMeta pageKey="emotionButton" />
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-cyan-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-teal-700" />
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/emotion-button-intro")}
            className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
          >
            <Info className="w-5 h-5 text-teal-700" />
          </button>
          {user && (
            <button
              onClick={() => navigate("/panic-history")}
              className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
            >
              <History className="w-5 h-5 text-teal-700" />
            </button>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 px-4 sm:px-6 pb-8">
        {/* 标题区 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-2 flex items-center justify-center gap-1.5">
            情绪🆘按钮
          </h1>
          <p className="text-teal-600/80 text-sm sm:text-base">
            选择你现在的感受，让我陪伴你
          </p>
        </div>

        {/* 9按钮网格 - 沉浸式大按钮 */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto">
          {emotionTypes.map((emotion, index) => (
            <button
              key={emotion.id}
              onClick={() => setActiveEmotion(emotion)}
              className={`
                relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden
                bg-gradient-to-br ${emotion.gradient}
                text-white
                shadow-lg hover:shadow-xl
                hover:-translate-y-1 hover:scale-105
                active:translate-y-0 active:scale-100
                transition-all duration-200 ease-out
                flex flex-col items-center justify-center gap-1 sm:gap-2
                group cursor-pointer
                animate-bounce-in opacity-0
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* 顶部高光效果 */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none" />
              
              {/* 光晕脉冲背景 */}
              <div className="absolute inset-0 bg-white/20 rounded-full scale-50 animate-glow-pulse pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Emoji图标 */}
              <span className="text-3xl sm:text-4xl md:text-5xl drop-shadow-md relative z-10 animate-emoji-breathe group-hover:animate-wiggle">
                {emotion.emoji}
              </span>
              
              {/* 标题 */}
              <span className="font-bold text-sm sm:text-base md:text-lg tracking-wide drop-shadow-sm relative z-10">
                {emotion.title}
              </span>
              
              {/* 副标题 - 仅在较大屏幕显示 */}
              <span className="hidden sm:block text-[10px] sm:text-xs text-white/80 drop-shadow-sm relative z-10 px-2 text-center leading-tight">
                {emotion.subtitle}
              </span>
              
              {/* 底部渐变边框效果 */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20" />
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 sm:mt-10 text-center">
          <p className="text-teal-600/70 text-xs sm:text-sm mb-4">
            🌿 不管现在多难，这股感觉会过去的。我在这里陪你。
          </p>
          
          {/* 快捷入口 */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-sm text-teal-700 bg-white/60 backdrop-blur-sm rounded-full hover:bg-white/80 transition-colors"
            >
              情绪教练
            </button>
            <button
              onClick={() => navigate("/energy-studio")}
              className="px-4 py-2 text-sm text-teal-700 bg-white/60 backdrop-blur-sm rounded-full hover:bg-white/80 transition-colors"
            >
              有劲生活馆
            </button>
          </div>
        </div>
      </div>
      <PageTour open={showTour} onComplete={completeTour} steps={pageTourConfig.emotion_button} pageTitle="情绪SOS按钮" />
    </div>
  );
};

export default EmotionButton;

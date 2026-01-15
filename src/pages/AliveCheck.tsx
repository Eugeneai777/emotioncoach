import React from "react";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AliveCheck as AliveCheckComponent } from "@/components/tools/AliveCheck";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";

const AliveCheck = () => {
  const navigate = useNavigate();
  const { showTour, completeTour } = usePageTour('alive_check');

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
      <DynamicOGMeta pageKey="aliveCheck" />
      
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-fuchsia-200/20 rounded-full blur-3xl" />
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-rose-700" />
        </button>
        
        <h1 className="text-lg font-bold text-rose-800 flex items-center gap-1.5">
          💗 死了吗
        </h1>
        
        <button
          onClick={() => navigate("/energy-studio-intro")}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <Info className="w-5 h-5 text-rose-700" />
        </button>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 px-4 sm:px-6 pb-8">
        <AliveCheckComponent />
      </div>

      <PageTour 
        open={showTour} 
        onComplete={completeTour} 
        steps={pageTourConfig.alive_check || []} 
        pageTitle="死了吗" 
      />
    </div>
  );
};

export default AliveCheck;

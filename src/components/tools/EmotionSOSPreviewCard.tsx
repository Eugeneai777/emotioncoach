import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { MobileCard } from "@/components/ui/mobile-card";

const EmotionSOSPreviewCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MobileCard 
      interactive 
      onClick={() => navigate('/emotion-button')}
      className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 border-teal-100/50"
    >
      <div className="flex items-center gap-3">
        {/* 左侧：3个热门情绪emoji叠放 */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <span className="absolute top-0 left-0 text-xl drop-shadow-sm">😰</span>
          <span className="absolute top-1 left-4 text-xl drop-shadow-sm">😟</span>
          <span className="absolute top-3 left-2 text-xl drop-shadow-sm">😤</span>
        </div>
        
        {/* 中间：标题和描述 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-teal-800 flex items-center gap-1">
            情绪🆘按钮
          </h3>
          <p className="text-xs text-teal-600/80 mt-0.5">
            9种情绪急救，即时陪伴
          </p>
        </div>
        
        {/* 右侧箭头 */}
        <ChevronRight className="w-5 h-5 text-teal-500 flex-shrink-0" />
      </div>
    </MobileCard>
  );
};

export default EmotionSOSPreviewCard;

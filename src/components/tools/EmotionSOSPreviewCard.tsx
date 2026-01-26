import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ChevronRight } from "lucide-react";
import { MobileCard } from "@/components/ui/mobile-card";

const EmotionSOSPreviewCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MobileCard 
      interactive 
      onClick={() => navigate('/emotion-button')}
    >
      <div className="flex items-center gap-3">
        {/* 左侧图标 - 与其他工具卡片保持一致 */}
        <div className="p-2 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
          <Heart className="w-5 h-5" />
        </div>
        
        {/* 中间：标题和描述 */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">情绪🆘按钮</span>
          <p className="text-xs text-muted-foreground line-clamp-1">
            9种情绪急救，即时陪伴
          </p>
        </div>
        
        {/* 右侧箭头 */}
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </MobileCard>
  );
};

export default EmotionSOSPreviewCard;

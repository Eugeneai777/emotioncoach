import React from "react";
import { Heart, Phone, MapPin, User } from "lucide-react";

export const MarriageFooter: React.FC = () => {
  return (
    <footer className="px-5 py-6 pb-24 bg-white border-t border-marriage-border">
      <div className="max-w-lg mx-auto text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Heart className="h-4 w-4 text-marriage-primary" />
          <span className="text-sm font-semibold text-foreground">婚因有道</span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          婚姻全生命周期服务生态平台
        </p>
        <div className="space-y-1.5 text-[10px] text-muted-foreground">
          <div className="flex items-center justify-center gap-1">
            <User className="h-3 w-3" />
            <span>联系人：有有</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Phone className="h-3 w-3" />
            <span>17722451217</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>深圳南山海岸城东座A区1503</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

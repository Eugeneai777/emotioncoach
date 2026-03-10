import React from "react";
import { Heart } from "lucide-react";

export const MarriageFooter: React.FC = () => {
  return (
    <footer className="px-5 py-6 pb-24 bg-white border-t border-marriage-border">
      <div className="max-w-lg mx-auto text-center">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Heart className="h-4 w-4 text-marriage-primary" />
          <span className="text-sm font-semibold text-foreground">婚因有道</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          深耕婚姻家庭服务20年 · 专业可信赖
        </p>
      </div>
    </footer>
  );
};

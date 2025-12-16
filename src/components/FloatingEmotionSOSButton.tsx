import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const FloatingEmotionSOSButton = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-24 left-4 z-40">
      {/* Tooltip on hover */}
      <div
        className={cn(
          "absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap",
          "bg-white/95 backdrop-blur-sm shadow-lg rounded-full px-4 py-2",
          "text-sm font-medium text-slate-700 border border-slate-100",
          "transition-all duration-300",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
        )}
      >
        需要即时缓解？
      </div>

      {/* Main button - gentle teal style */}
      <button
        onClick={() => navigate("/emotion-button")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative w-12 h-12 rounded-full",
          "bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-500",
          "shadow-md shadow-teal-500/20",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "hover:scale-105 hover:shadow-lg hover:shadow-teal-500/30",
          "active:scale-95"
        )}
      >
        {/* Soft breathing glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 animate-breathe opacity-40" />
        
        {/* Icon */}
        <span className="relative z-10 text-xl">🆘</span>
      </button>
    </div>
  );
};

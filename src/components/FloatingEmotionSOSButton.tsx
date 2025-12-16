import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const FloatingEmotionSOSButton = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-28 right-4 z-40">
      {/* Tooltip on hover */}
      <div
        className={cn(
          "absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap",
          "bg-white/95 backdrop-blur-sm shadow-lg rounded-full px-4 py-2",
          "text-sm font-medium text-slate-700 border border-slate-100",
          "transition-all duration-300",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        )}
      >
        需要即时缓解？
      </div>

      {/* Main button */}
      <button
        onClick={() => navigate("/emotion-button")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative w-14 h-14 rounded-full",
          "bg-gradient-to-br from-orange-400 via-rose-500 to-red-500",
          "shadow-lg shadow-rose-500/30",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-xl hover:shadow-rose-500/40",
          "active:scale-95",
          "group"
        )}
      >
        {/* Pulse animation rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 animate-ping opacity-30" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 animate-pulse opacity-20" />
        
        {/* SOS Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* Emergency emoji */}
          <span className="text-xl mb-0.5">🆘</span>
          
          {/* SOS text */}
          <span className={cn(
            "text-[9px] font-black tracking-wider text-white",
            "drop-shadow-sm"
          )}>
            SOS
          </span>
        </div>

        {/* Glow effect on hover */}
        <div className={cn(
          "absolute inset-0 rounded-full",
          "bg-gradient-to-br from-orange-400/0 via-rose-400/0 to-pink-400/0",
          "transition-all duration-300",
          isHovered && "from-orange-400/20 via-rose-400/20 to-pink-400/20"
        )} />
      </button>

      {/* Corner badge */}
      <div className={cn(
        "absolute -top-1 -right-1 w-5 h-5 rounded-full",
        "bg-gradient-to-r from-orange-500 to-rose-500",
        "flex items-center justify-center",
        "text-[8px] font-bold text-white",
        "shadow-md shadow-orange-500/30",
        "animate-bounce",
        "border-2 border-white"
      )}>
        🆘
      </div>
    </div>
  );
};

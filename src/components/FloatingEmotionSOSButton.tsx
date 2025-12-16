import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const FloatingEmotionSOSButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/emotion-button")}
      className={cn(
        "fixed bottom-24 right-4 z-40",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-500",
        "shadow-lg shadow-teal-500/30",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:scale-105 active:scale-95",
        "animate-fade-in"
      )}
      aria-label="情绪急救"
    >
      <span className="text-xl">🆘</span>
    </button>
  );
};

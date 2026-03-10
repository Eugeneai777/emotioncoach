import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const MarriageBackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed top-3 left-3 z-50 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-marriage-border shadow-sm flex items-center justify-center text-foreground active:scale-95 transition-transform"
      aria-label="返回"
    >
      <ArrowLeft className="h-4.5 w-4.5" />
    </button>
  );
};

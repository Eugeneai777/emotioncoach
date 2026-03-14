import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const EmotionSOSPreviewCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate('/emotion-button')}
      className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-left shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-white">情绪🆘按钮</span>
          <p className="text-xs text-white/80 mt-0.5">
            9种情绪急救，即时陪伴
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
      </div>
    </motion.button>
  );
};

export default EmotionSOSPreviewCard;

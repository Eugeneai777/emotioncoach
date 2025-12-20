import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const AwakeningEntryCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full"
    >
      <button
        onClick={() => navigate('/awakening')}
        className="w-full relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-base">觉醒入口</h3>
              <p className="text-xs text-white/80">6种生命提问，1次轻记录</p>
            </div>
          </div>
          <div className="text-2xl">→</div>
        </div>
      </button>
    </motion.div>
  );
};

export default AwakeningEntryCTA;

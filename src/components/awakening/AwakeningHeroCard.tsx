import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const AwakeningHeroCard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
      className="text-center space-y-1 motion-fallback"
    >
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
          频繁记录自己，可以改命
        </h2>
        <Sparkles className="h-5 w-5 text-amber-500" />
      </div>
      <p className="text-sm text-muted-foreground">
        这不是玄学，是神经科学
      </p>
    </motion.div>
  );
};

export default AwakeningHeroCard;

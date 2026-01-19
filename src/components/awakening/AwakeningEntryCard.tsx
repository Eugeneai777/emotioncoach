import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AwakeningDimension } from "@/config/awakeningConfig";

interface AwakeningEntryCardProps {
  dimension: AwakeningDimension;
  onClick: () => void;
  index: number;
}

const AwakeningEntryCard: React.FC<AwakeningEntryCardProps> = ({
  dimension,
  onClick,
  index
}) => {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-3 cursor-pointer",
        "bg-gradient-to-br shadow-lg",
        dimension.gradient,
        "min-h-[100px] flex flex-col justify-between"
      )}
    >
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
        <div className="absolute top-2 right-2 text-4xl opacity-30">
          {dimension.emoji}
        </div>
      </div>
      
      {/* 主要内容 */}
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-2xl">{dimension.emoji}</span>
          <h3 className="text-xl font-bold text-white">{dimension.title}</h3>
        </div>
        <p className="text-xs text-white/80">{dimension.subtitle}</p>
      </div>
      
      {/* 模板提示 */}
      <div className="relative z-10 mt-1.5">
        <p className="text-xs text-white/70 truncate">
          {dimension.template.replace('___', '...')}
        </p>
      </div>
      
      {/* 悬浮光效 */}
      <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors duration-300" />
    </motion.div>
  );
};

export default AwakeningEntryCard;

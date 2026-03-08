import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AwakeningDimension } from "@/config/awakeningConfig";

interface AwakeningEntryCardProps {
  dimension: AwakeningDimension;
  onClick: () => void;
  index: number;
  compact?: boolean;
}

// 触感反馈（如果支持）
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const AwakeningEntryCard: React.FC<AwakeningEntryCardProps> = ({
  dimension,
  onClick,
  index,
  compact = false
}) => {
  const handleClick = useCallback(() => {
    triggerHaptic();
    onClick();
  }, [onClick]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.3 }}
        whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
        onClick={handleClick}
        style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        className={cn(
          "relative overflow-hidden rounded-xl p-3 cursor-pointer",
          "bg-gradient-to-br shadow-sm",
          dimension.gradient,
          "min-h-[88px] flex flex-col justify-center",
          "active:shadow-md transition-shadow duration-150",
          "motion-fallback"
        )}
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-12 h-12 opacity-15">
          <div className="absolute top-0.5 right-0.5 text-2xl opacity-40">
            {dimension.emoji}
          </div>
        </div>
        
        {/* 主要内容 */}
        <div className="relative z-10 text-center">
          <span className="text-xl block mb-1">{dimension.emoji}</span>
          <h3 className="text-sm font-bold text-white leading-tight">{dimension.title}</h3>
          <p className="text-[10px] text-white/70 mt-0.5 leading-tight line-clamp-1">{dimension.categoryLabel}</p>
        </div>
        
        {/* 点击反馈 */}
        <div className="absolute inset-0 bg-white/0 active:bg-white/15 transition-colors duration-150" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0.01, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
      onClick={handleClick}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-3 cursor-pointer",
        "bg-gradient-to-br shadow-md",
        dimension.gradient,
        "min-h-[90px] flex flex-col justify-between",
        "active:shadow-lg transition-shadow duration-150",
        "motion-fallback"
      )}
    >
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
        <div className="absolute top-1 right-1 text-3xl opacity-30">
          {dimension.emoji}
        </div>
      </div>
      
      {/* 主要内容 */}
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xl">{dimension.emoji}</span>
          <h3 className="text-base font-bold text-white">{dimension.title}</h3>
        </div>
        <p className="text-[11px] text-white/80 leading-tight">{dimension.subtitle}</p>
      </div>
      
      {/* 模板提示 */}
      <div className="relative z-10 mt-1">
        <p className="text-[10px] text-white/60 truncate">
          {dimension.template.replace('___', '...')}
        </p>
      </div>
      
      {/* 点击反馈 */}
      <div className="absolute inset-0 bg-white/0 active:bg-white/15 transition-colors duration-150" />
    </motion.div>
  );
};

export default AwakeningEntryCard;

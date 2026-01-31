import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Brain, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const AwakeningHeroCard: React.FC = () => {
  const stats = [
    { value: "70%", label: "每天遗忘的经历", icon: Brain },
    { value: "3倍", label: "决策速度提升", icon: TrendingUp },
    { value: "200%", label: "职业转变效率", icon: Zap },
  ];

  return (
    <motion.div
      initial={{ opacity: 0.01, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
      className="space-y-4"
    >
      {/* 核心标语 */}
      <div className="text-center space-y-2">
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
      </div>

      {/* 科学依据卡片 */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">研究表明</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0.01, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
              style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
              className="text-center"
            >
              <stat.icon className="h-4 w-4 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
              <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default AwakeningHeroCard;

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";

const interventionLevels = [
  { emoji: "🔥", entry: "情绪", level: "神经反应与情绪回路" },
  { emoji: "💛", entry: "感恩", level: "注意力分配与神经可塑性" },
  { emoji: "⚡", entry: "行动", level: "行为习惯与执行系统" },
  { emoji: "🧩", entry: "选择", level: "潜意识决策机制" },
  { emoji: "🤝", entry: "关系", level: "社会连接与安全感" },
  { emoji: "🌟", entry: "方向", level: "意义感与长期动机" },
];

interface InterventionLevelTableProps {
  delay?: number;
}

const InterventionLevelTable: React.FC<InterventionLevelTableProps> = ({ delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
    >
      <Card className="overflow-hidden border">
        <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-b flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-medium text-teal-700 dark:text-teal-300">干预层级表</span>
        </div>
        <div className="p-3 bg-muted/30 border-b">
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
            <span>入口</span>
            <span>干预层级</span>
          </div>
        </div>
        <div className="divide-y">
          {interventionLevels.map((item, i) => (
            <motion.div
              key={item.entry}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.05 * i }}
              className="grid grid-cols-2 gap-2 p-3 text-sm"
            >
              <span className="font-medium flex items-center gap-1.5">
                <span>{item.emoji}</span>
                <span>{item.entry}</span>
              </span>
              <span className="text-muted-foreground text-xs">{item.level}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default InterventionLevelTable;

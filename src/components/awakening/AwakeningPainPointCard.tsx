import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const AwakeningPainPointCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const painPoints = [
    "每天机械化起床、上班、刷手机",
    "上周发生的事，模模糊糊没印象",
    "在信息茧房里「自动驾驶」",
    "感觉迷茫混乱，抓不住重点",
  ];

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 cursor-pointer",
        "bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/30",
        "border-slate-200/50 dark:border-slate-700/30"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* 触发区域 */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            你是否也这样？
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </div>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <ul className="space-y-2">
                {painPoints.map((point, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/30">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  📝 记录 = 用最低成本打破无意识状态
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default AwakeningPainPointCard;

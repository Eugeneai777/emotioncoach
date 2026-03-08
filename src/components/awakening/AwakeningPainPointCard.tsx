import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertCircle, Lightbulb } from "lucide-react";
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

  const tips = [
    {
      colorClass: "text-destructive/70",
      text: '写困境时，不叫「困难」，叫「破局关键点」或「命运转折点」'
    },
    {
      colorClass: "text-primary/70",
      text: '写顺境时，记录微小美好：散步、电影、灵感、三餐'
    }
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
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            你是否也这样？
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
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
            <div className="px-3 pb-3 space-y-2.5">
              <ul className="space-y-1.5">
                {painPoints.map((point, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed"
                  >
                    <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                    <span>{point}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/30">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  📝 记录 = 用最低成本打破无意识状态
                </p>
              </div>
              
              {/* 写法小贴士 */}
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/30">
                <div className="flex items-center gap-1 mb-1.5">
                  <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    写法小贴士
                  </span>
                </div>
                <ul className="space-y-1">
                  {tips.map((tip, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-relaxed"
                    >
                      <span className={cn("mt-0.5 shrink-0", tip.colorClass)}>•</span>
                      <span>{tip.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default AwakeningPainPointCard;

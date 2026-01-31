import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowRight, RefreshCw } from "lucide-react";

const loopSteps = [
  { emoji: "🔥", title: "情绪", desc: "告诉你哪里出问题" },
  { emoji: "💛", title: "感恩", desc: "修复神经系统" },
  { emoji: "⚡", title: "行动", desc: "把意识落到现实" },
  { emoji: "🧩", title: "选择", desc: "关键点做清醒判断" },
  { emoji: "🤝", title: "关系", desc: "修复与世界的连接" },
  { emoji: "🌟", title: "方向", desc: "对齐长期人生" },
];

interface AwarenessLoopDiagramProps {
  delay?: number;
}

const AwarenessLoopDiagram: React.FC<AwarenessLoopDiagramProps> = ({ delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
    >
      <Card className="p-4 border bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">觉察闭环</span>
        </div>
        
        {/* Loop visualization */}
        <div className="flex flex-wrap items-center justify-center gap-1 mb-4 text-sm">
          {loopSteps.map((step, i) => (
            <React.Fragment key={step.title}>
              <span className="flex items-center gap-0.5 px-2 py-1 bg-background rounded-full shadow-sm">
                <span>{step.emoji}</span>
                <span className="text-xs font-medium">{step.title}</span>
              </span>
              {i < loopSteps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">循环...</span>
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-2 gap-2">
          {loopSteps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.05 * i }}
              className="flex items-start gap-1.5 text-xs"
            >
              <span>{step.emoji}</span>
              <span className="text-muted-foreground">{step.desc}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default AwarenessLoopDiagram;

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const problemMappings = [
  { problem: "情绪失控、焦虑、烦躁", system: "情绪系统", emoji: "🔥" },
  { problem: "空虚、匮乏、无力感", system: "价值与滋养系统", emoji: "💛" },
  { problem: "拖延、忙但没进展", system: "行动系统", emoji: "⚡" },
  { problem: "犹豫、反复纠结", system: "决策系统", emoji: "🧩" },
  { problem: "吵架、冷战、误解", system: "关系系统", emoji: "🤝" },
  { problem: "迷茫、没方向", system: "意义与方向系统", emoji: "🌟" },
];

interface ProblemMappingTableProps {
  delay?: number;
}

const ProblemMappingTable: React.FC<ProblemMappingTableProps> = ({ delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
    >
      <Card className="overflow-hidden border">
        <div className="p-3 bg-muted/50 border-b">
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
            <span>你以为的问题</span>
            <span>本质属于</span>
          </div>
        </div>
        <div className="divide-y">
          {problemMappings.map((item, i) => (
            <motion.div
              key={item.system}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.05 * i }}
              className="grid grid-cols-2 gap-2 p-3 text-sm"
            >
              <span className="text-muted-foreground">{item.problem}</span>
              <span className="font-medium flex items-center gap-1.5">
                <span>{item.emoji}</span>
                <span>{item.system}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default ProblemMappingTable;

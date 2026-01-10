import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, X, Check, Brain } from "lucide-react";

const comparisonItems = [
  {
    traditional: "固定题目，机械作答",
    ai: "AI智能追问，深挖隐藏盲点",
  },
  {
    traditional: "一次性PDF报告",
    ai: "四穷雷达图 + 可视化诊断",
  },
  {
    traditional: "泛泛建议，不针对个人",
    ai: "个性化突破方案",
  },
  {
    traditional: "冷冰冰的分数标签",
    ai: "人格故事化解读",
  },
];

export function AIComparisonCard() {
  return (
    <Card className="p-4 bg-white border-violet-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-violet-600" />
        <h3 className="font-medium text-sm text-slate-800">为什么选择有劲AI测评？</h3>
      </div>
      
      <div className="space-y-3">
        {comparisonItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08 }}
            className="grid grid-cols-2 gap-2"
          >
            {/* Traditional */}
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
              <div className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-500 line-through leading-relaxed">{item.traditional}</span>
              </div>
            </div>
            
            {/* AI */}
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-violet-50 to-amber-50 border border-violet-200 relative overflow-hidden">
              <div className="absolute top-1 right-1">
                <Sparkles className="w-3 h-3 text-amber-500/60 animate-pulse" />
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">{item.ai}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Bottom Highlight */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-100 to-violet-100 border border-amber-300/50"
      >
        <p className="text-xs text-center text-slate-700">
          <span className="font-bold text-amber-600">有劲AI</span> = 智能追问 + 可视诊断 + 精准方案
        </p>
      </motion.div>
    </Card>
  );
}

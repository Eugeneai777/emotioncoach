import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, X, Check, Brain } from "lucide-react";

const comparisonItems = [
  {
    traditional: "固定30道题，做完就结束",
    ai: "AI智能追问，精准挖掘隐藏模式",
  },
  {
    traditional: "一次性报告，看完就忘",
    ai: "活画像系统，持续追踪成长轨迹",
  },
  {
    traditional: "冷冰冰的分数标签",
    ai: "AI教练记住你，每次对话都懂你",
  },
  {
    traditional: "没有后续指导",
    ai: "21天AI陪伴，见证每个突破时刻",
  },
];

export function AIComparisonCard() {
  return (
    <Card className="p-4 bg-gradient-to-br from-slate-900 via-violet-950/50 to-slate-900 border-violet-500/30">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-violet-400" />
        <h3 className="font-medium text-sm text-violet-200">为什么选择 AI 测评？</h3>
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
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
              <div className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-400 line-through leading-relaxed">{item.traditional}</span>
              </div>
            </div>
            
            {/* AI */}
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-violet-900/40 to-amber-900/30 border border-violet-500/30 relative overflow-hidden">
              <div className="absolute top-1 right-1">
                <Sparkles className="w-3 h-3 text-amber-400/50 animate-pulse" />
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-violet-100 leading-relaxed font-medium">{item.ai}</span>
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
        className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-950/50 to-violet-950/50 border border-amber-500/20"
      >
        <p className="text-xs text-center text-amber-200/90">
          <span className="font-bold text-amber-300">有劲AI</span> = 智能诊断 + 持续陪伴 + 动态成长
        </p>
      </motion.div>
    </Card>
  );
}

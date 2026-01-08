import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Bot, MessageSquareMore, Layers, User, Sparkles } from "lucide-react";

const valuePoints = [
  {
    icon: MessageSquareMore,
    title: "智能追问深挖",
    description: "不只是选择题，AI根据你的回答动态追问，挖掘你自己都没意识到的隐藏卡点。",
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: Layers,
    title: "多维度交叉分析",
    description: "结合行为层、情绪层、信念层数据，识别你独特的财富反应模式。",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: User,
    title: "活画像起点",
    description: "这份报告是你「活画像」的 Day 0 基准线。加入训练营后，21天追踪你的成长轨迹。",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
  },
];

export function AIAnalysisValueCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="p-4 bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 border-purple-200/50 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              为什么这份AI分析与众不同？
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            </h3>
            <p className="text-[10px] text-muted-foreground">Powered by 有劲AI · 财富教练</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {valuePoints.map((point, idx) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className={`p-3 ${point.bgColor} rounded-xl border border-white/50`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${point.color} shadow-sm flex-shrink-0`}>
                  <point.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground mb-1">{point.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{point.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 p-2.5 bg-gradient-to-r from-purple-100/80 to-indigo-100/80 rounded-lg text-center"
        >
          <p className="text-[11px] text-purple-700">
            💡 加入21天训练营，让AI持续追踪你的蜕变
          </p>
        </motion.div>
      </Card>
    </motion.div>
  );
}

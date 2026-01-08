import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, Clock, Database, Heart } from "lucide-react";

const trilogy = [
  {
    icon: Clock,
    name: "成长追踪",
    englishName: "Growth Tracking",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-950/40",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    description: "21天持续追踪你的变化轨迹",
    example: "\"焦虑指数从 78 降到 42\"",
  },
  {
    icon: Database,
    name: "画像对比",
    englishName: "Profile Comparison",
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-950/40",
    borderColor: "border-cyan-500/30",
    iconColor: "text-cyan-400",
    description: "活画像每周更新，见证蜕变",
    example: "\"Day 1 的你 vs Day 21 的你\"",
  },
  {
    icon: Heart,
    name: "AI见证",
    englishName: "AI Witnessing",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-950/40",
    borderColor: "border-rose-500/30",
    iconColor: "text-rose-400",
    description: "每个行为转变都被看见和命名",
    example: "\"嘴穷→嘴富，AI为你喝彩\"",
  },
];

export function AIThreeLocksCard() {
  return (
    <Card className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-600/40">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h3 className="font-medium text-sm text-slate-200">AI 陪伴三部曲</h3>
      </div>
      
      <div className="space-y-3">
        {trilogy.map((item, idx) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + idx * 0.1 }}
            className={`p-3 rounded-xl ${item.bgColor} border ${item.borderColor} relative overflow-hidden`}
          >
            {/* Step number */}
            <div className="absolute top-2 right-2">
              <span className={`text-lg font-bold ${item.iconColor} opacity-30`}>{idx + 1}</span>
            </div>
            
            <div className="flex items-start gap-3 pr-8">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} shadow-lg`}>
                <item.icon className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-white">{item.name}</span>
                  <span className="text-[10px] text-slate-400">{item.englishName}</span>
                </div>
                <p className="text-xs text-slate-300 mb-1.5">{item.description}</p>
                <p className="text-[10px] text-slate-400 italic">{item.example}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 text-center"
      >
        <p className="text-[10px] text-slate-400 leading-relaxed">
          追踪 → 对比 → 见证，AI陪你走完每一步
        </p>
      </motion.div>
    </Card>
  );
}

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, Clock, Database, Heart } from "lucide-react";

const trilogy = [
  {
    icon: Clock,
    name: "成长追踪",
    englishName: "Growth Tracking",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconColor: "text-amber-600",
    description: "21天持续追踪你的变化轨迹",
    example: "\"焦虑指数从 78 降到 42\"",
  },
  {
    icon: Database,
    name: "画像对比",
    englishName: "Profile Comparison",
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    iconColor: "text-cyan-600",
    description: "活画像每周更新，见证蜕变",
    example: "\"Day 1 的你 vs Day 21 的你\"",
  },
  {
    icon: Heart,
    name: "AI见证",
    englishName: "AI Witnessing",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    iconColor: "text-rose-600",
    description: "每个行为转变都被看见和命名",
    example: "\"嘴穷→嘴富，AI为你喝彩\"",
  },
];

export function AIThreeLocksCardLight() {
  return (
    <Card className="p-4 bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 border-indigo-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">AI 陪伴三部曲</h3>
          <p className="text-[10px] text-muted-foreground">有劲AI · 财富教练 独有技术</p>
        </div>
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
              <span className={`text-lg font-bold ${item.iconColor} opacity-40`}>{idx + 1}</span>
            </div>
            
            <div className="flex items-start gap-3 pr-8">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} shadow-md`}>
                <item.icon className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">{item.englishName}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1.5">{item.description}</p>
                <p className="text-[10px] text-slate-500 italic">{item.example}</p>
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
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          追踪 → 对比 → 见证，AI陪你走完每一步
        </p>
      </motion.div>
    </Card>
  );
}

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Lock, Clock, Database, Heart } from "lucide-react";

const locks = [
  {
    icon: Clock,
    name: "时间锁",
    englishName: "Time Lock",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-950/40",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    description: "21天持续追踪卡点变化",
    example: "\"焦虑指数从 78 降到 42\"",
  },
  {
    icon: Database,
    name: "数据锁",
    englishName: "Data Lock",
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-950/40",
    borderColor: "border-cyan-500/30",
    iconColor: "text-cyan-400",
    description: "活画像每周更新对比",
    example: "\"过去的你 vs 今天的你\"",
  },
  {
    icon: Heart,
    name: "关系锁",
    englishName: "Relationship Lock",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-950/40",
    borderColor: "border-rose-500/30",
    iconColor: "text-rose-400",
    description: "AI见证每个行为转变",
    example: "\"嘴穷→嘴富，AI为你命名\"",
  },
];

export function AIThreeLocksCard() {
  return (
    <Card className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-600/40">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-amber-400" />
        <h3 className="font-medium text-sm text-slate-200">AI 三锁系统 · 护城河</h3>
      </div>
      
      <div className="space-y-3">
        {locks.map((lock, idx) => (
          <motion.div
            key={lock.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + idx * 0.1 }}
            className={`p-3 rounded-xl ${lock.bgColor} border ${lock.borderColor} relative overflow-hidden`}
          >
            {/* Pulse animation for lock icon */}
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: idx * 0.3 
                }}
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${lock.color} opacity-30`}
              />
              <Lock className={`w-3.5 h-3.5 ${lock.iconColor} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
            </div>
            
            <div className="flex items-start gap-3 pr-8">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${lock.color} shadow-lg`}>
                <lock.icon className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-white">{lock.name}</span>
                  <span className="text-[10px] text-slate-400">{lock.englishName}</span>
                </div>
                <p className="text-xs text-slate-300 mb-1.5">{lock.description}</p>
                <p className="text-[10px] text-slate-400 italic">{lock.example}</p>
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
          三重锁定，让AI成为你不可替代的成长伙伴
        </p>
      </motion.div>
    </Card>
  );
}

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { User, RefreshCw, GitCompare, Brain, Sparkles } from "lucide-react";

const features = [
  {
    icon: RefreshCw,
    title: "动态更新",
    description: "每天教练对话后自动更新你的财富画像",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    icon: GitCompare,
    title: "可视对比",
    description: "第1天 vs 第7天，清晰看见自己的变化",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: Brain,
    title: "AI记忆",
    description: "教练记住你的每一次突破和卡点",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Sparkles,
    title: "个性化建议",
    description: "基于你的画像演变，给出针对性下一步",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
];

export function LivingProfileCard() {
  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">活画像系统</h3>
          <p className="text-[10px] text-muted-foreground">你专属的财富成长档案</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08 }}
            className="p-3 bg-white/80 rounded-xl border border-white shadow-sm"
          >
            <div className={`w-7 h-7 ${feature.bgColor} rounded-lg flex items-center justify-center mb-2`}>
              <feature.icon className={`w-4 h-4 ${feature.color}`} />
            </div>
            <h4 className="font-medium text-xs text-foreground mb-0.5">{feature.title}</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Bottom highlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 p-2.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg text-center"
      >
        <p className="text-[11px] text-emerald-700 font-medium">
          不是静态报告，而是与你一起成长的「活」档案
        </p>
      </motion.div>
    </Card>
  );
}

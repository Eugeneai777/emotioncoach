import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Radar, Gauge, BookOpen, Lightbulb, Gift } from "lucide-react";

const outcomes = [
  {
    icon: Radar,
    title: "四穷人格雷达图",
    desc: "可视化诊断嘴穷/手穷/眼穷/心穷",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Gauge,
    title: "觉醒指数仪表盘",
    desc: "0-100分量化你的财富能量",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: BookOpen,
    title: "卡点故事化解读",
    desc: "用你的经历讲述财富卡点成因",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Lightbulb,
    title: "个性化突破建议",
    desc: "针对你的卡点定制行动方案",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

export function AssessmentPreviewCard() {
  return (
    <Card className="p-4 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/30">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-4 h-4 text-indigo-400" />
        <h3 className="font-medium text-sm text-indigo-200">测评完成后，你将获得</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2.5">
        {outcomes.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08 }}
            className={`p-3 rounded-xl ${item.bg} border border-slate-700/40`}
          >
            <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
            <p className="text-xs font-medium text-slate-200 mb-1">{item.title}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

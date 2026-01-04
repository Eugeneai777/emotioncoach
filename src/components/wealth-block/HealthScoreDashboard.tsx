import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthScoreDashboardProps {
  healthScore: number;
  behaviorScore: number;
  emotionScore: number;
  beliefScore: number;
}

const healthZones = [
  { range: [0, 40], label: "和谐健康", emoji: "🟢", color: "text-emerald-600", bgColor: "bg-emerald-500", description: "你与财富的关系相对顺畅" },
  { range: [41, 70], label: "需要关注", emoji: "🟡", color: "text-amber-600", bgColor: "bg-amber-500", description: "有一些卡点需要调整" },
  { range: [71, 85], label: "需要调整", emoji: "🟠", color: "text-orange-600", bgColor: "bg-orange-500", description: "建议系统性地调整" },
  { range: [86, 100], label: "高风险", emoji: "🔴", color: "text-rose-600", bgColor: "bg-rose-500", description: "需要专业支持和陪伴" },
];

const getHealthZone = (score: number) => {
  return healthZones.find(zone => score >= zone.range[0] && score <= zone.range[1]) || healthZones[0];
};

const getLayerStatus = (score: number, maxScore: number) => {
  const percentage = (score / maxScore) * 100;
  if (percentage <= 40) return { label: "健康", color: "text-emerald-600", icon: TrendingDown };
  if (percentage <= 70) return { label: "关注", color: "text-amber-600", icon: Minus };
  return { label: "需调整", color: "text-rose-600", icon: TrendingUp };
};

export function HealthScoreDashboard({ healthScore, behaviorScore, emotionScore, beliefScore }: HealthScoreDashboardProps) {
  const zone = getHealthZone(healthScore);
  const behaviorStatus = getLayerStatus(behaviorScore, 50);
  const emotionStatus = getLayerStatus(emotionScore, 50);
  const beliefStatus = getLayerStatus(beliefScore, 50);

  const layers = [
    { name: "行为层", score: behaviorScore, max: 50, color: "bg-amber-500", status: behaviorStatus },
    { name: "情绪层", score: emotionScore, max: 50, color: "bg-pink-500", status: emotionStatus },
    { name: "信念层", score: beliefScore, max: 50, color: "bg-purple-500", status: beliefStatus },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-slate-400 text-sm mb-1">💰 你的财富心理健康度</p>
          </div>

          {/* Circular Score Display */}
          <div className="flex justify-center mb-6">
            <div className="relative w-36 h-36">
              {/* Background circle */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  opacity="0.3"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={zone.bgColor.replace('bg-', '')}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthScore / 100) * 264} 264`}
                  initial={{ strokeDasharray: "0 264" }}
                  animate={{ strokeDasharray: `${(healthScore / 100) * 264} 264` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    healthScore <= 40 ? "stroke-emerald-500" :
                    healthScore <= 70 ? "stroke-amber-500" :
                    healthScore <= 85 ? "stroke-orange-500" : "stroke-rose-500"
                  )}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl mb-0.5">{zone.emoji}</span>
                <motion.span 
                  className="text-3xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {healthScore}
                </motion.span>
                <span className="text-slate-400 text-sm">/100</span>
              </div>
            </div>
          </div>

          {/* Zone Label */}
          <div className="text-center mb-5">
            <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium", 
              healthScore <= 40 ? "bg-emerald-500/20 text-emerald-400" :
              healthScore <= 70 ? "bg-amber-500/20 text-amber-400" :
              healthScore <= 85 ? "bg-orange-500/20 text-orange-400" : "bg-rose-500/20 text-rose-400"
            )}>
              {zone.label}
            </span>
            <p className="text-slate-400 text-xs mt-2">{zone.description}</p>
          </div>

          {/* Zone Legend */}
          <div className="flex justify-center gap-3 mb-5 text-xs">
            {healthZones.map((z, i) => (
              <div key={i} className="flex items-center gap-1 text-slate-400">
                <span>{z.emoji}</span>
                <span>{z.range[0]}-{z.range[1]}</span>
              </div>
            ))}
          </div>

          {/* Layer Scores */}
          <div className="space-y-3">
            <p className="text-slate-400 text-xs font-medium text-center mb-2">📊 三层得分对比</p>
            {layers.map((layer, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">{layer.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs", layer.status.color)}>{layer.status.label}</span>
                    <span className="text-slate-400">{layer.score}/{layer.max}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", layer.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${(layer.score / layer.max) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-xs text-center">
              💡 分数越<span className="text-emerald-400">低</span>代表越健康，分数越<span className="text-rose-400">高</span>代表卡点越严重
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

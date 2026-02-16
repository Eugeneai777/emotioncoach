import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  awakeningZones,
  getAwakeningZone,
  getAwakeningColor,
  getAwakeningTextColor,
  layerScoreToAwakeningPercent,
} from "@/config/wealthStyleConfig";

interface HealthScoreDashboardProps {
  healthScore: number; // Block score 0-100 (higher = more blocked)
  behaviorScore: number;
  emotionScore: number;
  beliefScore: number;
}

export function HealthScoreDashboard({ healthScore, behaviorScore, emotionScore, beliefScore }: HealthScoreDashboardProps) {
  const awakeningScore = 100 - healthScore;
  const zone = getAwakeningZone(awakeningScore);

  const layers = [
    { name: "行为层", score: behaviorScore, max: 50, color: "bg-amber-500" },
    { name: "情绪层", score: emotionScore, max: 50, color: "bg-pink-500" },
    { name: "信念层", score: beliefScore, max: 50, color: "bg-purple-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="p-5">
          <div className="text-center mb-4">
            <p className="text-slate-400 text-sm mb-1">✨ 你的财富觉醒指数</p>
          </div>

          {/* Circular Score Display */}
          <div className="flex justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(awakeningScore / 100) * 264} 264`}
                  initial={{ strokeDasharray: "0 264" }}
                  animate={{ strokeDasharray: `${(awakeningScore / 100) * 264} 264` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    awakeningScore >= 80 ? "stroke-emerald-500" :
                    awakeningScore >= 60 ? "stroke-amber-500" :
                    awakeningScore >= 40 ? "stroke-orange-500" : "stroke-rose-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl mb-0.5">{zone.emoji}</span>
                <motion.span 
                  className="text-3xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {awakeningScore}
                </motion.span>
                <span className="text-slate-400 text-sm">/100</span>
              </div>
            </div>
          </div>

          {/* Zone Label */}
          <div className="text-center mb-5">
            <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium",
              awakeningScore >= 80 ? "bg-emerald-500/20 text-emerald-400" :
              awakeningScore >= 60 ? "bg-amber-500/20 text-amber-400" :
              awakeningScore >= 40 ? "bg-orange-500/20 text-orange-400" : "bg-rose-500/20 text-rose-400"
            )}>
              {zone.label}
            </span>
            <p className="text-slate-400 text-xs mt-2">{zone.description}</p>
          </div>

          {/* Zone Legend */}
          <div className="flex justify-center gap-3 mb-5 text-xs">
            {awakeningZones.map((z, i) => (
              <div key={i} className="flex items-center gap-1 text-slate-400">
                <span>{z.emoji}</span>
                <span>{z.range[0]}-{z.range[1]}</span>
              </div>
            ))}
          </div>

          {/* Layer Scores as Awakening % */}
          <div className="space-y-3">
            <p className="text-slate-400 text-xs font-medium text-center mb-2">📊 三层觉醒度</p>
            {layers.map((layer, index) => {
              const awakeningPercent = layerScoreToAwakeningPercent(layer.score, layer.max);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">{layer.name}</span>
                    <span className={cn("font-medium", getAwakeningTextColor(awakeningPercent))}>
                      {awakeningPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", layer.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${awakeningPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tip */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-xs text-center">
              💡 分数越<span className="text-emerald-400">高</span>代表越觉醒，分数越<span className="text-rose-400">低</span>代表需要更多关注
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

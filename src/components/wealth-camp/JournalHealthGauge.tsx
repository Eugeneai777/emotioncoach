import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Flame } from "lucide-react";
import { wealthLayerColors, getHealthZone, getGaugeColor, getScoreColor } from "@/config/wealthStyleConfig";

interface JournalHealthGaugeProps {
  awakeningIndex: number;
  behaviorScore: number;
  emotionScore: number;
  beliefScore: number;
  trendChange?: number;
  currentDay: number;
  totalDays: number;
  consecutiveDays?: number;
  peakIndex?: number;    // 最佳表现（峰值）
  currentAvg?: number;   // 当前均值
}

export function JournalHealthGauge({
  awakeningIndex,
  behaviorScore,
  emotionScore,
  beliefScore,
  trendChange = 0,
  currentDay,
  totalDays,
  consecutiveDays = 0,
  peakIndex,
  currentAvg,
}: JournalHealthGaugeProps) {
  const zone = getHealthZone(awakeningIndex);
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;

  const layers = [
    { key: "behavior", ...wealthLayerColors.behavior, score: behaviorScore },
    { key: "emotion", ...wealthLayerColors.emotion, score: emotionScore },
    { key: "belief", ...wealthLayerColors.belief, score: beliefScore },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="p-4">
          {/* Header with Day Progress */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <span className="text-lg">💰</span>
              觉醒指数
            </h2>
            <div className="flex items-center gap-2">
              {consecutiveDays >= 3 && (
                <motion.div 
                  className="flex items-center gap-1 bg-orange-500/20 px-2 py-0.5 rounded-full"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-bold text-orange-400">{consecutiveDays}天</span>
                </motion.div>
              )}
              <div className="bg-slate-700/50 px-2 py-0.5 rounded-full">
                <span className="text-xs text-slate-300">Day {currentDay}/{totalDays}</span>
              </div>
            </div>
          </div>

          {/* Gauge Display */}
          <div className="relative flex justify-center py-2">
            <svg 
              className="w-[140px] h-[84px]" 
              viewBox="0 0 200 120"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              
              {/* Progress arc */}
              <motion.path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={getGaugeColor(awakeningIndex)}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: awakeningIndex / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ 
                  strokeDasharray: circumference,
                  strokeDashoffset: 0
                }}
              />
              
              {/* Needle */}
              <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 + (awakeningIndex / 100) * 180 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="40"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="6" fill="white" />
                <circle cx="100" cy="100" r="3" fill={getGaugeColor(awakeningIndex)} />
              </motion.g>
              
              {/* Scale labels */}
              <text x="15" y="115" fill="rgba(255,255,255,0.5)" fontSize="10">0</text>
              <text x="178" y="115" fill="rgba(255,255,255,0.5)" fontSize="10">100</text>
            </svg>
          </div>

          {/* Score + Trend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-4"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span 
                className={cn("text-3xl font-bold tabular-nums", getScoreColor(awakeningIndex))}
                style={{ textShadow: '0 0 20px currentColor' }}
              >
                {awakeningIndex}
              </span>
              {trendChange !== 0 && (
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium",
                  trendChange > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                )}>
                  {trendChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {trendChange > 0 ? "+" : ""}{trendChange.toFixed(1)}
                </div>
              )}
            </div>
            
            {/* Zone Badge */}
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
              zone.color === "emerald" && "bg-emerald-500/20 text-emerald-400",
              zone.color === "amber" && "bg-amber-500/20 text-amber-400",
              zone.color === "orange" && "bg-orange-500/20 text-orange-400",
              zone.color === "rose" && "bg-rose-500/20 text-rose-400",
            )}>
              <span>{zone.emoji}</span>
              <span>{zone.label}</span>
            </div>
            
            {/* 双指标：当前均值 vs 最佳表现 */}
            {peakIndex !== undefined && currentAvg !== undefined && peakIndex !== currentAvg && (
              <div className="flex justify-center gap-4 mt-2 text-[10px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <span>📊 当前均值</span>
                  <span className="font-medium text-slate-300">{currentAvg}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <span>🏆 最佳表现</span>
                  <span className="font-medium text-emerald-400">{peakIndex}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Three Layer Scores - Star Display */}
          <div className="grid grid-cols-3 gap-2">
            {layers.map((layer, idx) => (
              <motion.div
                key={layer.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="bg-slate-800/60 rounded-lg p-2 text-center border border-slate-700/50"
              >
                <div className="text-base mb-0.5">{layer.emoji}</div>
                <div className="text-slate-400 text-[10px] mb-1">{layer.label}</div>
                {/* Star Display */}
                <div className="flex justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i <= Math.round(layer.score) 
                          ? `bg-gradient-to-r ${layer.gradient}` 
                          : "bg-slate-700"
                      )}
                    />
                  ))}
                </div>
                <div className="text-white text-sm font-medium mt-1">{layer.score.toFixed(1)}</div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

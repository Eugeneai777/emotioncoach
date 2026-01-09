import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EnhancedHealthGaugeProps {
  healthScore: number;
  behaviorScore: number;
  emotionScore: number;
  beliefScore: number;
}

const healthZones = [
  { range: [0, 40], label: "和谐健康", emoji: "🟢", color: "emerald", description: "与财富关系顺畅" },
  { range: [41, 70], label: "需要关注", emoji: "🟡", color: "amber", description: "存在一些卡点" },
  { range: [71, 85], label: "需要调整", emoji: "🟠", color: "orange", description: "建议系统调整" },
  { range: [86, 100], label: "高风险区", emoji: "🔴", color: "rose", description: "需要专业陪伴" },
];

const getHealthZone = (score: number) => {
  return healthZones.find(zone => score >= zone.range[0] && score <= zone.range[1]) || healthZones[0];
};

export function EnhancedHealthGauge({ healthScore, behaviorScore, emotionScore, beliefScore }: EnhancedHealthGaugeProps) {
  const zone = getHealthZone(healthScore);
  const invertedScore = 100 - healthScore; // For display as "health" rather than "blockage"
  
  // Calculate arc parameters
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half circle
  const progress = (healthScore / 100) * circumference;
  
  const layers = [
    { name: "行为", score: behaviorScore, max: 50, emoji: "🚶", color: "from-amber-400 to-orange-500" },
    { name: "情绪", score: emotionScore, max: 50, emoji: "💭", color: "from-pink-400 to-rose-500" },
    { name: "信念", score: beliefScore, max: 50, emoji: "💡", color: "from-violet-400 to-purple-500" },
  ];

  const getScoreColor = (score: number) => {
    if (score <= 40) return "text-emerald-500";
    if (score <= 70) return "text-amber-500";
    if (score <= 85) return "text-orange-500";
    return "text-rose-500";
  };

  const getGaugeColor = (score: number) => {
    if (score <= 40) return "#10b981";
    if (score <= 70) return "#f59e0b";
    if (score <= 85) return "#f97316";
    return "#f43f5e";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-2">
            <h2 className="text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl">💰</span>
              财富心理健康度
            </h2>
          </div>

          {/* Gauge Display - Responsive */}
          <div className="relative flex justify-center py-2 sm:py-4">
            <svg 
              className="w-[160px] h-[96px] sm:w-[200px] sm:h-[120px] md:w-[240px] md:h-[144px]" 
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
              
              {/* Zone colors (background segments) */}
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="40%" stopColor="#10b981" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#f97316" />
                  <stop offset="85%" stopColor="#f97316" />
                  <stop offset="85%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
              
              {/* Progress arc */}
              <motion.path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={getGaugeColor(healthScore)}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: healthScore / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ 
                  strokeDasharray: circumference,
                  strokeDashoffset: 0
                }}
              />
              
              {/* Needle */}
              <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 + (healthScore / 100) * 180 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="35"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="8" fill="white" />
                <circle cx="100" cy="100" r="4" fill={getGaugeColor(healthScore)} />
              </motion.g>
              
              {/* Scale labels */}
              <text x="15" y="115" fill="rgba(255,255,255,0.5)" fontSize="10">0</text>
              <text x="178" y="115" fill="rgba(255,255,255,0.5)" fontSize="10">100</text>
            </svg>
            
            {/* Center score display */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col items-center"
              >
                <span className={cn("text-3xl sm:text-4xl md:text-5xl font-bold", getScoreColor(healthScore))}>
                  {healthScore}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Zone Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-6"
          >
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
              zone.color === "emerald" && "bg-emerald-500/20 text-emerald-400",
              zone.color === "amber" && "bg-amber-500/20 text-amber-400",
              zone.color === "orange" && "bg-orange-500/20 text-orange-400",
              zone.color === "rose" && "bg-rose-500/20 text-rose-400",
            )}>
              <span className="text-lg">{zone.emoji}</span>
              <span>{zone.label}</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">{zone.description}</p>
          </motion.div>

          {/* Three Layer Breakdown */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            {layers.map((layer, idx) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="relative"
              >
                <div className="bg-slate-800/80 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-slate-700/50">
                  <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">{layer.emoji}</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">{layer.name}层</div>
                  <div className={cn(
                    "text-sm sm:text-lg font-bold",
                    layer.score / layer.max <= 0.4 ? "text-emerald-400" :
                    layer.score / layer.max <= 0.7 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {layer.score}
                    <span className="text-slate-500 text-[10px] sm:text-xs font-normal">/{layer.max}</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1 sm:h-1.5 bg-slate-700 rounded-full mt-1.5 sm:mt-2 overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full bg-gradient-to-r", layer.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${(layer.score / layer.max) * 100}%` }}
                      transition={{ duration: 0.8, delay: 1 + idx * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Zone Legend - 紧凑版 */}
          <div className="flex justify-center gap-1 flex-wrap text-[10px]">
            {healthZones.map((z, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                  zone.range[0] === z.range[0] ? "bg-slate-700" : "bg-transparent"
                )}
              >
                <span>{z.emoji}</span>
                <span className="text-slate-400">{z.range[0]}-{z.range[1]}</span>
              </div>
            ))}
          </div>

          {/* Tip - 精简版 */}
          <div className="mt-3 text-center">
            <p className="text-slate-500 text-[10px]">
              分数<span className="text-emerald-400">↓</span>=健康
              <span className="mx-2">·</span>
              分数<span className="text-rose-400">↑</span>=需关注
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

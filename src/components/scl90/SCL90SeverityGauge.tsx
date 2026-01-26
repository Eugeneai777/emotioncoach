import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SeverityLevel, severityConfig } from "./scl90Data";

interface SCL90SeverityGaugeProps {
  gsi: number;
  totalScore: number;
  positiveCount: number;
  positiveScoreAvg: number;
  severityLevel: SeverityLevel;
}

export function SCL90SeverityGauge({
  gsi,
  totalScore,
  positiveCount,
  positiveScoreAvg,
  severityLevel,
}: SCL90SeverityGaugeProps) {
  const severity = severityConfig[severityLevel];
  
  // Calculate arc parameters for half-circle gauge
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  
  // GSI range: 1.0 - 4.0, normalize to 0-100%
  const normalizedGsi = Math.min(Math.max((gsi - 1) / 3, 0), 1);

  const getGaugeColor = (level: SeverityLevel) => {
    switch (level) {
      case 'normal': return "#10b981";
      case 'mild': return "#f59e0b";
      case 'moderate': return "#f97316";
      case 'severe': return "#ef4444";
    }
  };

  const metrics = [
    { label: "总分", value: totalScore, max: 450, emoji: "📊" },
    { label: "阳性项目数", value: positiveCount, max: 90, emoji: "⚡" },
    { label: "阳性均分", value: positiveScoreAvg.toFixed(2), max: null, emoji: "📈" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0.01, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="p-5 sm:p-6">
          {/* Header */}
          <div className="text-center mb-3">
            <h2 className="text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-2">
              <span className="text-2xl">🧠</span>
              SCL-90 心理健康评估
            </h2>
          </div>

          {/* Gauge Display */}
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
              
              {/* Zone gradient */}
              <defs>
                <linearGradient id="scl90GaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="33%" stopColor="#f59e0b" />
                  <stop offset="66%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              
              {/* Progress arc */}
              <motion.path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={getGaugeColor(severityLevel)}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: normalizedGsi }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ 
                  strokeDasharray: circumference,
                  strokeDashoffset: 0
                }}
              />
              
              {/* Needle */}
              <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 + normalizedGsi * 180 }}
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
                <circle cx="100" cy="100" r="4" fill={getGaugeColor(severityLevel)} />
              </motion.g>
              
              {/* Scale labels */}
              <text x="12" y="115" fill="rgba(255,255,255,0.5)" fontSize="10">1.0</text>
              <text x="175" y="115" fill="rgba(255,255,255,0.5)" fontSize="10">4.0</text>
            </svg>
          </div>

          {/* GSI Score + Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-4"
          >
            {/* GSI Score */}
            <div className="mb-3">
              <span 
                className={cn("text-4xl sm:text-5xl font-bold tabular-nums", severity.textColor)}
                style={{ textShadow: '0 0 20px currentColor' }}
              >
                {gsi.toFixed(2)}
              </span>
              <span className="text-lg text-slate-400 ml-1">GSI</span>
            </div>
            
            {/* Severity Badge */}
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
              severityLevel === "normal" && "bg-green-500/20 text-green-400",
              severityLevel === "mild" && "bg-yellow-500/20 text-yellow-400",
              severityLevel === "moderate" && "bg-orange-500/20 text-orange-400",
              severityLevel === "severe" && "bg-red-500/20 text-red-400",
            )}>
              <span className="text-lg">
                {severityLevel === "normal" ? "🟢" : 
                 severityLevel === "mild" ? "🟡" : 
                 severityLevel === "moderate" ? "🟠" : "🔴"}
              </span>
              <span>{severity.label}</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">{severity.description}</p>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            {metrics.map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700/50"
              >
                <span className="text-lg">{metric.emoji}</span>
                <div className="text-lg font-bold text-white mt-1">
                  {metric.value}
                  {metric.max && <span className="text-slate-500 text-xs font-normal">/{metric.max}</span>}
                </div>
                <div className="text-[10px] text-slate-400">{metric.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Zone Legend */}
          <div className="flex justify-center gap-2 flex-wrap text-[10px] mt-3">
            {(["normal", "mild", "moderate", "severe"] as SeverityLevel[]).map((level) => (
              <div 
                key={level} 
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                  severityLevel === level ? "bg-slate-700" : "bg-transparent"
                )}
              >
                <span>
                  {level === "normal" ? "🟢" : 
                   level === "mild" ? "🟡" : 
                   level === "moderate" ? "🟠" : "🔴"}
                </span>
                <span className="text-slate-400">{severityConfig[level].label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

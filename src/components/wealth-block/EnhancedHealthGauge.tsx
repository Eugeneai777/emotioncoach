import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  awakeningZones, 
  getAwakeningZone, 
  getAwakeningColor, 
  getAwakeningTextColor 
} from "@/config/wealthStyleConfig";

interface EnhancedHealthGaugeProps {
  healthScore: number;
  behaviorScore: number;
  emotionScore: number;
  beliefScore: number;
}

// Arc segment config: each zone maps to a portion of the 180° semicircle
const arcSegments = [
  { startPct: 0,   endPct: 39,  color: "#f43f5e" }, // rose
  { startPct: 39,  endPct: 59,  color: "#f97316" }, // orange
  { startPct: 59,  endPct: 79,  color: "#f59e0b" }, // amber
  { startPct: 79,  endPct: 100, color: "#10b981" }, // emerald
];

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy - r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy - r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`;
}

// Convert percentage (0-100) to angle on semicircle (180° to 0°, left to right)
function pctToAngle(pct: number) {
  return 180 - (pct / 100) * 180;
}

export function EnhancedHealthGauge({ healthScore, behaviorScore, emotionScore, beliefScore }: EnhancedHealthGaugeProps) {
  const awakeningScore = 100 - healthScore;
  const zone = getAwakeningZone(awakeningScore);
  
  const cx = 100, cy = 100, radius = 80, strokeWidth = 12;

  // Legend font sizes (small to large)
  const legendSizes = [
    "text-xs",
    "text-[13px]",
    "text-sm",
    "text-[15px] font-semibold",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="p-5 sm:p-6">
          {/* Header */}
          <div className="text-center mb-3">
            <h2 className="text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-2">
              <span className="text-2xl">✨</span>
              财富觉醒指数
            </h2>
          </div>

          {/* Gauge Display */}
          <div className="relative flex justify-center py-2 sm:py-4">
            <svg 
              className="w-[160px] h-[96px] sm:w-[200px] sm:h-[120px] md:w-[240px] md:h-[144px]" 
              viewBox="0 0 200 120"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background arc segments (dim colors) */}
              {arcSegments.map((seg, i) => (
                <path
                  key={`bg-${i}`}
                  d={describeArc(cx, cy, radius, pctToAngle(seg.endPct), pctToAngle(seg.startPct))}
                  fill="none"
                  stroke={seg.color}
                  strokeOpacity={0.15}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                />
              ))}

              {/* Progress arc segments (solid, clipped to awakeningScore) */}
              {arcSegments.map((seg, i) => {
                // Only render if progress reaches into this segment
                if (awakeningScore <= seg.startPct) return null;
                const fillEnd = Math.min(awakeningScore, seg.endPct);
                return (
                  <motion.path
                    key={`prog-${i}`}
                    d={describeArc(cx, cy, radius, pctToAngle(fillEnd), pctToAngle(seg.startPct))}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
                  />
                );
              })}

              {/* Round caps at start and progress end */}
              {(() => {
                const startAngle = pctToAngle(0);
                const startRad = (startAngle * Math.PI) / 180;
                const sx = cx + radius * Math.cos(startRad);
                const sy = cy - radius * Math.sin(startRad);
                
                const endAngle = pctToAngle(awakeningScore);
                const endRad = (endAngle * Math.PI) / 180;
                const ex = cx + radius * Math.cos(endRad);
                const ey = cy - radius * Math.sin(endRad);
                
                return (
                  <>
                    <circle cx={sx} cy={sy} r={strokeWidth / 2} fill={arcSegments[0].color} opacity={0.15} />
                    <motion.circle 
                      cx={ex} cy={ey} r={strokeWidth / 2} 
                      fill={getAwakeningColor(awakeningScore)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    />
                  </>
                );
              })()}
              
              {/* Needle */}
              <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 + (awakeningScore / 100) * 180 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <line
                  x1="100" y1="100" x2="100" y2="35"
                  stroke="white" strokeWidth="3" strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="8" fill="white" />
                <circle cx="100" cy="100" r="4" fill={getAwakeningColor(awakeningScore)} />
              </motion.g>
              
              {/* Scale labels */}
              <text x="15" y="115" fill="rgba(255,255,255,0.5)" fontSize="10">0</text>
              <text x="178" y="115" fill="rgba(255,255,255,0.5)" fontSize="10">100</text>
            </svg>
          </div>

          {/* Score + Zone Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-6"
          >
            <div className="mb-3">
              <span 
                className={cn("text-4xl sm:text-5xl font-bold tabular-nums", getAwakeningTextColor(awakeningScore))}
                style={{ textShadow: '0 0 20px currentColor' }}
              >
                {awakeningScore}
              </span>
              <span className="text-lg text-slate-400 ml-1">分</span>
            </div>
            
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

          {/* Zone Legend - graduated sizes */}
          <div className="flex justify-center items-end gap-1.5 flex-wrap">
            {awakeningZones.map((z, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all",
                  legendSizes[i],
                  zone.range[0] === z.range[0] ? "bg-slate-700" : "bg-transparent"
                )}
              >
                <span>{z.emoji}</span>
                <span className="text-slate-400">{z.range[0]}-{z.range[1]}</span>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="mt-3 text-center">
            <p className="text-slate-500 text-xs">
              分数<span className="text-emerald-400">↑</span>=越觉醒
              <span className="mx-2">·</span>
              分数<span className="text-rose-400">↓</span>=需关注
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

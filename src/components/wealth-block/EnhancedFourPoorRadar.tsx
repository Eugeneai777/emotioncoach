import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { fourPoorInfo, FourPoorType } from "./wealthBlockData";

interface EnhancedFourPoorRadarProps {
  mouthScore: number;
  handScore: number;
  eyeScore: number;
  heartScore: number;
  dominantPoor: FourPoorType;
}

const poorColors: Record<FourPoorType, { bg: string; text: string; gradient: string }> = {
  mouth: { bg: "bg-orange-500", text: "text-orange-500", gradient: "from-orange-400 to-orange-600" },
  hand: { bg: "bg-emerald-500", text: "text-emerald-500", gradient: "from-emerald-400 to-emerald-600" },
  eye: { bg: "bg-blue-500", text: "text-blue-500", gradient: "from-blue-400 to-blue-600" },
  heart: { bg: "bg-rose-500", text: "text-rose-500", gradient: "from-rose-400 to-rose-600" },
};

export function EnhancedFourPoorRadar({ 
  mouthScore, 
  handScore, 
  eyeScore, 
  heartScore, 
  dominantPoor 
}: EnhancedFourPoorRadarProps) {
  const dominantInfo = fourPoorInfo[dominantPoor];
  const dominantColor = poorColors[dominantPoor];

  const radarData = [
    { subject: "嘴穷", score: mouthScore, fullMark: 15, key: "mouth" as FourPoorType },
    { subject: "手穷", score: handScore, fullMark: 10, key: "hand" as FourPoorType },
    { subject: "眼穷", score: eyeScore, fullMark: 15, key: "eye" as FourPoorType },
    { subject: "心穷", score: heartScore, fullMark: 10, key: "heart" as FourPoorType },
  ];

  const maxScore = Math.max(mouthScore, handScore, eyeScore, heartScore);
  const totalScore = mouthScore + handScore + eyeScore + heartScore;

  const poorItems = [
    { key: "mouth" as FourPoorType, name: "嘴穷", score: mouthScore, max: 15, emoji: "💬" },
    { key: "hand" as FourPoorType, name: "手穷", score: handScore, max: 10, emoji: "✋" },
    { key: "eye" as FourPoorType, name: "眼穷", score: eyeScore, max: 15, emoji: "👀" },
    { key: "heart" as FourPoorType, name: "心穷", score: heartScore, max: 10, emoji: "💔" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl">
        {/* Header with gradient */}
        <div className={cn("bg-gradient-to-r p-4 text-white", dominantColor.gradient)}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <span className="text-3xl">{dominantInfo.emoji}</span>
            </div>
            <div>
              <p className="text-white/80 text-sm">🎯 主导行为卡点</p>
              <h3 className="text-xl font-bold">{dominantInfo.name}</h3>
              <p className="text-white/90 text-xs mt-0.5">{dominantInfo.description}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-5">
          {/* Radar Chart Section */}
          <div className="relative mb-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid 
                    stroke="hsl(var(--border))" 
                    strokeOpacity={0.5}
                    gridType="polygon"
                  />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={({ x, y, payload }) => {
                      const item = poorItems.find(p => p.name === payload.value);
                      const isDominant = item?.key === dominantPoor;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={4}
                            textAnchor="middle"
                            fill={isDominant ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                            fontSize={isDominant ? 13 : 11}
                            fontWeight={isDominant ? 600 : 400}
                          >
                            {item?.emoji} {payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <Radar
                    dataKey="score"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.3}
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg border">
                <div className="text-2xl font-bold text-foreground">{totalScore}</div>
                <div className="text-xs text-muted-foreground">总分</div>
              </div>
            </div>
          </div>

          {/* Score Bars */}
          <div className="space-y-3">
            {poorItems.map((item, idx) => {
              const percentage = (item.score / item.max) * 100;
              const isDominant = item.key === dominantPoor;
              const itemColor = poorColors[item.key];
              
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    isDominant ? "bg-amber-50 border-2 border-amber-200" : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.emoji}</span>
                      <span className={cn(
                        "font-medium",
                        isDominant ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.name}
                      </span>
                      {isDominant && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-medium">
                          主导
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-lg font-bold",
                        isDominant ? itemColor.text : "text-muted-foreground"
                      )}>
                        {item.score}
                      </span>
                      <span className="text-muted-foreground text-sm">/{item.max}</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        isDominant ? itemColor.bg : "bg-slate-400"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                    />
                  </div>
                  
                  {/* Severity indicator */}
                  <div className="flex justify-end mt-1">
                    <span className={cn(
                      "text-[10px]",
                      percentage <= 40 ? "text-emerald-600" :
                      percentage <= 70 ? "text-amber-600" : "text-rose-600"
                    )}>
                      {percentage <= 40 ? "健康" : percentage <= 70 ? "需关注" : "需调整"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Dominant Poor Detail */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className={cn(
              "mt-5 p-4 rounded-xl bg-gradient-to-br text-white",
              dominantColor.gradient
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{dominantInfo.emoji}</span>
              <div>
                <h4 className="font-bold mb-1">{dominantInfo.name}特征</h4>
                <p className="text-white/90 text-sm leading-relaxed">{dominantInfo.detail}</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <p className="text-sm">
                <span className="font-medium">💡 突破方向：</span>
                {dominantInfo.solution}
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

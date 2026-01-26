import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SCL90Factor, scl90FactorInfo, getFactorLevel } from "./scl90Data";
import { cn } from "@/lib/utils";

interface SCL90FactorRadarProps {
  factorScores: Record<SCL90Factor, number>;
  primarySymptom: SCL90Factor | null;
  secondarySymptom: SCL90Factor | null;
}

export function SCL90FactorRadar({ 
  factorScores, 
  primarySymptom, 
  secondarySymptom 
}: SCL90FactorRadarProps) {
  // Prepare radar data
  const radarData = Object.entries(scl90FactorInfo).map(([key, info]) => ({
    subject: `${info.emoji} ${info.name}`,
    score: factorScores[key as SCL90Factor] || 0,
    fullMark: 5,
    factor: key,
  }));

  // Sort factors by score for the bar list
  const sortedFactors = Object.entries(factorScores)
    .sort(([, a], [, b]) => b - a)
    .map(([key, score]) => ({
      key: key as SCL90Factor,
      score,
      info: scl90FactorInfo[key as SCL90Factor],
      level: getFactorLevel(score),
      isPrimary: key === primarySymptom,
      isSecondary: key === secondarySymptom,
    }));

  return (
    <motion.div
      initial={{ opacity: 0.01, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">📊</span>
            10因子雷达图
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Radar Chart */}
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 5]} 
                  tick={{ fontSize: 9 }}
                  tickCount={6}
                />
                <Radar 
                  name="因子得分" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number) => [value.toFixed(2), "得分"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Factor Score List */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              因子均分 ≥2.0 表示该维度需要关注
            </p>
            {sortedFactors.map((factor, idx) => (
              <motion.div
                key={factor.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.03 }}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  factor.isPrimary && "bg-red-50 dark:bg-red-950/30 ring-1 ring-red-200 dark:ring-red-800",
                  factor.isSecondary && "bg-orange-50 dark:bg-orange-950/30 ring-1 ring-orange-200 dark:ring-orange-800",
                  !factor.isPrimary && !factor.isSecondary && "bg-muted/30"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br",
                  factor.info.color
                )}>
                  <span className="text-sm">{factor.info.emoji}</span>
                </div>
                
                {/* Name + Tags */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{factor.info.name}</span>
                    {factor.isPrimary && (
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">主要</span>
                    )}
                    {factor.isSecondary && (
                      <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full">次要</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(factor.score / 5) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.4 + idx * 0.03 }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        factor.score >= 3 ? "from-red-500 to-rose-500" :
                        factor.score >= 2 ? "from-orange-500 to-amber-500" :
                        factor.score >= 1.5 ? "from-yellow-500 to-amber-400" :
                        "from-green-500 to-emerald-500"
                      )}
                    />
                  </div>
                </div>
                
                {/* Score */}
                <div className="text-right">
                  <span className={cn("text-sm font-bold tabular-nums", factor.level.color)}>
                    {factor.score.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{factor.level.level}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

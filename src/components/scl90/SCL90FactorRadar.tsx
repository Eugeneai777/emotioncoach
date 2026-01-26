import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { ChevronDown } from "lucide-react";

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
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Radar Chart - 响应式高度 */}
          <div className="h-[240px] sm:h-[280px] md:h-[320px]">
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

          {/* Factor Score List - 可展开详情 */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground mb-2">
              因子均分 ≥2.0 表示该维度需要关注，点击可展开详情
            </p>
            <Accordion type="single" collapsible className="space-y-1.5">
              {sortedFactors.map((factor, idx) => (
                <AccordionItem 
                  key={factor.key} 
                  value={factor.key}
                  className="border-0"
                >
                  <AccordionTrigger 
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-colors hover:no-underline [&[data-state=open]]:rounded-b-none",
                      factor.isPrimary && "bg-red-50 dark:bg-red-950/30 ring-1 ring-red-200 dark:ring-red-800",
                      factor.isSecondary && "bg-orange-50 dark:bg-orange-950/30 ring-1 ring-orange-200 dark:ring-orange-800",
                      !factor.isPrimary && !factor.isSecondary && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      {/* Icon */}
                      <div className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0",
                        factor.info.color
                      )}>
                        <span className="text-xs sm:text-sm">{factor.info.emoji}</span>
                      </div>
                      
                      {/* Name + Tags */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <span className="text-xs sm:text-sm font-medium">{factor.info.name}</span>
                          {factor.isPrimary && (
                            <span className="text-[9px] sm:text-[10px] bg-red-500 text-white px-1 sm:px-1.5 py-0.5 rounded-full">主要</span>
                          )}
                          {factor.isSecondary && (
                            <span className="text-[9px] sm:text-[10px] bg-orange-500 text-white px-1 sm:px-1.5 py-0.5 rounded-full">次要</span>
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
                      <div className="text-right flex-shrink-0">
                        <span className={cn("text-xs sm:text-sm font-bold tabular-nums", factor.level.color)}>
                          {factor.score.toFixed(2)}
                        </span>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">{factor.level.level}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent 
                    className={cn(
                      "px-3 pt-0 pb-3 rounded-b-lg",
                      factor.isPrimary && "bg-red-50 dark:bg-red-950/30",
                      factor.isSecondary && "bg-orange-50 dark:bg-orange-950/30",
                      !factor.isPrimary && !factor.isSecondary && "bg-muted/30"
                    )}
                  >
                    <div className="space-y-2 text-sm pt-2 border-t border-dashed border-border/50">
                      <p className="text-muted-foreground">{factor.info.description}</p>
                      <p className="text-xs">
                        <span className="text-muted-foreground">正常范围：</span>
                        <span className="font-medium">{factor.info.normalRange}</span>
                      </p>
                      {factor.score >= 2.0 && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          💡 建议：关注此维度的调适方法，可尝试正念练习或与信任的人倾诉，必要时寻求专业帮助
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

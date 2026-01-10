import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Brain, Target, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { useFourPoorProgress } from '@/hooks/useFourPoorProgress';
import { useReactionPatternProgress } from '@/hooks/useReactionPatternProgress';
import { fourPoorRichConfig, poorTypeKeys, PoorTypeKey } from '@/config/fourPoorConfig';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CombinedPersonalityCardProps {
  campId?: string;
  currentDay?: number;
  className?: string;
}

export function CombinedPersonalityCard({ campId, currentDay = 1, className }: CombinedPersonalityCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    baselineScores,
    currentScores,
    transformationRates,
    awarenessCount,
    dominantPoor,
    fastestProgress,
    isLoading: fourPoorLoading,
  } = useFourPoorProgress(campId);

  const { 
    patternConfig, 
    transformationRate: patternRate, 
    awakeningMomentsCount,
    isLoading: patternLoading 
  } = useReactionPatternProgress(campId);

  const isLoading = fourPoorLoading || patternLoading;
  const totalAwareness = Object.values(awarenessCount).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  // 计算综合转化率
  const avgTransformRate = Object.values(transformationRates).reduce((a, b) => a + b, 0) / 4;

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 pt-4 px-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧬</span>
                <h3 className="font-semibold text-sm">财富人格</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] p-3">
                      <div className="text-xs space-y-1.5">
                        <p className="font-medium">数据说明</p>
                        <p className="text-muted-foreground">综合四穷人格和反应模式的转化进度</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                {/* 综合进度预览 */}
                <Badge variant="secondary" className="text-xs">
                  转化 {avgTransformRate.toFixed(0)}%
                </Badge>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* 折叠时的预览 */}
            {!isOpen && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {dominantPoor && (
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    主导: {fourPoorRichConfig[dominantPoor].poorName}
                  </span>
                )}
                {patternConfig && (
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {patternConfig.name}
                  </span>
                )}
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CardContent className="px-4 pb-4 space-y-4 border-t">
                {/* 反应模式区块 */}
                {patternConfig && (
                  <div className="pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">反应模式</span>
                    </div>
                    <div className={cn("rounded-lg p-3", patternConfig.bgColor)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{patternConfig.emoji}</span>
                          <div>
                            <span className={cn("font-medium text-sm", patternConfig.textColor, patternConfig.darkTextColor)}>
                              {patternConfig.name}
                            </span>
                            <p className="text-xs text-muted-foreground">{patternConfig.tagline}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span>→</span>
                          <span>{patternConfig.transformation.toEmoji}</span>
                          <span className={cn("font-medium", patternConfig.textColor, patternConfig.darkTextColor)}>
                            {patternConfig.transformation.toName}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">转化进度</span>
                          <span className={cn("font-medium", patternConfig.textColor, patternConfig.darkTextColor)}>
                            {patternRate}%
                          </span>
                        </div>
                        <Progress value={patternRate} className="h-1.5" />
                      </div>
                      {/* 训练重点 */}
                      <div className="mt-2 pt-2 border-t border-current/10">
                        <div className="flex items-start gap-2">
                          <Target className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{patternConfig.trainingFocus}</p>
                        </div>
                      </div>
                    </div>
                    {awakeningMomentsCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        已累积 <span className="font-medium text-primary">{awakeningMomentsCount}</span> 个觉醒时刻
                      </p>
                    )}
                  </div>
                )}

                {/* 四穷人格区块 */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">四穷人格</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      Day {currentDay}/7
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {poorTypeKeys.map((key) => {
                      const config = fourPoorRichConfig[key];
                      const baseline = baselineScores[key];
                      const current = currentScores[key];
                      const rate = transformationRates[key];
                      const isDominant = dominantPoor === key;
                      const isFastest = fastestProgress === key && rate > 0;
                      const improvement = Math.max(0, baseline - current);

                      return (
                        <div
                          key={key}
                          className={cn(
                            "rounded-lg p-2.5 transition-all",
                            isDominant ? "ring-1 ring-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20" : "bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{config.poorEmoji}</span>
                              <span className="text-xs font-medium">{config.poorName}</span>
                              <span className="text-muted-foreground text-xs">→</span>
                              <span className="text-sm">{config.richEmoji}</span>
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                {config.richName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isDominant && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-amber-100 text-amber-700">
                                  主导
                                </Badge>
                              )}
                              {isFastest && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-emerald-100 text-emerald-700">
                                  最快
                                </Badge>
                              )}
                              <span className="text-xs font-semibold ml-1" style={{ color: config.color }}>
                                {rate}%
                              </span>
                            </div>
                          </div>
                          <Progress value={rate} className="h-1.5" />
                          {improvement > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                              <TrendingUp className="w-2.5 h-2.5" />
                              成长 +{improvement.toFixed(0)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {totalAwareness === 0 && !patternConfig && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    完成教练梳理后，将展示你的人格转化进度
                  </div>
                )}
              </CardContent>
            </motion.div>
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

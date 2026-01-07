import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useFourPoorProgress } from '@/hooks/useFourPoorProgress';
import { fourPoorRichConfig, poorTypeKeys, PoorTypeKey } from '@/config/fourPoorConfig';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FourPoorTrendChart } from './FourPoorTrendChart';

interface FourPersonalityCardProps {
  campId?: string;
  currentDay?: number;
  className?: string;
}

export function FourPersonalityCard({ campId, currentDay = 1, className }: FourPersonalityCardProps) {
  const [showTrend, setShowTrend] = useState(false);
  const {
    baselineScores,
    currentScores,
    transformationRates,
    awarenessCount,
    dominantPoor,
    fastestProgress,
    isLoading,
  } = useFourPoorProgress(campId);

  if (isLoading) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have any meaningful data
  const totalAwareness = Object.values(awarenessCount).reduce((a, b) => a + b, 0);
  
  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span>🧬</span>
            我的财富人格画像
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] p-3">
                  <div className="text-xs space-y-1.5">
                    <p className="font-medium">数据说明</p>
                    <p className="text-muted-foreground">四穷人格画像基于你的财富评估结果和每日觉察记录：</p>
                    <ul className="text-muted-foreground list-disc pl-3 space-y-0.5">
                      <li>测评分数：来自初始财富评估问卷</li>
                      <li>当前分数：基于日记中行为层的觉察累积</li>
                      <li>转化率：(测评分数 - 当前分数) / 测评分数 × 100%</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
          <Badge variant="outline" className="text-xs">
            Day {currentDay}/21
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4 space-y-3">
        {poorTypeKeys.map((key) => {
          const config = fourPoorRichConfig[key];
          const baseline = baselineScores[key];
          const current = currentScores[key];
          const rate = transformationRates[key];
          const count = awarenessCount[key];
          const isDominant = dominantPoor === key;
          const isFastest = fastestProgress === key && rate > 0;
          
          // Calculate improvement
          const improvement = Math.max(0, baseline - current);
          
          return (
            <div
              key={key}
              className={cn(
                "rounded-lg p-3 transition-all",
                isDominant ? "ring-1 ring-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20" : "bg-muted/30"
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.poorEmoji}</span>
                  <span className="font-medium text-sm">{config.poorName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-lg">{config.richEmoji}</span>
                  <span className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
                    {config.richName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isDominant && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      <Target className="w-2.5 h-2.5 mr-0.5" />
                      主导
                    </Badge>
                  )}
                  {isFastest && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                      最快
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="relative mb-2">
                <Progress 
                  value={rate} 
                  className="h-2"
                />
                <div 
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${rate}%`,
                    background: `linear-gradient(90deg, ${config.color}, ${config.color})`
                  }}
                />
              </div>
              
              {/* Stats row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>测评 {baseline.toFixed(0)}分</span>
                  <span>→</span>
                  <span className="text-foreground">当前 {current.toFixed(0)}分</span>
                  {improvement > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      ↓{improvement.toFixed(0)}
                    </span>
                  )}
                </div>
                <span className="font-medium" style={{ color: config.color }}>
                  转化 {rate}%
                </span>
              </div>
              
              {/* Awareness count */}
              {count > 0 && (
                <div className="mt-1 text-[10px] text-muted-foreground">
                  已觉察 {count} 次
                </div>
              )}
            </div>
          );
        })}
        
        {/* AI Insight */}
        {/* Trend Chart Toggle */}
        {totalAwareness > 0 && (
          <div className="border-t pt-3">
            <button
              onClick={() => setShowTrend(!showTrend)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                历史趋势图
              </span>
              {showTrend ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showTrend && (
              <div className="mt-3">
                <FourPoorTrendChart campId={campId} />
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  展示每日各类型觉醒深度的累积转化率
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Insight */}
        {totalAwareness > 0 && fastestProgress && (
          <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-100 dark:border-violet-800/30">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-violet-700 dark:text-violet-300">
                你的「{fourPoorRichConfig[fastestProgress].poorName}→{fourPoorRichConfig[fastestProgress].richName}」
                转化最显著！{fourPoorRichConfig[fastestProgress].suggestion}
              </p>
            </div>
          </div>
        )}
        
        {totalAwareness === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            完成教练梳理后，将展示你的四穷转化进度
          </div>
        )}
      </CardContent>
    </Card>
  );
}

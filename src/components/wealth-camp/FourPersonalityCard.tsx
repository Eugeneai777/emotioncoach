import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, HelpCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
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

// AI-generated growth suggestions based on transformation progress
const generateAISuggestions = (
  dominantPoor: PoorTypeKey | null,
  fastestProgress: PoorTypeKey | null,
  transformationRates: Record<PoorTypeKey, number>,
  currentDay: number
): { title: string; suggestion: string; action: string } | null => {
  if (!dominantPoor) return null;

  const dominantRate = transformationRates[dominantPoor] || 0;
  const fastestRate = fastestProgress ? transformationRates[fastestProgress] : 0;

  // Determine the suggestion based on progress state
  if (currentDay <= 7) {
    // Early stage - focus on awareness
    return {
      title: '觉察期建议',
      suggestion: `你正处于觉察初期，「${fourPoorRichConfig[dominantPoor].poorName}」是你的主要模式。这周的重点是：每当感受到匮乏感时，先停下来问自己"我现在在害怕什么？"`,
      action: `今天尝试：当"${fourPoorRichConfig[dominantPoor].poorName}"模式出现时，用手轻触心口，对自己说"我看见你了"`,
    };
  } else if (currentDay <= 14) {
    // Middle stage - focus on transformation
    if (dominantRate < 20) {
      return {
        title: '深度突破建议',
        suggestion: `你的「${fourPoorRichConfig[dominantPoor].poorName}」模式转化较慢（${dominantRate}%），这很正常——它可能是最根深蒂固的模式。试着不把它当作"敌人"，而是一个需要被理解的老朋友。`,
        action: `写下3个"${fourPoorRichConfig[dominantPoor].poorName}"模式曾经保护过你的时刻，感谢它，然后温柔地告诉它：我现在安全了`,
      };
    } else {
      return {
        title: '巩固期建议',
        suggestion: fastestProgress 
          ? `太棒了！你的「${fourPoorRichConfig[fastestProgress].poorName}→${fourPoorRichConfig[fastestProgress].richName}」转化率已达${fastestRate}%。现在是强化新神经回路的关键期。`
          : `你的整体转化进展良好，继续保持觉察。`,
        action: fastestProgress 
          ? `每天睡前回顾：今天我有哪个瞬间体现了"${fourPoorRichConfig[fastestProgress].richName}"的特质？把它写下来作为明天的提醒`
          : `每天记录一个"我选择丰盛"的时刻`,
      };
    }
  } else {
    // Final stage - integration
    const avgRate = Object.values(transformationRates).reduce((a, b) => a + b, 0) / 4;
    if (avgRate >= 50) {
      return {
        title: '整合期成就',
        suggestion: `7天旅程接近尾声，你的平均转化率已达${avgRate.toFixed(0)}%！这不是终点，而是新的开始。你已经学会了觉察自己的穷模式，这个能力将伴随你一生。`,
        action: '写一封信给7天前的自己，告诉TA你这段旅程最大的收获',
      };
    } else {
      return {
        title: '最后冲刺建议',
        suggestion: `还有最后几天，专注于你最想突破的一个模式。改变不需要完美，只需要比昨天多一点点觉察。`,
        action: `选择一个你最想改变的"穷模式"，今天刻意做一件与之相反的事`,
      };
    }
  }
};

export function FourPersonalityCard({ campId, currentDay = 1, className }: FourPersonalityCardProps) {
  const [showTrend, setShowTrend] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
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
  
  // Generate AI suggestions
  const aiSuggestions = generateAISuggestions(
    dominantPoor,
    fastestProgress,
    transformationRates,
    currentDay
  );
  
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
            Day {currentDay}/7
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

        {/* AI Generated Personalized Suggestions */}
        {totalAwareness > 0 && aiSuggestions && (
          <div className="border-t pt-3">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium text-foreground">AI 成长建议</span>
              </span>
              {showSuggestions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showSuggestions && (
              <div className="space-y-3">
                {/* Main suggestion */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-800/30">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                        {aiSuggestions.title}
                      </p>
                      <p className="text-xs text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
                        {aiSuggestions.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action step */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                        下一步行动
                      </p>
                      <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80 leading-relaxed">
                        {aiSuggestions.action}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legacy insight - keep for backward compatibility */}
        {totalAwareness > 0 && fastestProgress && !aiSuggestions && (
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

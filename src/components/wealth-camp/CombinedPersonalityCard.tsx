import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useFourPoorProgress } from '@/hooks/useFourPoorProgress';
import { useReactionPatternProgress } from '@/hooks/useReactionPatternProgress';
import { fourPoorRichConfig, poorTypeKeys, PoorTypeKey } from '@/config/fourPoorConfig';
import { cn } from '@/lib/utils';

interface CombinedPersonalityCardProps {
  campId?: string;
  currentDay?: number;
  className?: string;
}

// 语义化进度描述 - 让用户一目了然
const getProgressSemantic = (rate: number) => {
  if (rate >= 80) return { label: '自在流动', description: '已完成这一层转化', emoji: '🌟', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  if (rate >= 60) return { label: '深度觉醒', description: '新模式正在稳固', emoji: '✨', color: 'text-green-600', bg: 'bg-green-100' };
  if (rate >= 40) return { label: '稳步转化', description: '行为正在改变', emoji: '🌱', color: 'text-amber-600', bg: 'bg-amber-100' };
  if (rate >= 20) return { label: '初步觉醒', description: '开始看见内在模式', emoji: '🌿', color: 'text-orange-600', bg: 'bg-orange-100' };
  return { label: '刚刚起步', description: '正在建立觉察习惯', emoji: '🌰', color: 'text-muted-foreground', bg: 'bg-muted' };
};

export function CombinedPersonalityCard({ campId, currentDay = 1, className }: CombinedPersonalityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    transformationRates,
    awarenessCount,
    dominantPoor,
    isLoading: fourPoorLoading,
  } = useFourPoorProgress(campId);
  
  const {
    patternConfig,
    transformationRate: reactionTransformRate,
    isLoading: patternLoading,
  } = useReactionPatternProgress(campId);

  const isLoading = fourPoorLoading || patternLoading;

  if (isLoading) {
    return (
      <Card className={cn("shadow-sm animate-pulse", className)}>
        <CardContent className="p-4 h-32" />
      </Card>
    );
  }

  // 计算平均转化率
  const avgRate = Math.round(
    (transformationRates.mouth + transformationRates.hand + transformationRates.eye + transformationRates.heart) / 4
  );

  const overallSemantic = getProgressSemantic(avgRate);

  // 获取主导人格配置
  const dominantConfig = dominantPoor ? fourPoorRichConfig[dominantPoor as PoorTypeKey] : null;
  const dominantAwarenessCount = dominantPoor ? awarenessCount[dominantPoor as PoorTypeKey] : 0;

  // 如果没有数据
  if (!patternConfig && !dominantConfig && avgRate === 0) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          <div className="text-2xl mb-2">🧬</div>
          <p>完成教练对话后，这里将展示你的财富人格画像</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-sm", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧬</span>
              <span className="font-semibold text-sm">我的财富人格</span>
            </div>
            <Badge variant="secondary" className={cn("text-xs", overallSemantic.bg, overallSemantic.color)}>
              {overallSemantic.emoji} {overallSemantic.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4">
          {/* 核心信息1：反应模式 - 简化显示 */}
          {patternConfig && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">财富反应模式</span>
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", patternConfig.textColor)}>
                    {patternConfig.emoji} {patternConfig.name}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-emerald-600">
                    {patternConfig.transformation.toEmoji} {patternConfig.transformation.toName}
                  </span>
                </div>
              </div>
              <Progress value={reactionTransformRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {reactionTransformRate >= 50 
                  ? `🎉 正在从${patternConfig.transformation.from}走向${patternConfig.transformation.toName}` 
                  : `💡 ${patternConfig.description}`}
              </p>
            </div>
          )}

          {/* 核心信息2：主导人格 + 觉察次数 - 简化突出 */}
          {dominantConfig && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-200/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    你最需要突破的是：
                    <span className="ml-1 text-amber-700 dark:text-amber-300">
                      {dominantConfig.poorEmoji} {dominantConfig.poorName}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dominantConfig.transformation}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600">
                    {dominantAwarenessCount}
                  </div>
                  <div className="text-[10px] text-muted-foreground">次觉察</div>
                </div>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 pt-2 border-t border-amber-200/50">
                <Sparkles className="w-3 h-3 inline mr-1" />
                坚持觉察，每一次看见都在累积改变
              </p>
            </div>
          )}

          {/* 折叠触发器 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground py-1 transition-colors">
              {isExpanded ? (
                <>收起详情 <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>查看四穷详情 <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </CollapsibleTrigger>

          {/* 折叠内容：四穷详情 - 添加语义化解释 */}
          <CollapsibleContent className="space-y-3">
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-3">四穷转化详情</p>
              
              {poorTypeKeys.map((key) => {
                const config = fourPoorRichConfig[key];
                const rate = transformationRates[key];
                const semantic = getProgressSemantic(rate);
                const count = awarenessCount[key];
                const isDominant = key === dominantPoor;

                return (
                  <div key={key} className={cn(
                    "space-y-1.5 py-2",
                    isDominant && "bg-amber-50/50 dark:bg-amber-900/10 -mx-1 px-1 rounded"
                  )}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span>{config.poorEmoji}</span>
                        <span className="text-amber-700 dark:text-amber-300">{config.poorName}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{config.richEmoji}</span>
                        <span className="text-emerald-600">{config.richName}</span>
                        {isDominant && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 ml-1 border-amber-300 text-amber-600">
                            重点
                          </Badge>
                        )}
                      </span>
                      <span className={cn("font-medium", semantic.color)}>
                        {rate}%
                      </span>
                    </div>
                    <Progress value={rate} className="h-1.5" />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{semantic.emoji} {semantic.description}</span>
                      <span>觉察 {count} 次</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

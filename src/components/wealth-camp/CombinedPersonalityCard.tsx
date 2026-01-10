import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Sparkles, Target } from 'lucide-react';
import { useFourPoorProgress } from '@/hooks/useFourPoorProgress';
import { useReactionPatternProgress } from '@/hooks/useReactionPatternProgress';
import { fourPoorRichConfig, poorTypeKeys, PoorTypeKey } from '@/config/fourPoorConfig';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CombinedPersonalityCardProps {
  campId?: string;
  currentDay?: number;
  className?: string;
}

// 进度条颜色分级 - 一眼看出状态
const getProgressColor = (rate: number) => {
  if (rate >= 80) return 'bg-emerald-500';    // 深绿 - 完成
  if (rate >= 60) return 'bg-green-500';      // 绿色 - 接近完成
  if (rate >= 40) return 'bg-amber-500';      // 黄色 - 稳步进步
  if (rate >= 20) return 'bg-orange-500';     // 橙色 - 初步觉醒
  return 'bg-red-400';                         // 红色 - 需要关注
};

// 语义化进度描述
const getProgressSemantic = (rate: number) => {
  if (rate >= 80) return { label: '自在流动', description: '已完成这一层转化', emoji: '✨', color: 'text-emerald-600' };
  if (rate >= 60) return { label: '深度觉醒', description: '新模式正在稳固', emoji: '🌟', color: 'text-green-600' };
  if (rate >= 40) return { label: '稳步转化', description: '行为正在改变', emoji: '💫', color: 'text-amber-600' };
  if (rate >= 20) return { label: '初步觉醒', description: '开始看见内在模式', emoji: '🌱', color: 'text-orange-600' };
  return { label: '需要关注', description: '这是你的突破重点', emoji: '🎯', color: 'text-red-500' };
};

// 觉察里程碑系统 - 让觉察次数有意义
const getAwarenessMilestone = (count: number) => {
  if (count >= 21) return { emoji: '🌟', label: '习惯养成', next: null, nextCount: null };
  if (count >= 14) return { emoji: '🌲', label: '茁壮成长', next: '🌟习惯养成', nextCount: 21 };
  if (count >= 7) return { emoji: '🌳', label: '根基稳固', next: '🌲茁壮成长', nextCount: 14 };
  if (count >= 3) return { emoji: '🌿', label: '开始生长', next: '🌳根基稳固', nextCount: 7 };
  if (count >= 1) return { emoji: '🌱', label: '种子萌芽', next: '🌿开始生长', nextCount: 3 };
  return { emoji: '💤', label: '等待觉察', next: '🌱种子萌芽', nextCount: 1 };
};

// 彩色进度条组件
const ColoredProgressBar = ({ value, className }: { value: number; className?: string }) => {
  const colorClass = getProgressColor(value);
  return (
    <div className={cn("h-2 w-full bg-muted rounded-full overflow-hidden", className)}>
      <motion.div
        className={cn("h-full rounded-full", colorClass)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
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
  const dominantRate = dominantPoor ? transformationRates[dominantPoor as PoorTypeKey] : 0;
  const dominantMilestone = getAwarenessMilestone(dominantAwarenessCount);
  const dominantSemantic = getProgressSemantic(dominantRate);

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
            <Badge variant="secondary" className={cn("text-xs", overallSemantic.color)}>
              {overallSemantic.emoji} {overallSemantic.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4">
          {/* 核心信息1：反应模式 - 彩色进度条 */}
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
              <ColoredProgressBar value={reactionTransformRate} />
              <p className="text-xs text-muted-foreground">
                {reactionTransformRate >= 50 
                  ? `🎉 正在从${patternConfig.transformation.from}走向${patternConfig.transformation.toName}` 
                  : `💡 ${patternConfig.description}`}
              </p>
            </div>
          )}

          {/* 核心信息2：主导人格 - 彩色进度条 + 里程碑 + 行动建议 */}
          {dominantConfig && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-200/50 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">你最需要突破的是</span>
                <span className="text-base font-semibold text-amber-700 dark:text-amber-300">
                  {dominantConfig.poorEmoji} {dominantConfig.poorName}
                </span>
              </div>

              {/* 彩色进度条 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={dominantSemantic.color}>{dominantSemantic.label}</span>
                  <span className="font-semibold">{dominantRate}%</span>
                </div>
                <ColoredProgressBar value={dominantRate} />
              </div>

              {/* 里程碑系统 */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <span>{dominantMilestone.emoji}</span>
                  <span className="text-muted-foreground">{dominantMilestone.label}</span>
                  <span className="font-medium">· 觉察 {dominantAwarenessCount} 次</span>
                </span>
                {dominantMilestone.next && dominantMilestone.nextCount && (
                  <span className="text-muted-foreground">
                    再{dominantMilestone.nextCount - dominantAwarenessCount}次 → {dominantMilestone.next}
                  </span>
                )}
              </div>

              {/* 今日行动建议 */}
              <div className="flex items-start gap-2 pt-2 border-t border-amber-200/50">
                <span className="text-amber-500 mt-0.5">📌</span>
                <div className="text-xs">
                  <span className="text-muted-foreground">今日行动：</span>
                  <span className="font-medium text-amber-700 dark:text-amber-300">{dominantConfig.suggestion}</span>
                </div>
              </div>
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

          {/* 折叠内容：四穷详情 - 彩色进度条 + 里程碑 + 行动建议 */}
          <CollapsibleContent className="space-y-3">
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                四穷转化详情
              </p>
              
              {poorTypeKeys.map((key, index) => {
                const config = fourPoorRichConfig[key];
                const rate = transformationRates[key];
                const semantic = getProgressSemantic(rate);
                const count = awarenessCount[key];
                const isDominant = key === dominantPoor;
                const milestone = getAwarenessMilestone(count);

                return (
                  <motion.div 
                    key={key} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "space-y-2 py-3 px-2 rounded-lg mb-2",
                      isDominant 
                        ? "bg-amber-500/10 border border-amber-500/30" 
                        : "bg-muted/30"
                    )}
                  >
                    {/* 标题行 */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{config.poorEmoji}</span>
                        <span className="font-medium">{config.poorName} → {config.richName}</span>
                        {isDominant && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 border-amber-300 text-amber-600">
                            重点
                          </Badge>
                        )}
                      </span>
                      <span className={cn("font-semibold", semantic.color)}>
                        {rate}%
                      </span>
                    </div>

                    {/* 彩色进度条 */}
                    <ColoredProgressBar value={rate} className="h-1.5" />

                    {/* 里程碑 */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span>{milestone.emoji}</span>
                        <span>{milestone.label}</span>
                        <span className="text-foreground">· {count}次觉察</span>
                      </span>
                      {milestone.next && milestone.nextCount && (
                        <span className="text-muted-foreground">
                          +{milestone.nextCount - count}次 → {milestone.next}
                        </span>
                      )}
                    </div>

                    {/* 行动建议 */}
                    <div className="text-[10px] text-muted-foreground pt-1.5 border-t border-border/30">
                      <span className="text-amber-500">📌</span> {config.suggestion}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

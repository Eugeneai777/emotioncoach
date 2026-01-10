import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Sparkles, Target, HelpCircle, Star, TrendingUp, BookOpen, Brain, Heart } from 'lucide-react';
import { useFourPoorProgress } from '@/hooks/useFourPoorProgress';
import { useLayerProgress, LayerProgressData } from '@/hooks/useLayerProgress';
import { fourPoorRichConfig, PoorTypeKey } from '@/config/fourPoorConfig';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CombinedPersonalityCardProps {
  campId?: string;
  currentDay?: number;
  className?: string;
  onNavigateToTask?: (taskKey: string) => void;
}

// 觉察里程碑系统 - 让觉察次数有意义
const getAwarenessMilestone = (count: number) => {
  if (count >= 21) return { emoji: '🌟', label: '习惯养成', next: null, nextCount: null };
  if (count >= 14) return { emoji: '🌲', label: '茁壮成长', next: '🌟习惯养成', nextCount: 21 };
  if (count >= 7) return { emoji: '🌳', label: '根基稳固', next: '🌲茁壮成长', nextCount: 14 };
  if (count >= 3) return { emoji: '🌿', label: '开始生长', next: '🌳根基稳固', nextCount: 7 };
  if (count >= 1) return { emoji: '🌱', label: '种子萌芽', next: '🌿开始生长', nextCount: 3 };
  return { emoji: '💤', label: '等待觉察', next: '🌱种子萌芽', nextCount: 1 };
};

// Star display component
const StarDisplay = ({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) => {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  const sizeClass = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i}
          className={cn(
            sizeClass,
            i < fullStars ? 'fill-amber-400 text-amber-400' :
            i === fullStars && hasHalf ? 'fill-amber-400/50 text-amber-400' :
            'fill-muted text-muted'
          )}
        />
      ))}
    </span>
  );
};

// Progress bar with Day 0 marker
const LayerProgressBar = ({ 
  baseline, 
  current, 
  colorClass 
}: { 
  baseline: number; 
  current: number; 
  colorClass: string;
}) => {
  return (
    <div className="relative h-2.5 bg-muted/30 rounded-full overflow-hidden">
      {/* Baseline marker - dashed line */}
      <div 
        className="absolute top-0 h-full border-r-2 border-dashed border-muted-foreground/50 z-10"
        style={{ left: `${Math.min(baseline, 100)}%` }}
      />
      {/* Baseline fill - grey */}
      <div 
        className="absolute top-0 h-full bg-muted-foreground/20 rounded-full"
        style={{ width: `${baseline}%` }}
      />
      {/* Current fill - colored */}
      <motion.div 
        className={cn("absolute top-0 h-full rounded-full", colorClass)}
        initial={{ width: 0 }}
        animate={{ width: `${current}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
};

// Single layer section component
const LayerSection = ({ 
  layer, 
  onNavigateToTask 
}: { 
  layer: LayerProgressData; 
  onNavigateToTask?: (taskKey: string) => void;
}) => {
  const growthColor = layer.growthPercent > 0 ? 'text-emerald-600' : 'text-muted-foreground';
  const colorClass = layer.key === 'behavior' ? 'bg-amber-500' : 
                     layer.key === 'emotion' ? 'bg-pink-500' : 'bg-violet-500';

  // Format attribution text
  const attributionParts: string[] = [];
  if (layer.attribution.coachingCount > 0) {
    attributionParts.push(`${layer.attribution.coachingCount}次教练梳理`);
  }
  if (layer.attribution.meditationCount > 0) {
    attributionParts.push(`${layer.attribution.meditationCount}次冥想反思`);
  }
  if (layer.key === 'belief' && layer.attribution.newBeliefCount > 0) {
    attributionParts.push(`${layer.attribution.newBeliefCount}条新信念`);
  }

  return (
    <div className={cn("rounded-lg p-3 space-y-2.5 border", layer.bgClass, 
      layer.key === 'behavior' ? 'border-amber-200/50' :
      layer.key === 'emotion' ? 'border-pink-200/50' : 'border-violet-200/50'
    )}>
      {/* Header with transformation */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <span className="text-base">{layer.emoji}</span>
          <span>{layer.label}</span>
          <span className="text-xs text-muted-foreground">
            ({layer.transformationFrom}{layer.transformationTo})
          </span>
        </span>
        <span className={cn("text-sm font-semibold", growthColor)}>
          {layer.growthStars > 0 ? '+' : ''}{layer.growthStars}★
        </span>
      </div>

      {/* Day 0 → Current with stars */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Day 0:</span>
        <StarDisplay value={layer.baselineStars} />
        <span className="text-muted-foreground mx-1">→</span>
        <span className={layer.textClass}>当前:</span>
        <StarDisplay value={layer.currentStars} />
      </div>

      {/* Progress bar */}
      <LayerProgressBar 
        baseline={layer.baselinePercent} 
        current={layer.currentPercent} 
        colorClass={colorClass}
      />

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>起点 {layer.baselinePercent}%</span>
        <span className={layer.currentPercent > layer.baselinePercent ? 'text-foreground font-medium' : ''}>
          当前 {layer.currentPercent}%
        </span>
      </div>

      {/* Attribution: What was done */}
      {attributionParts.length > 0 && (
        <div className="flex items-start gap-1.5 text-xs pt-1 border-t border-current/10">
          <span className="text-emerald-500 mt-0.5">✅</span>
          <span className="text-muted-foreground">
            做了什么：<span className="text-foreground">{attributionParts.join(' + ')}</span>
          </span>
        </div>
      )}

      {/* Next step */}
      <div 
        className={cn(
          "flex items-start gap-1.5 text-xs",
          onNavigateToTask && "cursor-pointer hover:opacity-80"
        )}
        onClick={() => onNavigateToTask?.(layer.nextStepTaskKey)}
      >
        <span className="text-amber-500 mt-0.5">📌</span>
        <span className="text-muted-foreground">
          下一步：<span className={cn("font-medium", layer.textClass)}>{layer.nextStep}</span>
        </span>
      </div>
    </div>
  );
};

export function CombinedPersonalityCard({ 
  campId, 
  currentDay = 1, 
  className,
  onNavigateToTask,
}: CombinedPersonalityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    layers,
    overall,
    fastestLayer,
    needsWorkLayer,
    isLoading: layerLoading,
  } = useLayerProgress(campId);

  const {
    transformationRates,
    awarenessCount,
    awarenessBreakdown,
    dominantPoor,
    isLoading: fourPoorLoading,
  } = useFourPoorProgress(campId);

  const isLoading = layerLoading || fourPoorLoading;

  if (isLoading) {
    return (
      <Card className={cn("shadow-sm animate-pulse", className)}>
        <CardContent className="p-4 h-32" />
      </Card>
    );
  }

  // If no data at all
  if (overall.currentAwakening === 0 && layers.every(l => l.attribution.journalCount === 0)) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          <div className="text-2xl mb-2">🧬</div>
          <p>完成教练对话后，这里将展示你的财富人格画像</p>
        </CardContent>
      </Card>
    );
  }

  // Get dominant poor config
  const dominantConfig = dominantPoor ? fourPoorRichConfig[dominantPoor as PoorTypeKey] : null;
  const dominantAwarenessCount = dominantPoor ? awarenessCount[dominantPoor as PoorTypeKey] : 0;
  const dominantBreakdown = dominantPoor ? awarenessBreakdown[dominantPoor as PoorTypeKey] : { journal: 0, challenge: 0 };
  const dominantRate = dominantPoor ? transformationRates[dominantPoor as PoorTypeKey] : 0;
  const dominantMilestone = getAwarenessMilestone(dominantAwarenessCount);

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-semibold text-sm">我的财富人格</span>
          </div>
          <Badge variant="secondary" className={cn("text-xs", overall.statusColor)}>
            {overall.statusEmoji} {overall.statusLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {/* Overall Awakening Index with calculation explanation */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              综合觉醒指数
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] p-3">
                  <div className="text-xs space-y-1.5">
                    <p className="font-medium">计算方式</p>
                    <p className="text-muted-foreground">
                      综合觉醒指数 = 最佳3天三层平均分转换<br/>
                      (行为 + 情绪 + 信念) / 3 → 0-100
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Day 0 → Current with progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Day 0: <span className="font-semibold text-foreground">{overall.baselineAwakening}</span></span>
              <span className="text-muted-foreground mx-2">→</span>
              <span className="text-primary font-bold text-lg">{overall.currentAwakening}</span>
              {overall.growthAwakening > 0 && (
                <span className="text-emerald-600 font-medium text-sm ml-2">
                  +{overall.growthAwakening} ↑
                </span>
              )}
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              {/* Baseline marker */}
              <div 
                className="absolute h-2 border-r-2 border-dashed border-muted-foreground/50 z-10"
                style={{ left: `${Math.min(overall.baselineAwakening, 100)}%` }}
              />
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overall.currentAwakening}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Calculation method */}
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            计算方式：{overall.calculationMethod}
          </div>
        </div>

        {/* Three Layer Progress */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            三层觉醒进度
            <span className="text-[10px] text-muted-foreground/70">灰线=Day 0 · 彩色=当前</span>
          </div>

          {layers.map((layer, index) => (
            <motion.div
              key={layer.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <LayerSection layer={layer} onNavigateToTask={onNavigateToTask} />
            </motion.div>
          ))}
        </div>

        {/* Growth Insight */}
        {fastestLayer && fastestLayer.growthPercent > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-emerald-200/50">
            <div className="text-xs text-emerald-700 dark:text-emerald-300">
              ✨ <strong>{fastestLayer.label}</strong>成长最快，已提升 {fastestLayer.growthPercent}%！
              {needsWorkLayer && needsWorkLayer.key !== fastestLayer.key && needsWorkLayer.currentPercent < 50 && (
                <span className="block mt-1 text-emerald-600/80">
                  💡 <strong>{needsWorkLayer.label}</strong>是深层突破的关键
                </span>
              )}
            </div>
          </div>
        )}

        {/* Four Poor Focus Section - Collapsible */}
        {dominantConfig && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200/50">
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">转化重点</span>
                  <span className="text-base font-semibold text-amber-700 dark:text-amber-300">
                    {dominantConfig.poorEmoji} {dominantConfig.poorName}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">转化进度</span>
                    <span className="font-semibold">{dominantRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, dominantRate)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Milestone */}
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span>{dominantMilestone.emoji}</span>
                    <span className="text-muted-foreground">{dominantMilestone.label}</span>
                    <span className="font-medium">· 觉察 {dominantAwarenessCount} 次</span>
                    {dominantAwarenessCount > 0 && (
                      <span className="text-muted-foreground text-[10px]">
                        (📖{dominantBreakdown.journal} + 🎯{dominantBreakdown.challenge})
                      </span>
                    )}
                  </span>
                  {dominantMilestone.next && dominantMilestone.nextCount && (
                    <span className="text-muted-foreground">
                      +{dominantMilestone.nextCount - dominantAwarenessCount}次 → {dominantMilestone.next}
                    </span>
                  )}
                </div>

                {/* Action suggestion */}
                <div className="flex items-start gap-2 pt-2 border-t border-amber-200/50">
                  <span className="text-amber-500 mt-0.5">📌</span>
                  <div className="text-xs">
                    <span className="text-muted-foreground">今日行动：</span>
                    <span className="font-medium text-amber-700 dark:text-amber-300">{dominantConfig.suggestion}</span>
                  </div>
                </div>
              </div>

              {/* Expand trigger */}
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground py-2 border-t border-amber-200/30 transition-colors">
                  {isExpanded ? (
                    <>收起四穷详情 <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>查看四穷详情 <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </CollapsibleTrigger>

              {/* Collapsed content: Four Poor details */}
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2 border-t border-amber-200/30 pt-3">
                  {(['mouth', 'hand', 'eye', 'heart'] as const).map((key) => {
                    const config = fourPoorRichConfig[key];
                    const rate = transformationRates[key];
                    const count = awarenessCount[key];
                    const breakdown = awarenessBreakdown[key];
                    const isDominant = key === dominantPoor;

                    return (
                      <div 
                        key={key}
                        className={cn(
                          "flex items-center gap-2 text-xs p-2 rounded",
                          isDominant ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/30"
                        )}
                      >
                        <span className="text-base">{config.poorEmoji}</span>
                        <span className="font-medium flex-1">{config.poorName}</span>
                        <span className="text-muted-foreground">{count}次觉察</span>
                        <span className="font-semibold w-10 text-right">{rate}%</span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Heart, Brain, TrendingUp, TrendingDown, Sparkles, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoreStars, getAwakeningLevel } from '@/components/ui/score-stars';
import { cardBaseStyles } from '@/config/cardStyleConfig';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ArchiveHeroCardProps {
  totalDays: number;
  maxDays?: number;
  avgBehavior: string;
  avgEmotion: string;
  avgBelief: string;
  prevWeekBehavior?: number;
  prevWeekEmotion?: number;
  prevWeekBelief?: number;
  awakeningIndex?: number; // 0-100 scale
  trendChange?: number;
  className?: string;
}

export function ArchiveHeroCard({
  totalDays,
  maxDays = 7,
  avgBehavior,
  avgEmotion,
  avgBelief,
  prevWeekBehavior = 0,
  prevWeekEmotion = 0,
  prevWeekBelief = 0,
  awakeningIndex = 0,
  trendChange = 0,
  className,
}: ArchiveHeroCardProps) {
  const behaviorScore = parseFloat(avgBehavior) || 0;
  const emotionScore = parseFloat(avgEmotion) || 0;
  const beliefScore = parseFloat(avgBelief) || 0;

  // Calculate awakening index from scores if not provided
  const calculatedIndex = useMemo(() => {
    if (awakeningIndex > 0) return awakeningIndex;
    const scores = [behaviorScore, emotionScore, beliefScore].filter(s => s > 0);
    if (scores.length === 0) return 0;
    // Convert 1-5 scale to 0-100
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length / 5) * 100);
  }, [awakeningIndex, behaviorScore, emotionScore, beliefScore]);

  const level = getAwakeningLevel(calculatedIndex);
  const targetIndex = calculatedIndex < 80 ? 80 : 100;
  const distanceToTarget = targetIndex - calculatedIndex;

  const progressPercent = Math.round((totalDays / maxDays) * 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Calculate week-over-week changes
  const behaviorChange = prevWeekBehavior > 0 ? behaviorScore - prevWeekBehavior : 0;
  const emotionChange = prevWeekEmotion > 0 ? emotionScore - prevWeekEmotion : 0;
  const beliefChange = prevWeekBelief > 0 ? beliefScore - prevWeekBelief : 0;

  // Find highlight dimension
  const changes = [
    { name: '行为', change: behaviorChange },
    { name: '情绪', change: emotionChange },
    { name: '信念', change: beliefChange },
  ];
  const highlight = changes.reduce((max, c) => c.change > max.change ? c : max, changes[0]);

  return (
    <Card className={cn(
      cardBaseStyles.container,
      "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white border-0 overflow-hidden",
      className
    )}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <h3 className="font-semibold text-amber-50">我的觉醒旅程</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-white/10 transition-colors">
                  <HelpCircle className="w-4 h-4 text-amber-200" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[280px] p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-1">🎯 觉醒指数 (0-100)</p>
                    <p className="text-muted-foreground text-xs">综合衡量对财富卡点的觉察与转化能力</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">⭐ 星级评价 (1-5)</p>
                    <p className="text-muted-foreground text-xs">每日觉察深度的细粒度评分</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    星级是每天的"快照"，指数是整体"趋势"
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Main: Progress Ring + Awakening Index */}
        <div className="flex items-start gap-4 mb-5">
          {/* Progress Ring */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold leading-none">Day</span>
              <span className="text-sm font-medium">{totalDays}/{maxDays}</span>
            </div>
          </div>

          {/* Awakening Index */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl font-bold">{calculatedIndex}</span>
              <span className="text-amber-200 text-sm">/ 100</span>
              {trendChange !== 0 && (
                <span className={cn(
                  "text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                  trendChange > 0 ? "bg-green-500/30 text-green-100" : "bg-amber-500/30 text-amber-100"
                )}>
                  {trendChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {trendChange > 0 ? '+' : ''}{trendChange.toFixed(0)}
                </span>
              )}
            </div>
            
            {/* Progress bar to target */}
            <div className="relative h-2 bg-white/20 rounded-full mb-2 overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-white/90 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(calculatedIndex, 100)}%` }}
              />
              {/* Target marker */}
              <div 
                className="absolute top-0 h-full w-0.5 bg-amber-200"
                style={{ left: `${targetIndex}%` }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className={cn("px-2 py-0.5 rounded-full font-medium", level.bgColor, level.color.replace('text-', 'text-'))}>
                {level.label}
              </span>
              {distanceToTarget > 0 && (
                <span className="text-amber-100">
                  距离「{calculatedIndex < 80 ? '深度觉醒' : '完全觉醒'}」还差 {distanceToTarget} 分
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Three Dimensions with Stars */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Behavior */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-full bg-amber-300/30 flex items-center justify-center">
                <Target className="w-3 h-3 text-amber-100" />
              </div>
              <span className="text-xs text-amber-100">行为流动度</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    i < Math.round(behaviorScore) ? "bg-amber-200" : "bg-white/20"
                  )}
                />
              ))}
              <span className="text-sm font-medium ml-1">{behaviorScore.toFixed(1)}</span>
            </div>
            {behaviorChange !== 0 && (
              <div className={cn(
                "text-[10px] flex items-center gap-0.5",
                behaviorChange > 0 ? "text-green-200" : "text-amber-200"
              )}>
                {behaviorChange > 0 ? '↑' : '↓'}{Math.abs(behaviorChange).toFixed(1)} vs上周
              </div>
            )}
          </div>

          {/* Emotion */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-full bg-pink-300/30 flex items-center justify-center">
                <Heart className="w-3 h-3 text-pink-100" />
              </div>
              <span className="text-xs text-amber-100">情绪稳定度</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    i < Math.round(emotionScore) ? "bg-pink-200" : "bg-white/20"
                  )}
                />
              ))}
              <span className="text-sm font-medium ml-1">{emotionScore.toFixed(1)}</span>
            </div>
            {emotionChange !== 0 && (
              <div className={cn(
                "text-[10px] flex items-center gap-0.5",
                emotionChange > 0 ? "text-green-200" : "text-amber-200"
              )}>
                {emotionChange > 0 ? '↑' : '↓'}{Math.abs(emotionChange).toFixed(1)} vs上周
              </div>
            )}
          </div>

          {/* Belief */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-full bg-violet-300/30 flex items-center justify-center">
                <Brain className="w-3 h-3 text-violet-100" />
              </div>
              <span className="text-xs text-amber-100">信念松动度</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    i < Math.round(beliefScore) ? "bg-violet-200" : "bg-white/20"
                  )}
                />
              ))}
              <span className="text-sm font-medium ml-1">{beliefScore.toFixed(1)}</span>
            </div>
            {beliefChange !== 0 && (
              <div className={cn(
                "text-[10px] flex items-center gap-0.5",
                beliefChange > 0 ? "text-green-200" : "text-amber-200"
              )}>
                {beliefChange > 0 ? '↑' : '↓'}{Math.abs(beliefChange).toFixed(1)} vs上周
              </div>
            )}
          </div>
        </div>

        {/* AI Highlight */}
        {(highlight.change > 0 || trendChange !== 0) && (
          <div className="bg-white/10 rounded-lg px-3 py-2 text-xs text-amber-50 flex items-start gap-2">
            <span className="text-amber-200 shrink-0">💡</span>
            <span>
              {highlight.change > 0.3 
                ? `本周亮点：${highlight.name}层提升最快 (+${highlight.change.toFixed(1)})，继续保持！`
                : trendChange > 0 
                  ? `觉醒指数持续上升，你的转化正在稳步发生`
                  : `正在积累觉察经验，每一次记录都在推动改变`
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

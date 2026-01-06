import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Heart, Brain, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArchiveHeroCardProps {
  totalDays: number;
  maxDays?: number;
  avgBehavior: string;
  avgEmotion: string;
  avgBelief: string;
  trendChange?: number;
  className?: string;
}

export function ArchiveHeroCard({
  totalDays,
  maxDays = 21,
  avgBehavior,
  avgEmotion,
  avgBelief,
  trendChange = 0,
  className,
}: ArchiveHeroCardProps) {
  const overallScore = useMemo(() => {
    const scores = [
      parseFloat(avgBehavior) || 0,
      parseFloat(avgEmotion) || 0,
      parseFloat(avgBelief) || 0,
    ].filter(s => s > 0);
    if (scores.length === 0) return '0.0';
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }, [avgBehavior, avgEmotion, avgBelief]);

  const progressPercent = Math.round((totalDays / maxDays) * 100);

  // Calculate circumference for progress ring
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <Card className={cn(
      "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white border-0 shadow-lg overflow-hidden",
      className
    )}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-200" />
          <h3 className="font-semibold text-amber-50">我的觉醒旅程</h3>
        </div>

        {/* Main Content: Progress Ring + Scores */}
        <div className="flex items-center gap-5">
          {/* Progress Ring */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              {/* Progress circle */}
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
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">Day</span>
              <span className="text-lg font-medium -mt-1">{totalDays}/{maxDays}</span>
            </div>
          </div>

          {/* Three Dimension Scores */}
          <div className="flex-1 space-y-2.5">
            {/* Behavior */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-amber-100">行为</span>
                  <span className="text-xs font-medium">{avgBehavior}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-200 rounded-full transition-all duration-500"
                    style={{ width: `${(parseFloat(avgBehavior) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Emotion */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-amber-100">情绪</span>
                  <span className="text-xs font-medium">{avgEmotion}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-200 rounded-full transition-all duration-500"
                    style={{ width: `${(parseFloat(avgEmotion) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Belief */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-amber-100">信念</span>
                  <span className="text-xs font-medium">{avgBelief}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-200 rounded-full transition-all duration-500"
                    style={{ width: `${(parseFloat(avgBelief) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Overall Score */}
            <div className="flex items-center justify-between pt-1 border-t border-white/20">
              <span className="text-xs text-amber-100">综合觉醒</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">{overallScore}</span>
                {trendChange !== 0 && (
                  <span className={cn(
                    "text-xs flex items-center",
                    trendChange > 0 ? "text-green-200" : "text-amber-200"
                  )}>
                    {trendChange > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {trendChange > 0 ? '+' : ''}{trendChange.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trend Message */}
        {trendChange !== 0 && (
          <div className={cn(
            "mt-4 p-2.5 rounded-lg text-sm flex items-center gap-2",
            trendChange > 0 ? "bg-green-500/30" : "bg-amber-500/30"
          )}>
            {trendChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-200 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-200 shrink-0" />
            )}
            <span className="text-amber-50 text-xs">
              {trendChange > 0 
                ? `综合评分提升 ${trendChange.toFixed(1)} 分，觉醒正在发生！`
                : '当前正在经历调整期，这是觉醒的必经之路'
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

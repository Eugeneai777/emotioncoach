import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CompactProgressHeaderProps {
  currentDay: number;
  maxDays?: number;
  awakeningIndex: number;
  avgBehavior?: string;
  avgEmotion?: string;
  avgBelief?: string;
  trendChange?: number;
}

export function CompactProgressHeader({
  currentDay,
  maxDays = 7,
  awakeningIndex,
  avgBehavior = '0.0',
  avgEmotion = '0.0',
  avgBelief = '0.0',
  trendChange = 0,
}: CompactProgressHeaderProps) {
  const progressPercent = Math.min((currentDay / maxDays) * 100, 100);
  const behaviorScore = parseFloat(avgBehavior) || 0;
  const emotionScore = parseFloat(avgEmotion) || 0;
  const beliefScore = parseFloat(avgBelief) || 0;

  // Level description based on awakening index
  const getLevel = (index: number) => {
    if (index >= 80) return { label: '深度觉醒', color: 'text-emerald-600' };
    if (index >= 60) return { label: '稳步成长', color: 'text-amber-600' };
    if (index >= 40) return { label: '初步觉察', color: 'text-blue-600' };
    return { label: '起步阶段', color: 'text-gray-600' };
  };

  const level = getLevel(awakeningIndex);

  const TrendIcon = trendChange > 0 ? TrendingUp : trendChange < 0 ? TrendingDown : Minus;
  const trendColor = trendChange > 0 ? 'text-emerald-500' : trendChange < 0 ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/50">
      <div className="flex items-center gap-4">
        {/* Left: Day Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progressPercent * 1.76} 176`}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{currentDay}</span>
            <span className="text-[10px] text-muted-foreground">/{maxDays}天</span>
          </div>
        </div>

        {/* Middle: Awakening Index */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {awakeningIndex.toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">觉醒指数</span>
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          </div>
          <div className={`text-xs font-medium ${level.color} mb-2`}>
            {level.label}
          </div>
          <Progress value={awakeningIndex} className="h-1.5 bg-amber-100 dark:bg-amber-900/30" />
        </div>

        {/* Right: Three Dimension Bars */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 w-20">
          {/* Behavior */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${(behaviorScore / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-4 text-right">{behaviorScore.toFixed(1)}</span>
          </div>
          {/* Emotion */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 rounded-full transition-all"
                style={{ width: `${(emotionScore / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-4 text-right">{emotionScore.toFixed(1)}</span>
          </div>
          {/* Belief */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${(beliefScore / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-4 text-right">{beliefScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreStarsProps {
  score: number; // 1-5 scale
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function ScoreStars({
  score,
  maxScore = 5,
  size = 'md',
  showValue = true,
  className,
}: ScoreStarsProps) {
  const normalizedScore = Math.max(0, Math.min(score, maxScore));
  const fullStars = Math.floor(normalizedScore);
  const hasHalfStar = normalizedScore % 1 >= 0.5;
  const emptyStars = maxScore - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], 'fill-amber-400 text-amber-400')}
          />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(sizeClasses[size], 'text-muted-foreground/30')} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(sizeClasses[size], 'fill-amber-400 text-amber-400')} />
            </div>
          </div>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], 'text-muted-foreground/30')}
          />
        ))}
      </div>
      {showValue && (
        <span className={cn(textSizeClasses[size], 'text-muted-foreground ml-1')}>
          {normalizedScore.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// 觉醒等级定义
export function getAwakeningLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: '深度觉醒',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      description: '已建立稳固的新财富思维模式',
    };
  } else if (score >= 60) {
    return {
      label: '觉醒中',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      description: '正在建立新思维模式',
    };
  } else if (score >= 40) {
    return {
      label: '初步觉醒',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: '开始觉察到旧模式',
    };
  } else {
    return {
      label: '探索期',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      description: '正在了解自己的财富卡点',
    };
  }
}

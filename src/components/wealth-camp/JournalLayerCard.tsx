import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

type ColorScheme = 'amber' | 'pink' | 'violet' | 'emerald';

interface JournalLayerCardProps {
  stepNumber: 1 | 2 | 3 | 4;
  title: string;
  emoji: string;
  colorScheme: ColorScheme;
  children: React.ReactNode;
  awakeningMoment?: string;
  awakeningLabel?: string;
}

const colorConfig: Record<ColorScheme, {
  card: string;
  title: string;
  awakening: string;
  awakeningText: string;
  border: string;
}> = {
  amber: {
    card: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    title: 'text-amber-800 dark:text-amber-200',
    awakening: 'from-amber-200/70 to-yellow-200/70 dark:from-amber-800/40 dark:to-yellow-800/40 border-amber-300/60',
    awakeningText: 'text-amber-900 dark:text-amber-100',
    border: 'border-amber-200 dark:border-amber-800',
  },
  pink: {
    card: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
    title: 'text-pink-800 dark:text-pink-200',
    awakening: 'from-pink-200/70 to-rose-200/70 dark:from-pink-800/40 dark:to-rose-800/40 border-pink-300/60',
    awakeningText: 'text-pink-900 dark:text-pink-100',
    border: 'border-pink-200 dark:border-pink-800',
  },
  violet: {
    card: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
    title: 'text-violet-800 dark:text-violet-200',
    awakening: 'from-violet-200/70 to-purple-200/70 dark:from-violet-800/40 dark:to-purple-800/40 border-violet-300/60',
    awakeningText: 'text-violet-900 dark:text-violet-100',
    border: 'border-violet-200 dark:border-violet-800',
  },
  emerald: {
    card: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
    title: 'text-emerald-800 dark:text-emerald-200',
    awakening: 'from-emerald-200/70 to-green-200/70 dark:from-emerald-800/40 dark:to-green-800/40 border-emerald-300/60',
    awakeningText: 'text-emerald-900 dark:text-emerald-100',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
};

const stepLabels = ['一', '二', '三', '四'];

export function JournalLayerCard({
  stepNumber,
  title,
  emoji,
  colorScheme,
  children,
  awakeningMoment,
  awakeningLabel = '觉醒时刻',
}: JournalLayerCardProps) {
  const colors = colorConfig[colorScheme];

  return (
    <Card className={cn('bg-gradient-to-br', colors.card, colors.border, 'overflow-hidden')}>
      <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
        <CardTitle className={cn('flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base', colors.title)}>
          <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-current/10 text-xs sm:text-sm font-bold">
            {stepNumber}
          </span>
          <span>{emoji}</span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
        {children}
        
        {/* Awakening Moment - Highlighted Section */}
        {awakeningMoment && (
          <div className={cn(
            'mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r rounded-lg sm:rounded-xl border',
            colors.awakening
          )}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Sparkles className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', colors.awakeningText)} />
              <span className={cn('text-xs sm:text-sm font-medium', colors.awakeningText)}>
                ✨ {awakeningLabel}
              </span>
            </div>
            <p className={cn('text-sm sm:text-base font-medium italic', colors.awakeningText)}>
              "{awakeningMoment}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface GrowthHighlightsCardProps {
  consecutiveDays: number;
  awakeningChange: number;
  beliefsCount: number;
  actionCompletionRate: number;
  givingActionsCount?: number;
  peakAwakening?: number;
  className?: string;
}

interface Highlight {
  icon: string;
  title: string;
  value: string;
  color: 'amber' | 'emerald' | 'violet' | 'blue' | 'pink';
}

const colorStyles = {
  amber: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40',
  emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40',
  violet: 'bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/40',
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40',
  pink: 'bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800/40',
};

export function GrowthHighlightsCard({
  consecutiveDays,
  awakeningChange,
  beliefsCount,
  actionCompletionRate,
  givingActionsCount = 0,
  peakAwakening,
  className,
}: GrowthHighlightsCardProps) {
  const highlights = useMemo(() => {
    const items: Highlight[] = [];

    // 连续打卡
    if (consecutiveDays >= 1) {
      items.push({
        icon: '🔥',
        title: '连续打卡',
        value: `${consecutiveDays}天`,
        color: 'amber',
      });
    }

    // 觉醒提升
    if (awakeningChange > 0) {
      items.push({
        icon: '📈',
        title: '觉醒提升',
        value: `+${awakeningChange}`,
        color: 'emerald',
      });
    }

    // 峰值觉醒
    if (peakAwakening && peakAwakening > 0) {
      items.push({
        icon: '⭐',
        title: '最佳状态',
        value: `${peakAwakening}`,
        color: 'blue',
      });
    }

    // 新信念
    if (beliefsCount > 0) {
      items.push({
        icon: '💡',
        title: '新信念',
        value: `${beliefsCount}条`,
        color: 'violet',
      });
    }

    // 给予行动
    if (givingActionsCount > 0) {
      items.push({
        icon: '🎁',
        title: '给予行动',
        value: `${givingActionsCount}次`,
        color: 'pink',
      });
    }

    // 行动完成率
    if (actionCompletionRate >= 30) {
      items.push({
        icon: '✅',
        title: '行动完成',
        value: `${actionCompletionRate}%`,
        color: 'emerald',
      });
    }

    return items;
  }, [consecutiveDays, awakeningChange, beliefsCount, actionCompletionRate, givingActionsCount, peakAwakening]);

  if (highlights.length === 0) {
    return null;
  }

  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">✨</span>
        <span className="text-sm font-medium text-muted-foreground">成长亮点</span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
              className={cn(
                "shrink-0 p-3 rounded-xl border text-center min-w-[80px]",
                colorStyles[h.color]
              )}
            >
              <div className="text-xl mb-1">{h.icon}</div>
              <div className="text-base font-bold">{h.value}</div>
              <div className="text-[10px] text-muted-foreground">{h.title}</div>
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

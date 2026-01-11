import { motion } from 'framer-motion';
import { AlertCircle, Flame, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardBaseStyles } from '@/config/cardStyleConfig';

interface GapReminderCardProps {
  daysSinceLastCheckIn: number;
  cycleRound: number;
  cycleDayInRound: number;
  onContinueClick?: () => void;
  className?: string;
}

export function GapReminderCard({
  daysSinceLastCheckIn,
  cycleRound,
  cycleDayInRound,
  onContinueClick,
  className,
}: GapReminderCardProps) {
  // 只有间断超过1天才显示
  if (daysSinceLastCheckIn <= 1) {
    return null;
  }

  // 根据间断天数确定提醒强度
  const isLongGap = daysSinceLastCheckIn >= 7;
  const isMediumGap = daysSinceLastCheckIn >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        cardBaseStyles.container,
        "p-4",
        isLongGap 
          ? "bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border-rose-200 dark:border-rose-800"
          : isMediumGap
            ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800"
            : "bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-200 dark:border-sky-800",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isLongGap 
            ? "bg-rose-100 dark:bg-rose-900/50"
            : isMediumGap
              ? "bg-amber-100 dark:bg-amber-900/50"
              : "bg-sky-100 dark:bg-sky-900/50"
        )}>
          {isLongGap ? (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          ) : (
            <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "font-semibold",
              isLongGap 
                ? "text-rose-800 dark:text-rose-200"
                : isMediumGap
                  ? "text-amber-800 dark:text-amber-200"
                  : "text-sky-800 dark:text-sky-200"
            )}>
              {isLongGap ? '🌱 欢迎回来！' : '💪 继续加油！'}
            </span>
            <span className={cn(
              "text-sm px-2 py-0.5 rounded-full",
              isLongGap 
                ? "bg-rose-200/60 text-rose-700 dark:bg-rose-800/50 dark:text-rose-300"
                : isMediumGap
                  ? "bg-amber-200/60 text-amber-700 dark:bg-amber-800/50 dark:text-amber-300"
                  : "bg-sky-200/60 text-sky-700 dark:bg-sky-800/50 dark:text-sky-300"
            )}>
              已间断 {daysSinceLastCheckIn} 天
            </span>
          </div>
          
          <p className={cn(
            "text-sm mt-1",
            isLongGap 
              ? "text-rose-600 dark:text-rose-400"
              : isMediumGap
                ? "text-amber-600 dark:text-amber-400"
                : "text-sky-600 dark:text-sky-400"
          )}>
            {isLongGap ? (
              <>
                每一次回归都是新的开始。
                <br />
                今日回归，继续第 <span className="font-semibold">{cycleRound}</span> 轮 Day <span className="font-semibold">{cycleDayInRound}</span>
              </>
            ) : (
              <>
                今日回归，继续第 <span className="font-semibold">{cycleRound}</span> 轮 Day <span className="font-semibold">{cycleDayInRound}</span>
              </>
            )}
          </p>
          
          {onContinueClick && (
            <button
              onClick={onContinueClick}
              className={cn(
                "mt-2 flex items-center gap-1 text-sm font-medium transition-colors",
                isLongGap 
                  ? "text-rose-700 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200"
                  : isMediumGap
                    ? "text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                    : "text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
              )}
            >
              开始今日冥想
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

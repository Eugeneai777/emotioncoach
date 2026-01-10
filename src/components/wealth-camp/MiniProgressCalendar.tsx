import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Flame, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MiniProgressCalendarProps {
  currentDay: number;
  totalDays: number;
  completedDays: number[];
  makeupDays: number[];
  streak: number;
  onMakeupClick: (dayNumber: number) => void;
  activeMakeupDay?: number | null; // 当前正在补卡的天数
  justCompletedDay?: number | null; // 刚刚完成补卡的天数（用于高亮动画）
}

export function MiniProgressCalendar({
  currentDay,
  totalDays,
  completedDays,
  makeupDays,
  streak,
  onMakeupClick,
  activeMakeupDay,
  justCompletedDay,
}: MiniProgressCalendarProps) {
  const [showMakeupMenu, setShowMakeupMenu] = useState(false);
  const [celebratingDay, setCelebratingDay] = useState<number | null>(null);

  // 当有刚完成的补卡天时，触发庆祝动画
  useEffect(() => {
    if (justCompletedDay) {
      setCelebratingDay(justCompletedDay);
      const timer = setTimeout(() => setCelebratingDay(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [justCompletedDay]);

  // 生成点状态
  const dots = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNumber = i + 1;
      const isCompleted = completedDays.includes(dayNumber);
      const canMakeup = makeupDays.includes(dayNumber);
      const isCurrent = dayNumber === currentDay;
      const isFuture = dayNumber > currentDay;
      const isActiveMakeup = dayNumber === activeMakeupDay;
      const isCelebrating = dayNumber === celebratingDay;

      return {
        dayNumber,
        isCompleted,
        canMakeup,
        isCurrent,
        isFuture,
        isActiveMakeup,
        isCelebrating,
      };
    });
  }, [totalDays, completedDays, makeupDays, currentDay, activeMakeupDay, celebratingDay]);

  const completedCount = completedDays.length;

  return (
    <div className={cn(
      "rounded-xl p-4 border transition-all duration-300",
      activeMakeupDay 
        ? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-amber-300 dark:border-amber-700 shadow-md shadow-amber-200/50 dark:shadow-amber-900/30"
        : "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800"
    )}>
      {/* 头部统计 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <span className={cn(
            "text-sm font-medium",
            activeMakeupDay 
              ? "text-amber-900 dark:text-amber-100" 
              : "text-amber-800 dark:text-amber-200"
          )}>
            {activeMakeupDay ? `补打 Day ${activeMakeupDay}` : `Day ${currentDay}/${totalDays}`}
          </span>
          {!activeMakeupDay && (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">{streak}天连续</span>
            </div>
          )}
        </div>
        <div className="text-sm text-amber-600 dark:text-amber-400">
          ⭐ {completedCount}/{totalDays}
        </div>
      </div>

      {/* 进度点状图 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {dots.map((dot) => (
          <div key={dot.dayNumber} className="relative">
            {/* 庆祝动画外圈 */}
            <AnimatePresence>
              {dot.isCelebrating && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 1.8, 1.5], opacity: [1, 0.8, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full bg-green-400"
                />
              )}
            </AnimatePresence>
            
            {/* 主点 */}
            <motion.div
              animate={dot.isCelebrating ? {
                scale: [1, 1.3, 1.1],
                boxShadow: [
                  '0 0 0 0 rgba(34, 197, 94, 0)',
                  '0 0 12px 4px rgba(34, 197, 94, 0.6)',
                  '0 0 6px 2px rgba(34, 197, 94, 0.3)',
                ]
              } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300 relative z-10",
                // 刚完成庆祝 - 绿色高亮
                dot.isCelebrating && "bg-gradient-to-br from-green-400 to-emerald-500 ring-2 ring-green-400 ring-offset-1 ring-offset-background",
                // 正在补卡的天 - 高亮闪烁
                !dot.isCelebrating && dot.isActiveMakeup && "bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-amber-400 ring-offset-1 ring-offset-background animate-pulse shadow-md shadow-amber-400/50",
                // 已完成
                !dot.isCelebrating && !dot.isActiveMakeup && dot.isCompleted && "bg-amber-500 dark:bg-amber-400",
                // 可补卡（非当前激活）
                !dot.isCelebrating && !dot.isActiveMakeup && dot.canMakeup && !dot.isCompleted && "border-2 border-dashed border-amber-400 bg-amber-100/50 dark:bg-amber-900/30",
                // 当前天（非补卡模式）
                !dot.isCelebrating && !dot.isActiveMakeup && dot.isCurrent && !dot.isCompleted && !activeMakeupDay && "bg-amber-300 ring-2 ring-amber-500 ring-offset-1 ring-offset-background",
                // 当前天（补卡模式下，变暗）
                !dot.isCelebrating && !dot.isActiveMakeup && dot.isCurrent && !dot.isCompleted && activeMakeupDay && "bg-amber-200/60 dark:bg-amber-700/40",
                // 未来
                !dot.isCelebrating && !dot.isActiveMakeup && dot.isFuture && "bg-muted/40",
                // 已错过不可补卡
                !dot.isCelebrating && !dot.isActiveMakeup && !dot.isCompleted && !dot.canMakeup && !dot.isCurrent && !dot.isFuture && "bg-red-200 dark:bg-red-900/40"
              )}
              title={`Day ${dot.dayNumber}${dot.isActiveMakeup ? ' (补卡中)' : dot.isCelebrating ? ' (刚完成!)' : ''}`}
            />
          </div>
        ))}
      </div>

      {/* 补卡入口 - 非补卡模式下显示 */}
      {!activeMakeupDay && makeupDays.length > 0 && (
        <DropdownMenu open={showMakeupMenu} onOpenChange={setShowMakeupMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <Calendar className="w-3 h-3 mr-1" />
              {makeupDays.length}天待补卡
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {makeupDays.map((dayNumber) => (
              <DropdownMenuItem
                key={dayNumber}
                onClick={() => {
                  onMakeupClick(dayNumber);
                  setShowMakeupMenu(false);
                }}
                className="cursor-pointer"
              >
                <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                补打 Day {dayNumber}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

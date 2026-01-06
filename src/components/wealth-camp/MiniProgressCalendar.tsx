import { useState, useMemo } from 'react';
import { ChevronDown, Flame, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
}

export function MiniProgressCalendar({
  currentDay,
  totalDays,
  completedDays,
  makeupDays,
  streak,
  onMakeupClick,
  activeMakeupDay,
}: MiniProgressCalendarProps) {
  const [showMakeupMenu, setShowMakeupMenu] = useState(false);

  // 生成 21 个点状态
  const dots = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNumber = i + 1;
      const isCompleted = completedDays.includes(dayNumber);
      const canMakeup = makeupDays.includes(dayNumber);
      const isCurrent = dayNumber === currentDay;
      const isFuture = dayNumber > currentDay;
      const isActiveMakeup = dayNumber === activeMakeupDay;

      return {
        dayNumber,
        isCompleted,
        canMakeup,
        isCurrent,
        isFuture,
        isActiveMakeup,
      };
    });
  }, [totalDays, completedDays, makeupDays, currentDay, activeMakeupDay]);

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
          <div
            key={dot.dayNumber}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              // 正在补卡的天 - 高亮闪烁
              dot.isActiveMakeup && "bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-amber-400 ring-offset-1 ring-offset-background animate-pulse shadow-md shadow-amber-400/50",
              // 已完成
              !dot.isActiveMakeup && dot.isCompleted && "bg-amber-500 dark:bg-amber-400",
              // 可补卡（非当前激活）
              !dot.isActiveMakeup && dot.canMakeup && !dot.isCompleted && "border-2 border-dashed border-amber-400 bg-amber-100/50 dark:bg-amber-900/30",
              // 当前天（非补卡模式）
              !dot.isActiveMakeup && dot.isCurrent && !dot.isCompleted && !activeMakeupDay && "bg-amber-300 ring-2 ring-amber-500 ring-offset-1 ring-offset-background",
              // 当前天（补卡模式下，变暗）
              !dot.isActiveMakeup && dot.isCurrent && !dot.isCompleted && activeMakeupDay && "bg-amber-200/60 dark:bg-amber-700/40",
              // 未来
              !dot.isActiveMakeup && dot.isFuture && "bg-muted/40",
              // 已错过不可补卡
              !dot.isActiveMakeup && !dot.isCompleted && !dot.canMakeup && !dot.isCurrent && !dot.isFuture && "bg-red-200 dark:bg-red-900/40"
            )}
            title={`Day ${dot.dayNumber}${dot.isActiveMakeup ? ' (补卡中)' : ''}`}
          />
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

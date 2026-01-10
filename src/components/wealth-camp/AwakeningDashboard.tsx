import { GameProgressCard } from './GameProgressCard';
import { MiniProgressCalendar } from './MiniProgressCalendar';
import { cn } from '@/lib/utils';

interface AwakeningDashboardProps {
  currentDay: number;
  totalDays: number;
  completedDays: number[];
  makeupDays: number[];
  streak: number;
  onMakeupClick: (dayNumber: number) => void;
  activeMakeupDay?: number | null;
  justCompletedDay?: number | null;
  className?: string;
}

export function AwakeningDashboard({
  currentDay,
  totalDays,
  completedDays,
  makeupDays,
  streak,
  onMakeupClick,
  activeMakeupDay,
  justCompletedDay,
  className,
}: AwakeningDashboardProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* 游戏化进度卡片 - 传入streak和currentDay */}
      <GameProgressCard currentDayNumber={currentDay} streak={streak} />
      
      {/* 7天进度日历 - 内嵌到仪表盘下方 */}
      <MiniProgressCalendar
        currentDay={currentDay}
        totalDays={totalDays}
        completedDays={completedDays}
        makeupDays={makeupDays}
        streak={streak}
        onMakeupClick={onMakeupClick}
        activeMakeupDay={activeMakeupDay}
        justCompletedDay={justCompletedDay}
      />
    </div>
  );
}

import { GameProgressCard } from './GameProgressCard';
import { CollapsibleProgressCalendar } from './CollapsibleProgressCalendar';
import { cn } from '@/lib/utils';
import { UserCampMode } from '@/hooks/useUserCampMode';

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
  // Post-camp mode props
  userMode?: UserCampMode;
  daysSinceGraduation?: number;
  cycleMeditationDay?: number;
  cycleWeek?: number;
  postCampCheckinDates?: string[];
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
  userMode = 'active',
  daysSinceGraduation = 0,
  cycleMeditationDay = 1,
  cycleWeek = 1,
  postCampCheckinDates = [],
}: AwakeningDashboardProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* 可折叠全生命周期日历 - 最顶部 */}
      <CollapsibleProgressCalendar
        userMode={userMode}
        currentDay={currentDay}
        totalDays={totalDays}
        completedDays={completedDays}
        makeupDays={makeupDays}
        streak={streak}
        onMakeupClick={onMakeupClick}
        activeMakeupDay={activeMakeupDay}
        justCompletedDay={justCompletedDay}
        daysSinceGraduation={daysSinceGraduation}
        cycleMeditationDay={cycleMeditationDay}
        cycleWeek={cycleWeek}
        postCampCheckinDates={postCampCheckinDates}
      />
      
      {/* 游戏化进度卡片 */}
      <GameProgressCard currentDayNumber={currentDay} streak={streak} />
    </div>
  );
}

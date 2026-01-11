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
  // Post-camp mode props - 基于实际打卡次数
  userMode?: UserCampMode;
  postGraduationCheckIns?: number;
  cycleRound?: number;
  cycleDayInRound?: number;
  cycleMeditationDay?: number;
  daysSinceLastCheckIn?: number;
  // Legacy fields for backward compatibility
  daysSinceGraduation?: number;
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
  postGraduationCheckIns = 0,
  cycleRound = 1,
  cycleDayInRound = 1,
  cycleMeditationDay = 1,
  daysSinceLastCheckIn = 0,
  daysSinceGraduation = 0,
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
        postGraduationCheckIns={postGraduationCheckIns}
        cycleRound={cycleRound}
        cycleDayInRound={cycleDayInRound}
        cycleMeditationDay={cycleMeditationDay}
        daysSinceLastCheckIn={daysSinceLastCheckIn}
        daysSinceGraduation={daysSinceGraduation}
        cycleWeek={cycleWeek}
        postCampCheckinDates={postCampCheckinDates}
      />
    </div>
  );
}

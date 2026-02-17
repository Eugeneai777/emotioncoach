import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrainingCamp } from "@/types/trainingCamp";
import { CheckCircle2, Calendar, Flame, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { getTodayInBeijing, parseDateInBeijing, getDaysSinceStart } from "@/utils/dateUtils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrainingCampCardProps {
  camp: TrainingCamp;
  onCheckIn?: () => void;
}

const getThemeColors = (campType: string) => {
  if (campType.includes('parent') || campType.includes('teen')) {
    return {
      cardBg: 'bg-white/90 dark:bg-gray-900/80',
      leftBorder: 'border-l-purple-400',
      borderColor: 'border-purple-300/70 dark:border-purple-700/50',
      shadowColor: 'shadow-purple-100/50',
      titleColor: 'text-purple-800 dark:text-purple-200',
      accentColor: 'text-purple-600 dark:text-purple-400',
      progressBg: 'bg-purple-100/50 dark:bg-purple-900/30',
      progressFill: 'from-purple-400 to-pink-500',
      buttonGradient: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm',
      outlineButton: 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-400 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/30',
      goalBg: 'bg-purple-50/60 dark:bg-purple-900/20',
      statusBg: 'bg-purple-100/60 dark:bg-purple-900/30',
      dotReached: 'bg-purple-400',
      dotUnreached: 'bg-purple-200/50 dark:bg-purple-700/30',
    };
  }
  if (campType.includes('wealth')) {
    return {
      cardBg: 'bg-white/90 dark:bg-gray-900/80',
      leftBorder: 'border-l-amber-400',
      borderColor: 'border-amber-300/70 dark:border-amber-700/50',
      shadowColor: 'shadow-amber-100/50',
      titleColor: 'text-amber-800 dark:text-amber-200',
      accentColor: 'text-amber-600 dark:text-amber-400',
      progressBg: 'bg-amber-100/50 dark:bg-amber-900/30',
      progressFill: 'from-amber-400 to-orange-500',
      buttonGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm',
      outlineButton: 'text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-400 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/30',
      goalBg: 'bg-amber-50/60 dark:bg-amber-900/20',
      statusBg: 'bg-amber-100/60 dark:bg-amber-900/30',
      dotReached: 'bg-amber-400',
      dotUnreached: 'bg-amber-200/50 dark:bg-amber-700/30',
    };
  }
  return {
    cardBg: 'bg-white/90 dark:bg-gray-900/80',
    leftBorder: 'border-l-teal-400',
    borderColor: 'border-teal-300/70 dark:border-teal-700/50',
    shadowColor: 'shadow-teal-100/50',
    titleColor: 'text-teal-800 dark:text-teal-200',
    accentColor: 'text-teal-600 dark:text-teal-400',
    progressBg: 'bg-teal-100/50 dark:bg-teal-900/30',
    progressFill: 'from-teal-400 to-cyan-500',
    buttonGradient: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-sm',
    outlineButton: 'text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-400 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30',
    goalBg: 'bg-teal-50/60 dark:bg-teal-900/20',
    statusBg: 'bg-teal-100/60 dark:bg-teal-900/30',
    dotReached: 'bg-teal-400',
    dotUnreached: 'bg-teal-200/50 dark:bg-teal-700/30',
  };
};

export function TrainingCampCard({ camp, onCheckIn }: TrainingCampCardProps) {
  const colors = getThemeColors(camp.camp_type);
  const navigate = useNavigate();
  const isWealthCamp = camp.camp_type?.includes('wealth');
  
  const { data: awakeningProgress } = useQuery({
    queryKey: ['camp-card-awakening', camp.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_awakening_progress')
        .select('baseline_awakening')
        .eq('user_id', camp.user_id)
        .maybeSingle();
      return data;
    },
    enabled: isWealthCamp,
  });

  const today = getTodayInBeijing();
  const hasCheckedInToday = camp.check_in_dates.includes(today);
  const progressPercent = (camp.completed_days / camp.duration_days) * 100;
  
  const calculatedCurrentDay = Math.max(1, getDaysSinceStart(camp.start_date) + 1);
  const displayCurrentDay = Math.min(calculatedCurrentDay, camp.duration_days);
  
  const sortedDates = [...camp.check_in_dates].sort().reverse();
  let currentStreak = 0;
  let checkDate = parseDateInBeijing(today);
  
  for (const dateStr of sortedDates) {
    const date = parseDateInBeijing(dateStr);
    const diff = differenceInDays(checkDate, date);
    if (diff <= 1) {
      currentStreak++;
      checkDate = date;
    } else {
      break;
    }
  }

  const getMilestones = () => {
    if (isWealthCamp) {
      return [
        { reached: camp.completed_days >= 1, position: 0 },
        { reached: camp.completed_days >= 3, position: 43 },
        { reached: camp.milestone_7_reached, position: 100 },
      ];
    }
    return [
      { reached: camp.completed_days >= 1, position: 0 },
      { reached: camp.milestone_7_reached, position: (7 / camp.duration_days) * 100 },
      { reached: camp.milestone_14_reached, position: (14 / camp.duration_days) * 100 },
      { reached: camp.milestone_21_completed, position: 100 },
    ];
  };

  const milestones = getMilestones();
  const baselineScore = awakeningProgress?.baseline_awakening;
  const graduationTarget = baselineScore ? Math.min(baselineScore + 20, 95) : null;

  return (
    <Card className={`p-4 ${colors.cardBg} ${colors.borderColor} border-l-4 ${colors.leftBorder} rounded-2xl shadow-md ${colors.shadowColor} hover:shadow-lg transition-all`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <h3 className={`text-sm sm:text-base font-semibold flex items-center gap-1.5 ${colors.titleColor}`}>
          🏕️ <span className="truncate max-w-[120px] sm:max-w-none">{camp.camp_name}</span>
        </h3>
        
        <span className="text-muted-foreground text-sm">第<span className="font-bold text-base">{displayCurrentDay}</span>天</span>
        <span className="text-muted-foreground/30">·</span>
        
        {hasCheckedInToday ? (
          <span className={`${colors.accentColor} flex items-center gap-0.5 text-xs font-medium`}>
            <CheckCircle2 className="h-3.5 w-3.5" />已打卡
          </span>
        ) : (
          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium px-2 py-0.5 rounded-full animate-pulse">
            待打卡
          </span>
        )}

        {currentStreak > 0 && (
          <Badge className="ml-auto bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600 border-orange-200/50 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-400 text-xs px-2 py-0.5">
            <Flame className="h-3 w-3 mr-0.5" />
            连续{currentStreak}天
          </Badge>
        )}
      </div>

      {/* Progress Bar with inline milestone dots */}
      <div className="mb-2.5">
        <div className="relative px-1">
          <div className={`relative h-2.5 w-full overflow-visible rounded-full ${colors.progressBg}`}>
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${colors.progressFill} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
            {/* Milestone dots on the progress bar */}
            {milestones.map((m, i) => (
              <div
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 transition-all ${
                  m.reached ? colors.dotReached : colors.dotUnreached
                }`}
                style={{ left: `calc(${m.position}% - 6px)` }}
              />
            ))}
          </div>
        </div>
        {/* Combined progress + graduation goal */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5 px-1">
          <span>
            已完成 <span className={`font-bold text-sm ${colors.accentColor}`}>{camp.completed_days}</span>/{camp.duration_days}天
            <span className={`ml-1 font-bold ${colors.accentColor}`}>({Math.round(progressPercent)}%)</span>
          </span>
          {isWealthCamp && graduationTarget && (
            <span className="text-amber-700 dark:text-amber-300 text-xs">
              🎯 目标 <strong className="text-sm font-extrabold">{graduationTarget}</strong>分
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons - primary takes 70% */}
      <div className="flex gap-2">
        <Button 
          onClick={() => {
            if (camp.camp_type === 'wealth_block_7' || camp.camp_type === 'wealth_block_21') {
              navigate('/wealth-camp-checkin');
            } else {
              navigate(`/camp-checkin/${camp.id}`);
            }
          }}
          className={`flex-[2] h-10 rounded-xl ${hasCheckedInToday ? '' : colors.buttonGradient}`}
          variant={hasCheckedInToday ? 'outline' : 'default'}
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          {hasCheckedInToday ? '查看记录' : '立即打卡'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            if (camp.camp_type === 'wealth_block_7' || camp.camp_type === 'wealth_block_21') {
              navigate('/wealth-camp-intro');
            } else {
              navigate(`/camp-intro/${camp.camp_type}`);
            }
          }}
          className={`flex-1 h-10 rounded-xl ${colors.outlineButton}`}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          介绍
        </Button>
      </div>
    </Card>
  );
}

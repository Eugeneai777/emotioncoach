import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrainingCamp } from "@/types/trainingCamp";
import { CheckCircle2, Circle, Calendar, Flame, TrendingUp } from "lucide-react";
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
  // 亲子/青少年训练营 - 紫粉色系
  if (campType.includes('parent') || campType.includes('teen')) {
    return {
      cardBg: 'from-purple-50/80 via-pink-50/50 to-rose-50/30 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-rose-950/10',
      borderColor: 'border-purple-200/40 dark:border-purple-800/30',
      titleColor: 'text-purple-800 dark:text-purple-200',
      accentColor: 'text-purple-600 dark:text-purple-400',
      mutedAccent: 'text-purple-600/50 dark:text-purple-400/50',
      progressBg: 'bg-purple-100/50 dark:bg-purple-900/30',
      progressFill: 'from-purple-400 to-pink-500',
      buttonGradient: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm',
      outlineButton: 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-400 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/30',
      goalBg: 'bg-purple-50/60 dark:bg-purple-900/20',
      statusBg: 'bg-purple-100/60 dark:bg-purple-900/30',
    };
  }
  if (campType.includes('wealth')) {
    return {
      cardBg: 'from-amber-50/80 via-orange-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-yellow-950/10',
      borderColor: 'border-amber-200/40 dark:border-amber-800/30',
      titleColor: 'text-amber-800 dark:text-amber-200',
      accentColor: 'text-amber-600 dark:text-amber-400',
      mutedAccent: 'text-amber-600/50 dark:text-amber-400/50',
      progressBg: 'bg-amber-100/50 dark:bg-amber-900/30',
      progressFill: 'from-amber-400 to-orange-500',
      buttonGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm',
      outlineButton: 'text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-400 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/30',
      goalBg: 'bg-amber-50/60 dark:bg-amber-900/20',
      statusBg: 'bg-amber-100/60 dark:bg-amber-900/30',
    };
  }
  return {
    cardBg: 'from-teal-50/80 via-cyan-50/50 to-blue-50/30 dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10',
    borderColor: 'border-teal-200/40 dark:border-teal-800/30',
    titleColor: 'text-teal-800 dark:text-teal-200',
    accentColor: 'text-teal-600 dark:text-teal-400',
    mutedAccent: 'text-teal-600/50 dark:text-teal-400/50',
    progressBg: 'bg-teal-100/50 dark:bg-teal-900/30',
    progressFill: 'from-teal-400 to-cyan-500',
    buttonGradient: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-sm',
    outlineButton: 'text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-400 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30',
    goalBg: 'bg-teal-50/60 dark:bg-teal-900/20',
    statusBg: 'bg-teal-100/60 dark:bg-teal-900/30',
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
        { icon: "🌱", label: "启程", reached: camp.completed_days >= 1, position: 0 },
        { icon: "⭐", label: "中期", reached: camp.completed_days >= 3, position: 43 },
        { icon: "🏆", label: "毕业", reached: camp.milestone_7_reached, position: 100 }
      ];
    }
    return [
      { icon: "🌱", label: "启程", reached: camp.completed_days >= 1, position: 0 },
      { icon: "⭐", label: "一周", reached: camp.milestone_7_reached, position: (7 / camp.duration_days) * 100 },
      { icon: "🌟", label: "半程", reached: camp.milestone_14_reached, position: (14 / camp.duration_days) * 100 },
      { icon: "🏆", label: "毕业", reached: camp.milestone_21_completed, position: 100 }
    ];
  };

  const milestones = getMilestones();
  const baselineScore = awakeningProgress?.baseline_awakening;
  const graduationTarget = baselineScore ? Math.min(baselineScore + 20, 95) : null;

  return (
    <Card className={`p-4 bg-gradient-to-br ${colors.cardBg} ${colors.borderColor} rounded-2xl shadow-sm hover:shadow-md transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]`}>
      {/* Header - 合并标题、状态、连续天数为单行 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
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

      {/* Milestone Timeline + Progress Bar */}
      <div className="mb-3">
        <div className="relative px-1">
          <div className="flex justify-between mb-1">
            {milestones.map((m, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: milestones.length <= 3 ? '33%' : '25%' }}>
                <div className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
                  m.reached 
                    ? `${colors.statusBg} shadow-[0_0_8px_rgba(0,0,0,0.08)]` 
                    : 'bg-muted/30'
                }`}>
                  <span className={`text-sm ${m.reached ? 'scale-110' : 'opacity-40 grayscale'}`}>
                    {m.icon}
                  </span>
                </div>
                <span className={`text-[10px] leading-tight mt-0.5 ${m.reached ? `${colors.accentColor} font-semibold` : 'text-muted-foreground/60'}`}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
          {/* 渐变进度条 */}
          <div className={`relative h-2 w-full overflow-hidden rounded-full ${colors.progressBg}`}>
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${colors.progressFill} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground mt-1.5">
          已完成 <span className={`font-bold text-sm ${colors.accentColor}`}>{camp.completed_days}</span>/{camp.duration_days} 天
          <span className={`ml-1 font-bold ${colors.accentColor}`}>({Math.round(progressPercent)}%)</span>
        </div>
      </div>

      {/* Graduation Goal (wealth camp only) */}
      {isWealthCamp && graduationTarget && (
        <div className={`mb-3 flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${colors.goalBg}`}>
          <span className="text-amber-900 dark:text-amber-100">🎯 毕业目标：觉醒分达到 <strong className="text-lg font-extrabold text-amber-700 dark:text-amber-300">{graduationTarget}</strong> 分</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={() => {
            if (camp.camp_type === 'wealth_block_7' || camp.camp_type === 'wealth_block_21') {
              navigate('/wealth-camp-checkin');
            } else {
              navigate(`/camp-checkin/${camp.id}`);
            }
          }}
          className={`flex-1 h-10 rounded-xl ${hasCheckedInToday ? '' : colors.buttonGradient}`}
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

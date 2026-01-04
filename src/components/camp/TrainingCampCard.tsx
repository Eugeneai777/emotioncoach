import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrainingCamp } from "@/types/trainingCamp";
import { CheckCircle2, Circle, Calendar, Flame, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getTodayInBeijing, parseDateInBeijing, getDaysSinceStart } from "@/utils/dateUtils";

interface TrainingCampCardProps {
  camp: TrainingCamp;
  onCheckIn?: () => void;
}

const getThemeColors = (campType: string) => {
  if (campType.includes('parent') || campType.includes('teen')) {
    return {
      cardBg: 'from-purple-50/80 via-pink-50/50 to-rose-50/30 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-rose-950/10',
      borderColor: 'border-purple-200/40 dark:border-purple-800/30',
      titleColor: 'text-purple-800 dark:text-purple-200',
      accentColor: 'text-purple-600 dark:text-purple-400',
      mutedAccent: 'text-purple-600/50 dark:text-purple-400/50',
      progressBg: 'bg-purple-100/50 dark:bg-purple-900/30',
      buttonGradient: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm',
      outlineButton: 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-400 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/30'
    };
  }
  return {
    cardBg: 'from-teal-50/80 via-cyan-50/50 to-blue-50/30 dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10',
    borderColor: 'border-teal-200/40 dark:border-teal-800/30',
    titleColor: 'text-teal-800 dark:text-teal-200',
    accentColor: 'text-teal-600 dark:text-teal-400',
    mutedAccent: 'text-teal-600/50 dark:text-teal-400/50',
    progressBg: 'bg-teal-100/50 dark:bg-teal-900/30',
    buttonGradient: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-sm',
    outlineButton: 'text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-400 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30'
  };
};

export function TrainingCampCard({ camp, onCheckIn }: TrainingCampCardProps) {
  const colors = getThemeColors(camp.camp_type);
  const navigate = useNavigate();
  
  const today = getTodayInBeijing();
  
  const hasCheckedInToday = camp.check_in_dates.includes(today);
  const progressPercent = (camp.completed_days / camp.duration_days) * 100;
  
  // 动态计算当前是第几天（从1开始显示）
  const calculatedCurrentDay = Math.max(1,
    getDaysSinceStart(camp.start_date) + 1
  );
  const displayCurrentDay = Math.min(calculatedCurrentDay, camp.duration_days);
  
  // Calculate streak
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

  const getMilestones = () => [
    { icon: "🌱", label: "启程", reached: camp.completed_days >= 1, position: 0 },
    { icon: "⭐", label: "一周", reached: camp.milestone_7_reached, position: (7 / camp.duration_days) * 100 },
    { icon: "🌟", label: "半程", reached: camp.milestone_14_reached, position: (14 / camp.duration_days) * 100 },
    { icon: "🏆", label: "毕业", reached: camp.milestone_21_completed, position: 100 }
  ];

  return (
    <Card className={`p-5 bg-gradient-to-br ${colors.cardBg} ${colors.borderColor} shadow-sm hover:shadow-md transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm sm:text-base font-semibold flex items-center gap-2 ${colors.titleColor}`}>
            🏕️ <span className="truncate">{camp.camp_name}</span>
          </h3>
        </div>
        {currentStreak > 0 && (
          <Badge className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600 border-orange-200/50 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-400">
            <Flame className="h-3 w-3 mr-1" />
            连续{currentStreak}天
          </Badge>
        )}
      </div>
      
      {/* Status Line */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-muted-foreground">第{displayCurrentDay}天</span>
        <span className="text-muted-foreground/50">·</span>
        {hasCheckedInToday ? (
          <span className={`${colors.accentColor} flex items-center gap-1`}>
            <CheckCircle2 className="h-3.5 w-3.5" />今日已打卡
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
            <Circle className="h-3.5 w-3.5" />待打卡
          </span>
        )}
      </div>

      {/* Milestone Progress - Unified Design */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          {getMilestones().map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className={`text-lg transition-all duration-300 ${m.reached ? 'scale-110' : 'opacity-40 grayscale'}`}>
                {m.icon}
              </span>
              <span className={`text-[10px] mt-1 ${m.reached ? `${colors.accentColor} font-medium` : 'text-muted-foreground'}`}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progressPercent} className={`h-2 ${colors.progressBg}`} />
        <div className="text-center text-xs text-muted-foreground mt-2">
          已完成 <span className={`font-semibold ${colors.accentColor}`}>{camp.completed_days}</span>/{camp.duration_days} 天 ({Math.round(progressPercent)}%)
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={() => {
            // 财富训练营使用专属打卡页
            if (camp.camp_type === 'wealth_block_21') {
              navigate('/wealth-camp-checkin');
            } else {
              navigate(`/camp-checkin/${camp.id}`);
            }
          }}
          className={`flex-1 ${hasCheckedInToday ? '' : colors.buttonGradient}`}
          variant={hasCheckedInToday ? 'outline' : 'default'}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {hasCheckedInToday ? '查看记录' : '立即打卡'}
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => {
            // 财富训练营使用专属介绍页
            if (camp.camp_type === 'wealth_block_21') {
              navigate('/wealth-camp-intro');
            } else {
              navigate(`/camp-intro/${camp.camp_type}`);
            }
          }}
          className={colors.outlineButton}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          介绍
        </Button>
      </div>
    </Card>
  );
}

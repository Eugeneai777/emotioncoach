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

export function TrainingCampCard({ camp, onCheckIn }: TrainingCampCardProps) {
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
    <Card className="p-5 bg-gradient-to-br from-teal-50/80 via-cyan-50/50 to-blue-50/30 border-teal-200/40 shadow-sm hover:shadow-md transition-all dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10 dark:border-teal-800/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold flex items-center gap-2 text-teal-800 dark:text-teal-200">
            🏕️ {camp.camp_name}
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
          <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
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
              <span className={`text-[10px] mt-1 ${m.reached ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-muted-foreground'}`}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progressPercent} className="h-2 bg-teal-100/50 dark:bg-teal-900/30" />
        <div className="text-center text-xs text-muted-foreground mt-2">
          已完成 <span className="font-semibold text-teal-600 dark:text-teal-400">{camp.completed_days}</span>/{camp.duration_days} 天 ({Math.round(progressPercent)}%)
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={() => navigate(`/camp-checkin/${camp.id}`)}
          className={`flex-1 ${hasCheckedInToday 
            ? '' 
            : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-sm'}`}
          variant={hasCheckedInToday ? 'outline' : 'default'}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {hasCheckedInToday ? '查看记录' : '立即打卡'}
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => navigate(`/camp-intro/${camp.camp_type}`)}
          className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-400 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          课程介绍
        </Button>
      </div>
    </Card>
  );
}

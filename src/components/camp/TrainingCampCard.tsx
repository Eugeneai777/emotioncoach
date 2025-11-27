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
  console.log('TrainingCampCard - Today:', today);
  console.log('TrainingCampCard - Check-in dates:', camp.check_in_dates);
  console.log('TrainingCampCard - Has checked in today:', camp.check_in_dates.includes(today));
  
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
    <Card className="p-5 bg-gradient-to-br from-primary/5 via-primary/3 to-secondary/5 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
            🏕️ {camp.camp_name}
          </h3>
          <div className="flex items-center gap-3 text-sm">
            {camp.status === 'active' && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                第 {displayCurrentDay} / {camp.duration_days} 天
              </Badge>
            )}
            {hasCheckedInToday ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-medium">今日已打卡</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 animate-pulse">
                <Circle className="h-3.5 w-3.5" />
                <span className="font-medium">待打卡</span>
              </div>
            )}
            {currentStreak > 0 && (
              <div className="flex items-center gap-1 text-primary">
                <Flame className="h-3.5 w-3.5" />
                <span className="font-medium">{currentStreak}天</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Progress Bar with Milestones */}
      <div className="space-y-4">
        <div className="relative">
          {/* Milestone Icons above progress bar */}
          <div className="relative h-8 mb-1">
            {getMilestones().map((milestone, idx) => (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${milestone.position}%` }}
              >
                <div className={`text-xl transition-all duration-300 ${
                  milestone.reached 
                    ? 'opacity-100 scale-110 animate-scale-in' 
                    : 'opacity-30 grayscale'
                }`}>
                  {milestone.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <Progress value={progressPercent} className="h-3 bg-secondary/30" />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">
                  {camp.completed_days}
                </span>
                <span className="text-sm text-muted-foreground">/ {camp.duration_days} 天</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-primary">
                <TrendingUp className="h-3.5 w-3.5" />
                {Math.round(progressPercent)}%
              </div>
            </div>
          </div>

          {/* Milestone Labels */}
          <div className="relative h-5 mt-1">
            {getMilestones().map((milestone, idx) => (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${milestone.position}%` }}
              >
                <div className={`text-xs transition-all ${
                  milestone.reached 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground opacity-50'
                }`}>
                  {milestone.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!hasCheckedInToday && camp.status === 'active' ? (
            <Button 
              onClick={() => navigate(`/camp-checkin/${camp.id}`)}
              className="flex-1 shadow-sm hover:shadow-md transition-shadow"
            >
              <Calendar className="h-4 w-4 mr-2" />
              立即打卡
            </Button>
          ) : (
            <Button 
              onClick={() => navigate(`/camp-checkin/${camp.id}`)}
              variant="outline"
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              记录今日
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate("/user-manual")}
            className="flex-1"
          >
            使用手册
          </Button>
        </div>
      </div>
    </Card>
  );
}

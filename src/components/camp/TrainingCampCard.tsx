import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrainingCamp } from "@/types/trainingCamp";
import { CheckCircle2, Circle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

interface TrainingCampCardProps {
  camp: TrainingCamp;
  onCheckIn?: () => void;
}

export function TrainingCampCard({ camp, onCheckIn }: TrainingCampCardProps) {
  const navigate = useNavigate();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasCheckedInToday = camp.check_in_dates.includes(today);
  const progressPercent = (camp.completed_days / camp.duration_days) * 100;
  
  // Calculate streak
  const sortedDates = [...camp.check_in_dates].sort().reverse();
  let currentStreak = 0;
  let checkDate = new Date();
  
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    const diff = differenceInDays(checkDate, date);
    if (diff <= 1) {
      currentStreak++;
      checkDate = date;
    } else {
      break;
    }
  }

  const getMilestones = () => [
    { icon: "🌱", label: "启程", reached: camp.completed_days >= 1 },
    { icon: "⭐", label: "一周", reached: camp.milestone_7_reached },
    { icon: "🌟", label: "半程", reached: camp.milestone_14_reached },
    { icon: "🏆", label: "毕业", reached: camp.milestone_21_completed }
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🏕️ {camp.camp_name}
        </h3>
        {camp.status === 'active' && (
          <span className="text-sm text-muted-foreground">
            第 {camp.current_day + 1} / {camp.duration_days} 天
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-primary">
              {camp.completed_days} / {camp.duration_days}
            </span>
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">今日状态</div>
            <div className="font-medium flex items-center gap-1">
              {hasCheckedInToday ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">已打卡</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span>未打卡</span>
                </>
              )}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">连续打卡</div>
            <div className="font-medium text-primary">
              🔥 {currentStreak} 天
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-2">里程碑进度</div>
          <div className="flex gap-2">
            {getMilestones().map((milestone, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div className={`text-2xl mb-1 transition-all ${
                  milestone.reached ? 'opacity-100 scale-110' : 'opacity-30'
                }`}>
                  {milestone.icon}
                </div>
                <div className="text-xs text-muted-foreground">{milestone.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {!hasCheckedInToday && camp.status === 'active' && (
            <Button 
              onClick={() => navigate(`/camp-checkin/${camp.id}`)}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              今日打卡
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate(`/camp/${camp.id}`)}
            className="flex-1"
          >
            查看进度
          </Button>
        </div>
      </div>
    </Card>
  );
}

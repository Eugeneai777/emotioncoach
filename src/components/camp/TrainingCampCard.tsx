import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrainingCamp } from "@/types/trainingCamp";
import { CheckCircle2, Circle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import CarouselCardWrapper from "@/components/home/CarouselCardWrapper";

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
    <CarouselCardWrapper 
      background="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"
      textMode="dark"
    >
      <div className="flex flex-col h-full space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🏕️ {camp.camp_name}
          </h3>
          {camp.status === 'active' && (
            <span className="text-xs text-muted-foreground font-medium">
              第 {camp.current_day + 1} / {camp.duration_days} 天
            </span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl font-bold text-primary">
                {camp.completed_days} / {camp.duration_days}
              </span>
              <span className="text-xs font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              {hasCheckedInToday ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-green-500 font-medium">已打卡</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">未打卡</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🔥</span>
              <span className="font-semibold text-primary">{currentStreak} 天连续</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              {getMilestones().map((milestone, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div className={`text-xl transition-all ${
                    milestone.reached ? 'opacity-100 scale-110' : 'opacity-30'
                  }`}>
                    {milestone.icon}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{milestone.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!hasCheckedInToday && camp.status === 'active' && (
            <Button onClick={onCheckIn} size="sm" className="flex-1 h-8 text-xs">
              <Calendar className="h-3 w-3 mr-1.5" />
              今日打卡
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/camp/${camp.id}`)}
            className="flex-1 h-8 text-xs"
          >
            查看进度
          </Button>
        </div>
      </div>
    </CarouselCardWrapper>
  );
}

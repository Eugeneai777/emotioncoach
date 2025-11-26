import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface CampMilestonesBadgesProps {
  completedDays: number;
  milestone7Reached: boolean;
  milestone14Reached: boolean;
  milestone21Completed: boolean;
}

export function CampMilestonesBadges({
  completedDays,
  milestone7Reached,
  milestone14Reached,
  milestone21Completed
}: CampMilestonesBadgesProps) {
  const milestones = [
    { 
      icon: "🌱", 
      label: "启程", 
      description: "完成第1天",
      reached: completedDays >= 1,
      daysNeeded: 1,
      daysLeft: Math.max(0, 1 - completedDays)
    },
    { 
      icon: "⭐", 
      label: "一周勇士", 
      description: "连续打卡7天",
      reached: milestone7Reached,
      daysNeeded: 7,
      daysLeft: Math.max(0, 7 - completedDays)
    },
    { 
      icon: "🌟", 
      label: "半程达人", 
      description: "完成14天",
      reached: milestone14Reached,
      daysNeeded: 14,
      daysLeft: Math.max(0, 14 - completedDays)
    },
    { 
      icon: "🏆", 
      label: "习惯大师", 
      description: "毕业啦！",
      reached: milestone21Completed,
      daysNeeded: 21,
      daysLeft: Math.max(0, 21 - completedDays)
    }
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        🏅 成就徽章
      </h4>
      
      <div className="grid grid-cols-2 gap-2">
        {milestones.map((milestone, idx) => (
          <Card 
            key={idx}
            className={cn(
              "p-3 text-center transition-all",
              milestone.reached 
                ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30" 
                : "opacity-50 bg-muted/30"
            )}
          >
            <div className="relative inline-block">
              <div className={cn(
                "text-3xl mb-1 transition-all",
                milestone.reached ? "scale-100" : "scale-90 grayscale"
              )}>
                {milestone.icon}
              </div>
              {!milestone.reached && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="text-xs font-medium mb-0.5">
              {milestone.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {milestone.description}
            </div>
            
            {!milestone.reached && milestone.daysLeft > 0 && (
              <div className="text-xs text-primary font-medium mt-1">
                还需 {milestone.daysLeft} 天
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

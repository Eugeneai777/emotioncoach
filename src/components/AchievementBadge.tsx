import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  icon: string | null;
  earned_at: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
}

const AchievementBadge = ({ achievement }: AchievementBadgeProps) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">
          {achievement.icon || "🏆"}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground text-sm">
              {achievement.achievement_name}
            </h3>
            <Badge variant="outline" className="text-xs shrink-0">
              {format(new Date(achievement.earned_at), "MM月dd日", { locale: zhCN })}
            </Badge>
          </div>
          {achievement.achievement_description && (
            <p className="text-xs text-muted-foreground">
              {achievement.achievement_description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AchievementBadge;

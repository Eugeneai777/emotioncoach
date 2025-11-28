import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface RecentBriefingCardProps {
  briefing: {
    id: string;
    created_at: string;
    emotion_theme: string;
    emotion_intensity: number | null;
    insight: string | null;
    action: string | null;
  };
}

export const RecentBriefingCard = ({ briefing }: RecentBriefingCardProps) => {
  const getIntensityColor = (intensity: number | null) => {
    if (!intensity) return "hsl(var(--muted))";
    if (intensity >= 8) return "hsl(var(--destructive))";
    if (intensity >= 6) return "hsl(var(--warning))";
    if (intensity >= 4) return "hsl(var(--primary))";
    return "hsl(var(--success))";
  };

  const intensityColor = getIntensityColor(briefing.emotion_intensity);

  return (
    <Card className="p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* 情绪主题和强度 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl">🎭</span>
          <h3 className="font-semibold text-base truncate">{briefing.emotion_theme}</h3>
        </div>
        {briefing.emotion_intensity !== null && (
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: intensityColor }}
          >
            {briefing.emotion_intensity}/10
          </div>
        )}
      </div>

      {/* 记录时间 */}
      <div className="text-xs text-muted-foreground">
        {format(new Date(briefing.created_at), "MM月dd日 HH:mm", { locale: zhCN })}
      </div>

      {/* 洞察 */}
      {briefing.insight && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <span>💡</span>
            <span>洞察</span>
          </div>
          <p className="text-sm text-foreground/90 line-clamp-2">
            {briefing.insight}
          </p>
        </div>
      )}

      {/* 行动计划 */}
      {briefing.action && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <span>🎯</span>
            <span>行动</span>
          </div>
          <p className="text-sm text-foreground/90 line-clamp-2">
            {briefing.action}
          </p>
        </div>
      )}
    </Card>
  );
};

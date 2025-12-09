import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

interface CoachRecommendationCardProps {
  coachKey: string;
  userIssueSummary: string;
  reasoning: string;
}

const coachConfig: Record<string, { emoji: string; title: string; route: string; gradient: string }> = {
  emotion: {
    emoji: "💚",
    title: "情绪觉醒教练",
    route: "/",
    gradient: "from-emerald-500 to-teal-500"
  },
  parent: {
    emoji: "👨‍👩‍👧",
    title: "亲子教练",
    route: "/parent-coach",
    gradient: "from-pink-500 to-rose-500"
  },
  communication: {
    emoji: "💬",
    title: "卡内基沟通教练",
    route: "/communication-coach",
    gradient: "from-blue-500 to-cyan-500"
  }
};

export const CoachRecommendationCard = ({
  coachKey,
  userIssueSummary,
  reasoning,
}: CoachRecommendationCardProps) => {
  const navigate = useNavigate();
  const config = coachConfig[coachKey];

  if (!config) return null;

  return (
    <Card className="mt-4 p-4 border-2 bg-gradient-to-br from-background to-muted/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-lg`}>
          {config.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <h4 className="font-semibold text-foreground">为你推荐专业教练</h4>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{config.title}</span> 能够更专业地帮助你：
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {reasoning}
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate(config.route)}
          size="sm"
          className="shrink-0 gap-1.5"
        >
          立即咨询
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

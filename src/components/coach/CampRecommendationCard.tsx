import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, Calendar, Users } from "lucide-react";

interface CampRecommendation {
  userGoal: string;
  recommendedCamp: string;
  whySuitable: string;
  howToStart: string;
}

interface CampRecommendationCardProps {
  recommendation: CampRecommendation;
  onDismiss: () => void;
}

const campConfig: Record<string, { name: string; emoji: string; gradient: string; bgColor: string; duration: string; route: string }> = {
  parent_emotion_21: {
    name: "21天青少年困境突破营",
    emoji: "👨‍👩‍👧",
    gradient: "from-purple-400 to-pink-500",
    bgColor: "bg-purple-50",
    duration: "21天",
    route: "/camp-intro?type=parent_emotion_21",
  },
  emotion_bloom: {
    name: "情感绽放训练营",
    emoji: "🌸",
    gradient: "from-rose-400 to-orange-500",
    bgColor: "bg-rose-50",
    duration: "21天",
    route: "/camp-intro?type=emotion_bloom",
  },
};

export const CampRecommendationCard = ({
  recommendation,
  onDismiss,
}: CampRecommendationCardProps) => {
  const navigate = useNavigate();
  const config = campConfig[recommendation.recommendedCamp] || campConfig.emotion_bloom;

  const handleStart = () => {
    onDismiss();
    navigate(config.route);
  };

  return (
    <Card className={`${config.bgColor} border-0 shadow-lg overflow-hidden`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-md`}>
            {config.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              训练营推荐
            </h3>
            <p className="text-sm text-muted-foreground">{config.name}</p>
          </div>
        </div>

        {/* Why suitable */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {recommendation.whySuitable}
        </p>

        {/* Camp info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{config.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>教练陪伴</span>
          </div>
        </div>

        {/* How to start */}
        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            📚 {recommendation.howToStart}
          </p>
        </div>

        {/* Action button */}
        <Button
          onClick={handleStart}
          className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 transition-opacity`}
        >
          了解详情
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
};

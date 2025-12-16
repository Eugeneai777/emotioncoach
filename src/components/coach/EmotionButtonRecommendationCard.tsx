import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";

interface EmotionButtonRecommendation {
  detectedEmotion: string;
  emotionChinese: string;
  whySuitable: string;
  howItHelps: string;
  quickTipGiven: string;
}

interface EmotionButtonRecommendationCardProps {
  recommendation: EmotionButtonRecommendation;
  onDismiss: () => void;
}

const emotionConfig: Record<string, { emoji: string; gradient: string; bgColor: string }> = {
  panic: { emoji: "😰", gradient: "from-teal-400 to-cyan-500", bgColor: "bg-teal-50" },
  worry: { emoji: "😟", gradient: "from-amber-400 to-orange-500", bgColor: "bg-amber-50" },
  negative: { emoji: "😔", gradient: "from-slate-400 to-gray-500", bgColor: "bg-slate-50" },
  fear: { emoji: "😨", gradient: "from-purple-400 to-violet-500", bgColor: "bg-purple-50" },
  irritable: { emoji: "😤", gradient: "from-orange-400 to-red-500", bgColor: "bg-orange-50" },
  stress: { emoji: "😫", gradient: "from-rose-400 to-pink-500", bgColor: "bg-rose-50" },
  powerless: { emoji: "😞", gradient: "from-stone-400 to-neutral-500", bgColor: "bg-stone-50" },
  collapse: { emoji: "💔", gradient: "from-red-400 to-rose-500", bgColor: "bg-red-50" },
  lost: { emoji: "🥺", gradient: "from-indigo-400 to-blue-500", bgColor: "bg-indigo-50" },
};

const stages = [
  { label: "觉察", emoji: "👁️" },
  { label: "理解", emoji: "💭" },
  { label: "稳定", emoji: "🌿" },
  { label: "转化", emoji: "✨" },
];

export const EmotionButtonRecommendationCard = ({
  recommendation,
  onDismiss,
}: EmotionButtonRecommendationCardProps) => {
  const navigate = useNavigate();
  const config = emotionConfig[recommendation.detectedEmotion] || emotionConfig.stress;

  const handleTryIt = () => {
    onDismiss();
    navigate("/");
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
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="flex items-center gap-1">
                情绪
                <span className="text-sm">🆘</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500 font-black text-xs tracking-wider">SOS</span>
                按钮推荐
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              针对「{recommendation.emotionChinese}」的专属疗愈
            </p>
          </div>
        </div>

        {/* Why suitable */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {recommendation.whySuitable}
        </p>

        {/* Four stages */}
        <div className="flex items-center justify-between px-2">
          {stages.map((stage, index) => (
            <div key={stage.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <span className="text-lg">{stage.emoji}</span>
                <span className="text-xs text-muted-foreground mt-1">{stage.label}</span>
              </div>
              {index < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* How it helps */}
        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 {recommendation.howItHelps}
          </p>
        </div>

        {/* Action button */}
        <Button
          onClick={handleTryIt}
          className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 transition-opacity`}
        >
          去试试看
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Learn more link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/emotion-button-intro')}
        >
          了解情绪按钮的科学原理 →
        </Button>
      </div>
    </Card>
  );
};

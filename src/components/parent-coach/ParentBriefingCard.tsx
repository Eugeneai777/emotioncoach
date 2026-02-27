import { Card } from "@/components/ui/card";
import { Sparkles, Eye, RefreshCw, Heart, Lightbulb, Zap } from "lucide-react";

interface BriefingData {
  emotion_theme: string;
  stage_1_content: string;
  stage_2_content: string;
  stage_3_content: string;
  stage_4_content: string;
  insight: string;
  action: string;
  growth_story: string;
}

interface ParentBriefingCardProps {
  briefing: BriefingData;
}

const stages = [
  { icon: Sparkles, label: "觉察", key: "stage_1_content", color: "text-blue-600" },
  { icon: Eye, label: "看见", key: "stage_2_content", color: "text-purple-600" },
  { icon: RefreshCw, label: "反应", key: "stage_3_content", color: "text-amber-600" },
  { icon: Heart, label: "转化", key: "stage_4_content", color: "text-pink-600" },
];

export const ParentBriefingCard = ({ briefing }: ParentBriefingCardProps) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200/50 dark:border-purple-800/50 space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">🌿 今日亲子觉察简报</p>
        <h3 className="font-semibold text-base">{briefing.emotion_theme}</h3>
      </div>

      {/* 4 Stages */}
      <div className="space-y-3">
        {stages.map(({ icon: Icon, label, key, color }) => {
          const content = briefing[key as keyof BriefingData];
          if (!content) return null;
          return (
            <div key={key} className="flex gap-2">
              <div className={`mt-0.5 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm leading-relaxed">{content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {briefing.insight && (
        <div className="bg-background/60 rounded-lg p-3 flex gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">今日洞察</p>
            <p className="text-sm font-medium">{briefing.insight}</p>
          </div>
        </div>
      )}

      {/* Action */}
      {briefing.action && (
        <div className="bg-background/60 rounded-lg p-3 flex gap-2">
          <Zap className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">今日微行动</p>
            <p className="text-sm font-medium">{briefing.action}</p>
          </div>
        </div>
      )}

      {/* Growth */}
      {briefing.growth_story && (
        <p className="text-xs text-center text-muted-foreground italic">
          🌱 {briefing.growth_story}
        </p>
      )}
    </Card>
  );
};

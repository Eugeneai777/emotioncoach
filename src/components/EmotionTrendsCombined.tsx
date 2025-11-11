import { Briefing } from "@/pages/History";
import EmotionTrendChart from "@/components/EmotionTrendChart";
import EmotionTagCloud from "@/components/EmotionTagCloud";
import EmotionCycleAnalysis from "@/components/EmotionCycleAnalysis";
import { Card } from "@/components/ui/card";

interface EmotionTrendsCombinedProps {
  briefings: Briefing[];
}

export const EmotionTrendsCombined = ({ briefings }: EmotionTrendsCombinedProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          🔄 周期分析
        </h3>
        <EmotionCycleAnalysis briefings={briefings} />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          📈 情绪趋势图
        </h3>
        <EmotionTrendChart briefings={briefings} />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          ☁️ 情绪标签云
        </h3>
        <EmotionTagCloud briefings={briefings} />
      </Card>
    </div>
  );
};

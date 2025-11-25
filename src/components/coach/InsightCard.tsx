import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface InsightCardProps {
  insight: string;
  suggestion: string;
}

export const InsightCard = ({ insight, suggestion }: InsightCardProps) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="flex gap-3">
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-purple-600" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">{insight}</p>
          <p className="text-xs text-muted-foreground">{suggestion}</p>
        </div>
      </div>
    </Card>
  );
};

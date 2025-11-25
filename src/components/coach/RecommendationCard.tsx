import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface RecommendationCardProps {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  reason: string;
  actionText: string;
  actionRoute: string;
  toolId?: string;
}

export const RecommendationCard = ({
  priority,
  title,
  reason,
  actionText,
  actionRoute,
  toolId,
}: RecommendationCardProps) => {
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return "border-red-500 bg-red-50";
    if (priority === 'medium') return "border-yellow-500 bg-yellow-50";
    return "border-blue-500 bg-blue-50";
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === 'high') return "高优先级";
    if (priority === 'medium') return "中优先级";
    return "建议";
  };

  const handleAction = () => {
    if (toolId) {
      navigate(actionRoute, { state: { scrollToTool: toolId } });
    } else {
      navigate(actionRoute);
    }
  };

  return (
    <Card className={`p-4 border-l-4 ${getPriorityColor(priority)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{title}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-background border">
              {getPriorityLabel(priority)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{reason}</p>
        </div>
        <Button 
          size="sm" 
          onClick={handleAction}
          className="shrink-0"
        >
          {actionText}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

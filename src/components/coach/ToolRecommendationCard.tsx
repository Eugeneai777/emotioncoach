import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wrench } from "lucide-react";
import { getToolById } from "@/config/energyStudioTools";

interface ToolRecommendationCardProps {
  userNeed: string;
  toolId: string;
  usageReason: string;
  onDismiss?: () => void;
}

export const ToolRecommendationCard = ({
  userNeed,
  toolId,
  usageReason,
  onDismiss,
}: ToolRecommendationCardProps) => {
  const navigate = useNavigate();
  const tool = getToolById(toolId);

  if (!tool) return null;

  return (
    <Card className="mt-4 p-4 border-2 bg-gradient-to-br from-background to-muted/30 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg`}>
          <Wrench className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🛠️</span>
            <h4 className="font-semibold text-foreground">为你推荐实用工具</h4>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{tool.title}</span> - {tool.description}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {usageReason}
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate(`/energy-studio/${toolId}`)}
          size="sm"
          className="shrink-0 gap-1.5"
        >
          立即体验
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={onDismiss}
        >
          ×
        </Button>
      )}
    </Card>
  );
};

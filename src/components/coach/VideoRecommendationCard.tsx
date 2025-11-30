import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Video } from "lucide-react";

interface VideoRecommendationCardProps {
  topicSummary: string;
  category: string;
  learningGoal: string;
}

export const VideoRecommendationCard = ({
  topicSummary,
  category,
  learningGoal,
}: VideoRecommendationCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="mt-4 p-4 border-2 bg-gradient-to-br from-background to-muted/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Video className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎬</span>
            <h4 className="font-semibold text-foreground">为你推荐视频课程</h4>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{category}</span> 系列课程
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {learningGoal}
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/courses')}
          size="sm"
          className="shrink-0 gap-1.5"
        >
          去学习
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

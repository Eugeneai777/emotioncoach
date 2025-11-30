import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Video } from "lucide-react";

interface VideoRecommendationCardProps {
  topicSummary: string;
  category: string;
  learningGoal: string;
  videoId?: string;
  videoTitle?: string;
  videoUrl?: string;
  onDismiss?: () => void;
}

export const VideoRecommendationCard = ({
  topicSummary,
  category,
  learningGoal,
  videoId,
  videoTitle,
  videoUrl,
  onDismiss,
}: VideoRecommendationCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    } else {
      navigate('/courses');
    }
  };

  return (
    <Card className="mt-4 p-4 border-2 bg-gradient-to-br from-background to-muted/30 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
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
            {videoTitle ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  {videoTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {category} · {learningGoal}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{category}</span> 系列课程
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {learningGoal}
                </p>
              </>
            )}
          </div>
        </div>

        <Button
          onClick={handleClick}
          size="sm"
          className="shrink-0 gap-1.5"
        >
          {videoUrl ? '观看视频' : '浏览课程'}
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

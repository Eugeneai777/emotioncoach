import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Target, CheckCircle2 } from "lucide-react";

interface NextStep {
  type: "continue" | "elevate" | "adjust";
  suggestion: string;
  reasoning: string;
}

interface FeedbackData {
  encouragement: string;
  achievement_summary: string;
  next_steps: NextStep[];
  celebration_message: string;
  stats?: {
    completion_rate: number;
    consecutive_goals: number;
  };
}

interface GoalCompletionFeedbackProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: FeedbackData | null;
}

const getStepIcon = (type: string) => {
  switch (type) {
    case "continue":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "elevate":
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    case "adjust":
      return <Target className="w-4 h-4 text-orange-600" />;
    default:
      return <Sparkles className="w-4 h-4 text-primary" />;
  }
};

const getStepLabel = (type: string) => {
  switch (type) {
    case "continue":
      return "继续保持";
    case "elevate":
      return "进一步提升";
    case "adjust":
      return "调整优化";
    default:
      return "建议";
  }
};

export const GoalCompletionFeedback = ({ open, onOpenChange, feedback }: GoalCompletionFeedbackProps) => {
  if (!feedback) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {feedback.celebration_message}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Achievement Stats */}
          {feedback.stats && (
            <div className="flex gap-2 justify-center">
              <Badge variant="secondary" className="text-sm">
                完成率 {feedback.stats.completion_rate}%
              </Badge>
              {feedback.stats.consecutive_goals > 1 && (
                <Badge variant="default" className="text-sm">
                  连续{feedback.stats.consecutive_goals}个目标
                </Badge>
              )}
            </div>
          )}

          {/* Encouragement */}
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <p className="text-sm leading-relaxed text-foreground/90">{feedback.encouragement}</p>
          </Card>

          {/* Achievement Summary */}
          <div className="text-center">
            <p className="text-sm font-medium text-primary">{feedback.achievement_summary}</p>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              下一步建议
            </h3>
            <div className="space-y-2">
              {feedback.next_steps.map((step, index) => (
                <Card key={index} className="p-3 hover:border-primary/30 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      {getStepIcon(step.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getStepLabel(step.type)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{step.suggestion}</p>
                        <p className="text-xs text-muted-foreground">{step.reasoning}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            好的，继续前进 ✨
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

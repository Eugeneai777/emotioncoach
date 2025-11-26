import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

interface DailyPracticeCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  completed: boolean;
  count?: number;
  onStart: () => void;
  disabled?: boolean;
}

const DailyPracticeCard = ({
  emoji,
  title,
  subtitle,
  description,
  duration,
  completed,
  count,
  onStart,
  disabled,
}: DailyPracticeCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300">
      <div className="space-y-4">
        {/* 头部 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{emoji}</div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {title}
                <Badge variant="outline" className="text-xs">
                  {duration}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {completed ? (
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* 描述 */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {description}
        </p>

        {/* 完成状态 */}
        {completed && count !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">
              已完成 {count} 次
            </span>
          </div>
        )}

        {/* 操作按钮 */}
        <Button
          onClick={onStart}
          disabled={disabled || completed}
          className="w-full"
          variant={completed ? "outline" : "default"}
        >
          {completed ? "已完成" : "开始练习"}
        </Button>
      </div>
    </Card>
  );
};

export default DailyPracticeCard;

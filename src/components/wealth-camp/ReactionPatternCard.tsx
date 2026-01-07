import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Target } from 'lucide-react';
import { useReactionPatternProgress } from '@/hooks/useReactionPatternProgress';
import { cn } from '@/lib/utils';

interface ReactionPatternCardProps {
  campId?: string;
  currentDay?: number;
  className?: string;
}

export const ReactionPatternCard: React.FC<ReactionPatternCardProps> = ({
  campId,
  currentDay,
  className,
}) => {
  const { patternConfig, transformationRate, awakeningMomentsCount, isLoading } = useReactionPatternProgress(campId);

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!patternConfig) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>完成财富评估后可查看反应模式</p>
        </CardContent>
      </Card>
    );
  }

  const { emoji, name, tagline, transformation, trainingFocus, bgColor, textColor, darkTextColor, description } = patternConfig;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          我的财富反应模式
          {currentDay && (
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              Day {currentDay}/21
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Pattern Display */}
        <div className={cn("rounded-lg p-4", bgColor)}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              <div>
                <h3 className={cn("font-semibold", textColor, darkTextColor)}>{name}</h3>
                <p className="text-sm text-muted-foreground">{tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xl">→</span>
              <span className="text-2xl">{transformation.toEmoji}</span>
              <span className={cn("font-medium", textColor, darkTextColor)}>{transformation.toName}</span>
            </div>
          </div>

          {/* Transformation Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">模式转化进度</span>
              <span className={cn("font-medium", textColor, darkTextColor)}>{transformationRate}%</span>
            </div>
            <Progress value={transformationRate} className="h-2" />
          </div>
        </div>

        {/* Training Focus */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">训练重点</p>
            <p className="text-sm text-muted-foreground">{trainingFocus}</p>
          </div>
        </div>

        {/* Transformation Path */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-amber-500" />
            转化路径
          </div>
          <div className="flex items-center justify-between px-2">
            <div className="flex-1 flex items-center gap-1">
              <div className={cn(
                "w-3 h-3 rounded-full",
                transformationRate < 25 ? "bg-primary ring-2 ring-primary/30" : "bg-muted-foreground/30"
              )} />
              <div className="flex-1 h-0.5 bg-muted-foreground/20" />
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div className={cn(
                "w-3 h-3 rounded-full",
                transformationRate >= 25 && transformationRate < 50 ? "bg-primary ring-2 ring-primary/30" : 
                transformationRate >= 25 ? "bg-primary" : "bg-muted-foreground/30"
              )} />
              <div className="flex-1 h-0.5 bg-muted-foreground/20" />
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div className={cn(
                "w-3 h-3 rounded-full",
                transformationRate >= 50 && transformationRate < 75 ? "bg-primary ring-2 ring-primary/30" : 
                transformationRate >= 50 ? "bg-primary" : "bg-muted-foreground/30"
              )} />
              <div className="flex-1 h-0.5 bg-muted-foreground/20" />
            </div>
            <div className={cn(
              "w-3 h-3 rounded-full",
              transformationRate >= 75 ? "bg-primary ring-2 ring-primary/30" : "bg-muted-foreground/30"
            )} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>{name}</span>
            <span>觉察</span>
            <span>接纳</span>
            <span>{transformation.toName}</span>
          </div>
        </div>

        {/* Stats */}
        {awakeningMomentsCount > 0 && (
          <div className="text-center text-sm text-muted-foreground pt-2 border-t">
            已累积 <span className="font-medium text-primary">{awakeningMomentsCount}</span> 个觉醒时刻
          </div>
        )}
      </CardContent>
    </Card>
  );
};

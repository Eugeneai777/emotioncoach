import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, ClipboardList, TrendingUp } from 'lucide-react';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface GrowthComparisonCardProps {
  campId?: string;
  currentDay: number;
  avgBehavior: string;
  avgEmotion: string;
  avgBelief: string;
  dominantBehavior?: string;
  dominantEmotion?: string;
  dominantBelief?: string;
}

export function GrowthComparisonCard({
  campId,
  currentDay,
  avgBehavior,
  avgEmotion,
  avgBelief,
  dominantBehavior,
  dominantEmotion,
  dominantBelief,
}: GrowthComparisonCardProps) {
  const { baseline, isLoading } = useAssessmentBaseline(campId);

  if (isLoading) {
    return (
      <Card className="shadow-sm animate-pulse">
        <CardContent className="p-4 h-48" />
      </Card>
    );
  }

  if (!baseline) {
    return null; // Don't show if no assessment baseline
  }

  // Calculate transformation rates (awakening score / 5 * 100)
  const behaviorRate = Math.round((parseFloat(avgBehavior) / 5) * 100);
  const emotionRate = Math.round((parseFloat(avgEmotion) / 5) * 100);
  const beliefRate = Math.round((parseFloat(avgBelief) / 5) * 100);

  // Calculate overall awakening index from averages
  const avgAwakening = (parseFloat(avgBehavior) + parseFloat(avgEmotion) + parseFloat(avgBelief)) / 3;
  const awakeningIndex = Math.round(avgAwakening * 20); // Convert 1-5 to 20-100

  // Get status labels
  const getStatusLabel = (score: number) => {
    if (score >= 80) return { label: '深度觉醒', color: 'text-emerald-600' };
    if (score >= 60) return { label: '觉醒中', color: 'text-amber-600' };
    if (score >= 40) return { label: '初步觉醒', color: 'text-orange-600' };
    return { label: '探索期', color: 'text-muted-foreground' };
  };

  const getPatternLabel = (score: number) => {
    if (score >= 70) return '追逐模式';
    if (score >= 50) return '焦虑模式';
    return '回避模式';
  };

  const awakeningStatus = getStatusLabel(awakeningIndex);
  const baselinePattern = baseline.reactionPatternName || getPatternLabel(baseline.total_score);

  const assessmentDate = format(new Date(baseline.created_at), 'M月d日', { locale: zhCN });

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          从测评到觉醒：我的成长轨迹
          <Badge variant="outline" className="ml-auto text-xs">
            Day {currentDay}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        {/* T0 vs Current comparison */}
        <div className="grid grid-cols-2 gap-3">
          {/* T0 Baseline */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>测评基线</span>
              <span className="text-[10px]">({assessmentDate})</span>
            </div>
            <div className="text-lg font-semibold">
              卡点指数 <span className="text-primary">{baseline.total_score}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {baselinePattern}
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 space-y-2 border border-primary/20">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>当前觉醒</span>
            </div>
            <div className="text-lg font-semibold">
              觉醒指数 <span className="text-primary">{awakeningIndex}</span>
            </div>
            <div className={`text-xs ${awakeningStatus.color}`}>
              {awakeningStatus.label}
            </div>
          </div>
        </div>

        {/* Arrow connector */}
        <div className="flex justify-center -my-1">
          <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90 sm:rotate-0" />
        </div>

        {/* Layer transformation progress */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">三层转化进度</div>
          
          {/* Behavior Layer */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                行为层
              </span>
              <span className="text-muted-foreground">
                {baseline.dominantPoorName || '—'} → {dominantBehavior || '觉察中'}
              </span>
              <span className="font-medium text-primary">{behaviorRate}%</span>
            </div>
            <Progress value={behaviorRate} className="h-1.5" />
          </div>

          {/* Emotion Layer */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                情绪层
              </span>
              <span className="text-muted-foreground">
                {baseline.dominantEmotionName || '—'} → {dominantEmotion || '觉察中'}
              </span>
              <span className="font-medium text-primary">{emotionRate}%</span>
            </div>
            <Progress value={emotionRate} className="h-1.5" />
          </div>

          {/* Belief Layer */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                信念层
              </span>
              <span className="text-muted-foreground">
                {baseline.dominantBeliefName || '—'} → {dominantBelief || '觉察中'}
              </span>
              <span className="font-medium text-primary">{beliefRate}%</span>
            </div>
            <Progress value={beliefRate} className="h-1.5" />
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">💬 AI洞察：</span>
          {emotionRate >= behaviorRate && emotionRate >= beliefRate ? (
            <span>你的情绪层转化最快，内在安定感正在增强；继续保持觉察...</span>
          ) : behaviorRate >= emotionRate && behaviorRate >= beliefRate ? (
            <span>你的行为层转化领先，{baseline.dominantPoorName}模式正在松动；继续实践新行为...</span>
          ) : (
            <span>你的信念层转化显著，新信念正在扎根；用行动巩固这份转变...</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

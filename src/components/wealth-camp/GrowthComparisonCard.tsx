import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, ClipboardList, TrendingUp, RefreshCw } from 'lucide-react';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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
  const navigate = useNavigate();
  const { baseline, isLoading } = useAssessmentBaseline(campId);
  const [showRadar, setShowRadar] = useState(true);

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

  // Normalize baseline scores for radar (assuming max score per dimension is ~30)
  const maxBaselineScore = 30;
  const baselineBehaviorNorm = Math.round((baseline.behavior_score / maxBaselineScore) * 100);
  const baselineEmotionNorm = Math.round((baseline.emotion_score / maxBaselineScore) * 100);
  const baselineBeliefNorm = Math.round((baseline.belief_score / maxBaselineScore) * 100);

  // Radar chart data - showing "卡点程度" vs "觉醒程度"
  const radarData = [
    {
      dimension: '行为层',
      卡点程度: baselineBehaviorNorm,
      觉醒程度: behaviorRate,
    },
    {
      dimension: '情绪层',
      卡点程度: baselineEmotionNorm,
      觉醒程度: emotionRate,
    },
    {
      dimension: '信念层',
      卡点程度: baselineBeliefNorm,
      觉醒程度: beliefRate,
    },
  ];

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

  // Check if user should be prompted for re-assessment (Day 7 or Day 21)
  const shouldShowReassessmentPrompt = currentDay === 7 || currentDay === 21;

  const handleReassessment = () => {
    navigate('/wealth-block?reassess=true');
  };

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
        {/* Re-assessment Prompt for Day 7 and Day 21 */}
        {shouldShowReassessmentPrompt && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                  {currentDay === 7 ? '第一周里程碑' : '训练营结业'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentDay === 7 
                    ? '完成7天训练！重新测评验证你的进步'
                    : '恭喜完成21天训练！重新测评见证蜕变'}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="border-amber-500/30 hover:bg-amber-500/10"
                onClick={handleReassessment}
              >
                重新测评
              </Button>
            </div>
          </div>
        )}

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

        {/* Radar Chart - Before/After Comparison */}
        {showRadar && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">三层对比雷达图</div>
              <button 
                onClick={() => setShowRadar(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                收起
              </button>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 9 }}
                    tickCount={5}
                  />
                  <Radar
                    name="卡点程度"
                    dataKey="卡点程度"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name="觉醒程度"
                    dataKey="觉醒程度"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    iconSize={8}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              红色区域越小、蓝色区域越大，说明转化越显著
            </p>
          </div>
        )}

        {!showRadar && (
          <button 
            onClick={() => setShowRadar(true)}
            className="w-full text-xs text-primary hover:underline py-1"
          >
            展开雷达图对比
          </button>
        )}

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

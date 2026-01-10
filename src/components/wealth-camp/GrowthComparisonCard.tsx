import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, ClipboardList, TrendingUp, RefreshCw, HelpCircle } from 'lucide-react';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { useFourPoorProgress } from '@/hooks/useFourPoorProgress';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fourPoorRichConfig } from '@/config/fourPoorConfig';

interface GrowthComparisonCardProps {
  campId?: string;
  currentDay: number;
  avgBehavior: string;
  avgEmotion: string;
  avgBelief: string;
  dominantBehavior?: string;
  dominantEmotion?: string;
  dominantBelief?: string;
  embedded?: boolean; // When true, renders without Card wrapper
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
  embedded = false,
}: GrowthComparisonCardProps) {
  const navigate = useNavigate();
  const { baseline, isLoading: baselineLoading } = useAssessmentBaseline(campId);
  const { transformationRates, isLoading: progressLoading } = useFourPoorProgress(campId);
  const [showRadar, setShowRadar] = useState(true);
  
  const isLoading = baselineLoading || progressLoading;

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

  // Use FourPoorProgress transformation rates for consistency with FourPersonalityCard
  // Calculate average transformation rate across all four poor types
  const avgFourPoorRate = Math.round(
    (transformationRates.mouth + transformationRates.hand + transformationRates.eye + transformationRates.heart) / 4
  );
  
  // Calculate layer-based transformation rates (awakening score / 5 * 100)
  const behaviorRate = Math.round((parseFloat(avgBehavior) / 5) * 100);
  const emotionRate = Math.round((parseFloat(avgEmotion) / 5) * 100);
  const beliefRate = Math.round((parseFloat(avgBelief) / 5) * 100);

  // Calculate overall awakening index - weighted blend of four poor progress and layer scores
  const layerAwakening = (parseFloat(avgBehavior) + parseFloat(avgEmotion) + parseFloat(avgBelief)) / 3;
  const layerIndex = Math.round(((layerAwakening - 1) / 4) * 100); // 0-100 scale
  const awakeningIndex = Math.round((layerIndex + avgFourPoorRate) / 2); // Blend both metrics

  // Use unified awakening percentages from baseline (already converted in useAssessmentBaseline)
  // Radar chart data - showing "觉醒起点" vs "当前觉醒" (both using positive awakening scale)
  const radarData = [
    {
      dimension: '行为层',
      觉醒起点: baseline.behaviorAwakening ?? 0,
      当前觉醒: behaviorRate,
    },
    {
      dimension: '情绪层',
      觉醒起点: baseline.emotionAwakening ?? 0,
      当前觉醒: emotionRate,
    },
    {
      dimension: '信念层',
      觉醒起点: baseline.beliefAwakening ?? 0,
      当前觉醒: beliefRate,
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
  const shouldShowReassessmentPrompt = currentDay === 3 || currentDay === 7;

  const handleReassessment = () => {
    navigate('/wealth-block?reassess=true');
  };

  const content = (
    <div className={embedded ? "space-y-4" : ""}>
      {/* Re-assessment Prompt for Day 7 and Day 21 */}
      {shouldShowReassessmentPrompt && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                {currentDay === 3 ? '第3天里程碑' : '训练营结业'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentDay === 3 
                  ? '完成3天训练！重新测评验证你的进步'
                  : '恭喜完成财富觉醒训练营！重新测评见证蜕变'}
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
            <span>觉醒起点</span>
            <span className="text-[10px]">({assessmentDate})</span>
          </div>
          <div className="text-lg font-semibold">
            起点指数 <span className="text-emerald-600">{baseline.awakeningStart}</span>
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
                  name="觉醒起点"
                  dataKey="觉醒起点"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="当前觉醒"
                  dataKey="当前觉醒"
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
            灰色为觉醒起点，蓝色为当前觉醒，蓝色区域越大说明成长越显著
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

      {/* Four Poor Transformation - Consistent with FourPersonalityCard */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground">四穷转化进度</div>
        
        {/* Mouth */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{fourPoorRichConfig.mouth.poorEmoji}</span>
              {fourPoorRichConfig.mouth.poorName}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{fourPoorRichConfig.mouth.richEmoji}</span>
              {fourPoorRichConfig.mouth.richName}
            </span>
            <span className="font-medium" style={{ color: fourPoorRichConfig.mouth.color }}>
              {transformationRates.mouth}%
            </span>
          </div>
          <Progress value={transformationRates.mouth} className="h-1.5" />
        </div>

        {/* Hand */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{fourPoorRichConfig.hand.poorEmoji}</span>
              {fourPoorRichConfig.hand.poorName}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{fourPoorRichConfig.hand.richEmoji}</span>
              {fourPoorRichConfig.hand.richName}
            </span>
            <span className="font-medium" style={{ color: fourPoorRichConfig.hand.color }}>
              {transformationRates.hand}%
            </span>
          </div>
          <Progress value={transformationRates.hand} className="h-1.5" />
        </div>

        {/* Eye */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{fourPoorRichConfig.eye.poorEmoji}</span>
              {fourPoorRichConfig.eye.poorName}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{fourPoorRichConfig.eye.richEmoji}</span>
              {fourPoorRichConfig.eye.richName}
            </span>
            <span className="font-medium" style={{ color: fourPoorRichConfig.eye.color }}>
              {transformationRates.eye}%
            </span>
          </div>
          <Progress value={transformationRates.eye} className="h-1.5" />
        </div>

        {/* Heart */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{fourPoorRichConfig.heart.poorEmoji}</span>
              {fourPoorRichConfig.heart.poorName}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{fourPoorRichConfig.heart.richEmoji}</span>
              {fourPoorRichConfig.heart.richName}
            </span>
            <span className="font-medium" style={{ color: fourPoorRichConfig.heart.color }}>
              {transformationRates.heart}%
            </span>
          </div>
          <Progress value={transformationRates.heart} className="h-1.5" />
        </div>
      </div>

      {/* AI Insight - 简化版 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-200/50">
        <div className="text-xs space-y-1">
          <span className="font-medium text-amber-800 dark:text-amber-200">💬 成长小结</span>
          <p className="text-amber-700 dark:text-amber-300">
            {avgFourPoorRate >= 60 ? (
              <>你的财富能量正在快速转化！保持每日觉察，新模式正在稳固。</>
            ) : avgFourPoorRate >= 30 ? (
              <>觉察之旅已启程，{baseline.dominantPoorName}模式开始松动。每一天的练习都在累积改变。</>
            ) : (
              <>种子已经种下，持续觉察会带来意想不到的转变。相信这个过程。</>
            )}
          </p>
        </div>
      </div>
    </div>
  );

  // Embedded mode: no wrapper
  if (embedded) {
    return content;
  }

  // Standalone mode: with Card wrapper
  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          从测评到觉醒：我的成长轨迹
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] p-3">
                <div className="text-xs space-y-1.5">
                  <p className="font-medium">数据说明</p>
                  <p className="text-muted-foreground">成长对比展示觉醒起点与当前觉醒状态的差异：</p>
                  <ul className="text-muted-foreground list-disc pl-3 space-y-0.5">
                    <li>觉醒起点：测评转换后的初始觉醒分数 (100-卡点分)</li>
                    <li>觉醒指数：(平均分-1)/4×100，分数越高觉醒越深</li>
                    <li>雷达图：灰色为觉醒起点，蓝色为当前觉醒</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant="outline" className="ml-auto text-xs">
            Day {currentDay}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        {content}
      </CardContent>
    </Card>
  );
}

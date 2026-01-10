import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ClipboardList, TrendingUp, RefreshCw, HelpCircle, ChevronDown, ChevronUp, Eye, Heart, Lightbulb } from 'lucide-react';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface GrowthComparisonCardProps {
  campId?: string;
  currentDay: number;
  avgBehavior: string;
  avgEmotion: string;
  avgBelief: string;
  dominantBehavior?: string;
  dominantEmotion?: string;
  dominantBelief?: string;
  embedded?: boolean;
}

interface LayerComparison {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  baseline: number;
  current: number;
  growth: number;
}

// 语义化进度描述
const getGrowthSemantic = (growth: number) => {
  if (growth >= 30) return { emoji: '🚀', label: '飞速成长', color: 'text-emerald-600' };
  if (growth >= 15) return { emoji: '📈', label: '稳步提升', color: 'text-green-600' };
  if (growth >= 5) return { emoji: '🌱', label: '初见成效', color: 'text-amber-600' };
  if (growth > 0) return { emoji: '✨', label: '开始萌芽', color: 'text-orange-600' };
  return { emoji: '💪', label: '继续加油', color: 'text-muted-foreground' };
};

export function GrowthComparisonCard({
  campId,
  currentDay,
  avgBehavior,
  avgEmotion,
  avgBelief,
  embedded = false,
}: GrowthComparisonCardProps) {
  const navigate = useNavigate();
  const { baseline, isLoading: baselineLoading } = useAssessmentBaseline(campId);
  const [showRadar, setShowRadar] = useState(false);

  if (baselineLoading) {
    return (
      <Card className="shadow-sm animate-pulse">
        <CardContent className="p-4 h-48" />
      </Card>
    );
  }

  if (!baseline) {
    return null;
  }

  // Calculate layer-based rates (1-5 star to 0-100%)
  const behaviorRate = Math.round((parseFloat(avgBehavior) / 5) * 100);
  const emotionRate = Math.round((parseFloat(avgEmotion) / 5) * 100);
  const beliefRate = Math.round((parseFloat(avgBelief) / 5) * 100);

  // Overall awakening index
  const layerAwakening = (parseFloat(avgBehavior) + parseFloat(avgEmotion) + parseFloat(avgBelief)) / 3;
  const awakeningIndex = Math.round(((layerAwakening - 1) / 4) * 100);

  // Build layer comparison data
  const layers: LayerComparison[] = [
    {
      name: '行为层',
      icon: Eye,
      colorClass: 'bg-amber-500',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      baseline: baseline.behaviorAwakening ?? 0,
      current: behaviorRate,
      growth: behaviorRate - (baseline.behaviorAwakening ?? 0),
    },
    {
      name: '情绪层',
      icon: Heart,
      colorClass: 'bg-rose-500',
      bgClass: 'bg-rose-100 dark:bg-rose-900/30',
      baseline: baseline.emotionAwakening ?? 0,
      current: emotionRate,
      growth: emotionRate - (baseline.emotionAwakening ?? 0),
    },
    {
      name: '信念层',
      icon: Lightbulb,
      colorClass: 'bg-violet-500',
      bgClass: 'bg-violet-100 dark:bg-violet-900/30',
      baseline: baseline.beliefAwakening ?? 0,
      current: beliefRate,
      growth: beliefRate - (baseline.beliefAwakening ?? 0),
    },
  ];

  // Calculate growth insight
  const fastestLayer = layers.reduce((a, b) => a.growth > b.growth ? a : b);
  const needsWorkLayer = layers.reduce((a, b) => a.current < b.current ? a : b);
  const totalGrowth = awakeningIndex - (baseline.awakeningStart ?? 0);

  // Radar chart data
  const radarData = layers.map(l => ({
    dimension: l.name,
    觉醒起点: l.baseline,
    当前觉醒: l.current,
  }));

  // Status labels
  const getStatusLabel = (score: number) => {
    if (score >= 80) return { label: '深度觉醒', color: 'text-emerald-600' };
    if (score >= 60) return { label: '觉醒中', color: 'text-amber-600' };
    if (score >= 40) return { label: '初步觉醒', color: 'text-orange-600' };
    return { label: '探索期', color: 'text-muted-foreground' };
  };

  const awakeningStatus = getStatusLabel(awakeningIndex);
  const baselineStatus = getStatusLabel(baseline.awakeningStart ?? 0);
  const assessmentDate = format(new Date(baseline.created_at), 'M月d日', { locale: zhCN });

  // Re-assessment prompt
  const shouldShowReassessmentPrompt = currentDay === 3 || currentDay === 7;

  const handleReassessment = () => {
    navigate('/wealth-block?reassess=true');
  };

  const content = (
    <div className={embedded ? "space-y-4" : ""}>
      {/* Re-assessment Prompt */}
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

      {/* T0 vs Current comparison - simplified */}
      <div className="grid grid-cols-2 gap-3">
        {/* T0 Baseline */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Day 0</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {baseline.awakeningStart ?? 0}
          </div>
          <div className={cn("text-xs", baselineStatus.color)}>
            {baselineStatus.label}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {assessmentDate} 测评
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 space-y-1.5 border border-primary/20">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Day {currentDay}</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-primary">
            {awakeningIndex}
          </div>
          <div className={cn("text-xs", awakeningStatus.color)}>
            {awakeningStatus.label}
          </div>
          {totalGrowth > 0 && (
            <div className="text-[10px] text-emerald-600 font-medium">
              +{totalGrowth} 成长
            </div>
          )}
        </div>
      </div>

      {/* Three Layer Before/After Comparison */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          三层成长对比
          <span className="text-[10px] text-muted-foreground/70">灰色=起点 · 彩色=当前</span>
        </div>
        
        {layers.map((layer) => {
          const growthSemantic = getGrowthSemantic(layer.growth);
          const Icon = layer.icon;
          
          return (
            <div key={layer.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className="w-3.5 h-3.5" />
                  {layer.name}
                </span>
                <span className={cn("font-medium flex items-center gap-1", growthSemantic.color)}>
                  {layer.growth > 0 && growthSemantic.emoji}
                  {layer.growth > 0 ? `+${layer.growth}%` : `${layer.growth}%`}
                </span>
              </div>
              
              {/* Dual progress bar */}
              <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
                {/* Baseline marker - dashed line */}
                <div 
                  className="absolute top-0 h-full border-r-2 border-dashed border-muted-foreground/50 z-10"
                  style={{ left: `${Math.min(layer.baseline, 100)}%` }}
                />
                {/* Baseline fill - grey */}
                <div 
                  className="absolute top-0 h-full bg-muted-foreground/20 rounded-full"
                  style={{ width: `${layer.baseline}%` }}
                />
                {/* Current fill - colored */}
                <div 
                  className={cn("absolute top-0 h-full rounded-full transition-all duration-500", layer.colorClass)}
                  style={{ width: `${layer.current}%` }}
                />
              </div>
              
              {/* Labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>起点 {layer.baseline}%</span>
                <span className={layer.current > layer.baseline ? 'text-foreground font-medium' : ''}>
                  当前 {layer.current}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Growth Insight Summary */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-emerald-200/50 space-y-2">
        <div className="text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
          ✨ 成长亮点
        </div>
        <div className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
          {fastestLayer.growth > 0 ? (
            <p>
              🎯 <strong>{fastestLayer.name}</strong>成长最快，已提升{fastestLayer.growth}%！
              {getGrowthSemantic(fastestLayer.growth).label}
            </p>
          ) : (
            <p>🌱 觉察之旅刚刚开始，每天的练习都在积累改变的力量</p>
          )}
          {needsWorkLayer.current < 50 && needsWorkLayer.name !== fastestLayer.name && (
            <p className="text-emerald-600/80 dark:text-emerald-400/80">
              💡 <strong>{needsWorkLayer.name}</strong>是深层突破的关键，持续觉察会有惊喜
            </p>
          )}
        </div>
      </div>

      {/* Collapsible Radar Chart */}
      <Collapsible open={showRadar} onOpenChange={setShowRadar}>
        <CollapsibleTrigger className="w-full flex items-center justify-center gap-1 text-xs text-primary hover:underline py-1">
          {showRadar ? (
            <>收起雷达图 <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>展开雷达图对比 <ChevronDown className="w-3 h-3" /></>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 mt-2">
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
              灰色区域为觉醒起点，蓝色区域为当前觉醒
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          成长对比
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] p-3">
                <div className="text-xs space-y-1.5">
                  <p className="font-medium">数据说明</p>
                  <ul className="text-muted-foreground list-disc pl-3 space-y-0.5">
                    <li>Day 0：首次测评的觉醒起点</li>
                    <li>Day {currentDay}：当前觉醒指数</li>
                    <li>三层对比：每层的起点→当前变化</li>
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

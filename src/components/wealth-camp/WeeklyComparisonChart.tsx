import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';

interface JournalEntry {
  day_number: number;
  behavior_score: number | null;
  emotion_score: number | null;
  belief_score: number | null;
  created_at: string;
}

interface WeeklyComparisonChartProps {
  entries: JournalEntry[];
  className?: string;
}

interface WeekData {
  week: string;
  weekNum: number;
  behavior: number;
  emotion: number;
  belief: number;
  overall: number;
  entryCount: number;
}

export function WeeklyComparisonChart({ entries, className }: WeeklyComparisonChartProps) {
  const { weeklyData, highlights } = useMemo(() => {
    // Group entries by phase (1-3: Phase 1, 4-7: Phase 2) for 7-day camp
    const weeks: Record<number, JournalEntry[]> = { 1: [], 2: [] };
    
    (entries || []).forEach(entry => {
      if (entry.day_number <= 3) {
        weeks[1].push(entry);
      } else if (entry.day_number <= 7) {
        weeks[2].push(entry);
      }
    });

    // Calculate averages for each week
    const calculateAvg = (weekEntries: JournalEntry[] | undefined, key: 'behavior_score' | 'emotion_score' | 'belief_score') => {
      if (!weekEntries || weekEntries.length === 0) return 0;
      const scores = weekEntries.map(e => e[key]).filter((s): s is number => s !== null && s > 0);
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    };

    // Only use 2 phases for 7-day camp (Day 1-3 and Day 4-7)
    const weekLabels = ['上半程', '下半程'];
    const weeklyData: WeekData[] = [1, 2].map(weekNum => {
      const weekEntries = weeks[weekNum] || [];
      const behavior = calculateAvg(weekEntries, 'behavior_score');
      const emotion = calculateAvg(weekEntries, 'emotion_score');
      const belief = calculateAvg(weekEntries, 'belief_score');
      const validScores = [behavior, emotion, belief].filter(s => s > 0);
      const overall = validScores.length > 0 
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
        : 0;

      return {
        week: weekLabels[weekNum - 1],
        weekNum,
        behavior: Math.round(behavior * 10) / 10,
        emotion: Math.round(emotion * 10) / 10,
        belief: Math.round(belief * 10) / 10,
        overall: Math.round(overall * 10) / 10,
        entryCount: weekEntries.length,
      };
    });

    // Calculate highlights (biggest improvements)
    const highlights: { dimension: string; change: number; fromWeek: number; toWeek: number }[] = [];
    
    const dimensions = [
      { key: 'behavior' as const, label: '行为层' },
      { key: 'emotion' as const, label: '情绪层' },
      { key: 'belief' as const, label: '信念层' },
    ];

    dimensions.forEach(dim => {
      let maxChange = 0;
      let fromWeek = 0;
      let toWeek = 0;

      for (let i = 0; i < weeklyData.length - 1; i++) {
        for (let j = i + 1; j < weeklyData.length; j++) {
          if (weeklyData[i].entryCount > 0 && weeklyData[j].entryCount > 0) {
            const change = weeklyData[j][dim.key] - weeklyData[i][dim.key];
            if (change > maxChange) {
              maxChange = change;
              fromWeek = i + 1;
              toWeek = j + 1;
            }
          }
        }
      }

      if (maxChange > 0.3) {
        highlights.push({
          dimension: dim.label,
          change: Math.round(maxChange * 10) / 10,
          fromWeek,
          toWeek,
        });
      }
    });

    // Sort by biggest change
    highlights.sort((a, b) => b.change - a.change);

    return { weeklyData, highlights };
  }, [entries]);

  // Check if we have enough data
  const hasEnoughData = weeklyData.some(w => w.entryCount > 0);
  const hasMultipleWeeks = weeklyData.filter(w => w.entryCount > 0).length >= 2;

  if (!hasEnoughData) {
    return null;
  }

  const colors = {
    behavior: '#f59e0b',
    emotion: '#ec4899',
    belief: '#8b5cf6',
  };

  // Check if embedded (no Card wrapper needed when className includes border-0)
  const isEmbedded = className?.includes('border-0') || className?.includes('shadow-none');

  const content = (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={weeklyData.filter(w => w.entryCount > 0)} 
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload as WeekData;
                return (
                  <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg text-xs">
                    <p className="font-medium mb-2">{label} (共{data.entryCount}天)</p>
                    <div className="space-y-1">
                      <p className="text-amber-600">行为: {data.behavior}</p>
                      <p className="text-pink-600">情绪: {data.emotion}</p>
                      <p className="text-violet-600">信念: {data.belief}</p>
                      <p className="text-emerald-600 font-medium border-t pt-1 mt-1">综合: {data.overall}</p>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine y={3} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <Bar dataKey="behavior" name="行为" fill={colors.behavior} radius={[4, 4, 0, 0]} />
            <Bar dataKey="emotion" name="情绪" fill={colors.emotion} radius={[4, 4, 0, 0]} />
            <Bar dataKey="belief" name="信念" fill={colors.belief} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-muted-foreground">行为</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-pink-500" />
          <span className="text-muted-foreground">情绪</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-violet-500" />
          <span className="text-muted-foreground">信念</span>
        </div>
      </div>

      {/* Growth Highlights */}
      {hasMultipleWeeks && highlights.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">🌟 成长亮点</p>
          <div className="space-y-1.5">
            {highlights.slice(0, 3).map((highlight, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-xs text-green-800 dark:text-green-200">
                  <span className="font-medium">{highlight.dimension}</span>
                  {' '}从第{highlight.fromWeek}周到第{highlight.toWeek}周提升了{' '}
                  <span className="font-bold text-green-600">+{highlight.change}</span> 分
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        {weeklyData.map((week) => {
          const prevWeek = weeklyData.find(w => w.weekNum === week.weekNum - 1);
          const change = prevWeek && prevWeek.entryCount > 0 && week.entryCount > 0
            ? week.overall - prevWeek.overall
            : 0;
          
          return (
            <div 
              key={week.weekNum}
              className={cn(
                "p-2 rounded-lg text-center",
                week.entryCount > 0 
                  ? "bg-violet-50 dark:bg-violet-900/20" 
                  : "bg-muted/30 opacity-50"
              )}
            >
              <p className="text-xs text-muted-foreground mb-0.5">{week.week}</p>
              {week.entryCount > 0 ? (
                <>
                  <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                    {week.overall}
                  </p>
                  {change !== 0 && (
                    <div className={cn(
                      "flex items-center justify-center gap-0.5 text-xs",
                      change > 0 ? "text-green-600" : "text-amber-600"
                    )}>
                      {change > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{change > 0 ? '+' : ''}{change.toFixed(1)}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Embedded mode
  if (isEmbedded) {
    return content;
  }

  // Standalone mode with Card wrapper
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-600" />
          周维度对比
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] p-3">
                <div className="text-xs space-y-1.5">
                  <p className="font-medium">数据说明</p>
                  <p className="text-muted-foreground">阶段对比图展示财富觉醒训练营三层觉醒的变化：</p>
                  <ul className="text-muted-foreground list-disc pl-3 space-y-0.5">
                    <li>数据分组：Day 1-3 为上半程，Day 4-7 为下半程</li>
                    <li>评分来源：每日日记的行为/情绪/信念层评分（1-5分）</li>
                    <li>成长亮点：识别跨周提升最显著的维度</li>
                  </ul>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
          {hasMultipleWeeks && highlights.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              {highlights.length}个成长亮点
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {content}
      </CardContent>
    </Card>
  );
}

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface JournalEntry {
  day_number: number;
  behavior_score: number | null;
  emotion_score: number | null;
  belief_score: number | null;
  created_at: string;
}

interface WealthProgressChartProps {
  entries: JournalEntry[];
  embedded?: boolean;
}

type DimensionKey = 'all' | 'behavior' | 'emotion' | 'belief';

const DIMENSION_CONFIG = {
  all: { label: '综合', color: '#10b981' },
  behavior: { label: '行为', color: '#d97706' },
  emotion: { label: '情绪', color: '#ec4899' },
  belief: { label: '信念', color: '#8b5cf6' },
};

export function WealthProgressChart({ entries, embedded = false }: WealthProgressChartProps) {
  const [activeDimension, setActiveDimension] = useState<DimensionKey>('all');

  const chartData = useMemo(() => {
    return entries
      .filter(e => e.behavior_score || e.emotion_score || e.belief_score)
      .sort((a, b) => a.day_number - b.day_number)
      .map(entry => {
        const behavior = entry.behavior_score || 0;
        const emotion = entry.emotion_score || 0;
        const belief = entry.belief_score || 0;
        const validScores = [behavior, emotion, belief].filter(s => s > 0);
        const composite = validScores.length > 0 
          ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10 
          : 0;
        
        return {
          day: `Day ${entry.day_number}`,
          dayNum: entry.day_number,
          行为流动度: behavior,
          情绪流动度: emotion,
          信念松动度: belief,
          综合觉醒: composite,
        };
      })
      .slice(-14);
  }, [entries]);

  // Calculate dimension-specific stats
  const dimensionStats = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    
    const getChange = (key: string) => {
      const firstVal = first[key as keyof typeof first] as number || 0;
      const lastVal = last[key as keyof typeof last] as number || 0;
      return lastVal - firstVal;
    };
    
    return {
      behavior: { 
        change: getChange('行为流动度'),
        avg: chartData.reduce((sum, d) => sum + (d.行为流动度 || 0), 0) / chartData.length,
      },
      emotion: {
        change: getChange('情绪流动度'),
        avg: chartData.reduce((sum, d) => sum + (d.情绪流动度 || 0), 0) / chartData.length,
      },
      belief: {
        change: getChange('信念松动度'),
        avg: chartData.reduce((sum, d) => sum + (d.信念松动度 || 0), 0) / chartData.length,
      },
    };
  }, [chartData]);

  if (chartData.length === 0) {
    if (embedded) {
      return (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          完成财富梳理后，这里将显示你的成长曲线
        </div>
      );
    }
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <span>📊</span> 成长曲线
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-amber-600 dark:text-amber-400">
            完成财富梳理后，这里将显示你的成长曲线
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine which lines to show based on active dimension
  const showAll = activeDimension === 'all';
  const showBehavior = showAll || activeDimension === 'behavior';
  const showEmotion = showAll || activeDimension === 'emotion';
  const showBelief = showAll || activeDimension === 'belief';

  const chartContent = (
    <>
      {/* Dimension Toggle */}
      <div className="flex justify-center mb-3">
        <ToggleGroup 
          type="single" 
          value={activeDimension} 
          onValueChange={(v) => v && setActiveDimension(v as DimensionKey)}
          className="bg-muted/50 p-1 rounded-lg"
        >
          <ToggleGroupItem value="all" className="text-xs px-3 data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-700">
            综合
          </ToggleGroupItem>
          <ToggleGroupItem value="behavior" className="text-xs px-3 data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700">
            行为
          </ToggleGroupItem>
          <ToggleGroupItem value="emotion" className="text-xs px-3 data-[state=on]:bg-pink-100 data-[state=on]:text-pink-700">
            情绪
          </ToggleGroupItem>
          <ToggleGroupItem value="belief" className="text-xs px-3 data-[state=on]:bg-violet-100 data-[state=on]:text-violet-700">
            信念
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Dimension Stats (when specific dimension selected) */}
      {!showAll && dimensionStats && (
        <div className="flex justify-center gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">平均:</span>
            <span className="font-medium" style={{ color: DIMENSION_CONFIG[activeDimension].color }}>
              {dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].avg.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">变化:</span>
            <span className={`font-medium ${dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].change >= 0 ? '+' : ''}
              {dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].change.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={embedded ? 200 : 280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
          />
          <YAxis 
            domain={[0, 5]} 
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [value.toFixed(1), name]}
          />
          {!embedded && <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />}
          
          {/* 综合觉醒分 - 主曲线 */}
          {showAll && (
            <Line 
              type="monotone" 
              dataKey="综合觉醒" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          )}
          
          {/* 行为层 */}
          {showBehavior && (
            <Line 
              type="monotone" 
              dataKey="行为流动度" 
              stroke="#d97706" 
              strokeWidth={showAll ? 2 : 3}
              dot={{ fill: '#d97706', r: showAll ? 3 : 5 }}
              strokeOpacity={1}
            />
          )}
          
          {/* 情绪层 */}
          {showEmotion && (
            <Line 
              type="monotone" 
              dataKey="情绪流动度" 
              stroke="#ec4899" 
              strokeWidth={showAll ? 2 : 3}
              dot={{ fill: '#ec4899', r: showAll ? 3 : 5 }}
              strokeOpacity={1}
            />
          )}
          
          {/* 信念层 */}
          {showBelief && (
            <Line 
              type="monotone" 
              dataKey="信念松动度" 
              stroke="#8b5cf6" 
              strokeWidth={showAll ? 2 : 3}
              dot={{ fill: '#8b5cf6', r: showAll ? 3 : 5 }}
              strokeOpacity={1}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Score Legend - only in embedded mode */}
      {embedded && (
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
          {showAll && (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>综合</span>
            </div>
          )}
          {showBehavior && (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              <span>行为</span>
            </div>
          )}
          {showEmotion && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-pink-500" />
              <span>情绪</span>
            </div>
          )}
          {showBelief && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span>信念</span>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div>{chartContent}</div>;
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span>📊</span> 成长曲线
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  );
}

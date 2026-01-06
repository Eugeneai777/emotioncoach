import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JournalEntry {
  day_number: number;
  behavior_score: number | null;
  emotion_score: number | null;
  belief_score: number | null;
  created_at: string;
}

interface WealthProgressChartProps {
  entries: JournalEntry[];
}

export function WealthProgressChart({ entries }: WealthProgressChartProps) {
  const chartData = useMemo(() => {
    return entries
      .filter(e => e.behavior_score || e.emotion_score || e.belief_score)
      .sort((a, b) => a.day_number - b.day_number) // 确保按天数升序排列
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
          行为流动度: behavior,
          情绪流动度: emotion,
          信念松动度: belief,
          综合觉醒: composite,
        };
      })
      .slice(-14); // Show last 14 days
  }, [entries]);

  if (chartData.length === 0) {
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

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span>📊</span> 成长曲线
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
            />
            <YAxis 
              domain={[0, 5]} 
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value: number) => [value.toFixed(1), '']}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {/* 综合觉醒分 - 主曲线 */}
            <Line 
              type="monotone" 
              dataKey="综合觉醒" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2 }}
            />
            {/* 行为层 */}
            <Line 
              type="monotone" 
              dataKey="行为流动度" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 3 }}
              strokeOpacity={0.8}
            />
            {/* 情绪层 */}
            <Line 
              type="monotone" 
              dataKey="情绪流动度" 
              stroke="#ec4899" 
              strokeWidth={2}
              dot={{ fill: '#ec4899', r: 3 }}
              strokeOpacity={0.8}
            />
            {/* 信念层 - 增强可见性 */}
            <Line 
              type="monotone" 
              dataKey="信念松动度" 
              stroke="#8b5cf6" 
              strokeWidth={2.5}
              dot={{ fill: '#8b5cf6', r: 4 }}
              strokeOpacity={0.9}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Score Legend with Trend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="font-medium">综合</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>行为</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span>情绪</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span>信念</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

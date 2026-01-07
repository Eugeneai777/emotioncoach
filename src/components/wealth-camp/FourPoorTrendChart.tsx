import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fourPoorRichConfig, PoorTypeKey } from '@/config/fourPoorConfig';
import { useWealthJournalEntries } from '@/hooks/useWealthJournalEntries';

interface FourPoorTrendChartProps {
  campId?: string;
}

// Map behavior_type values to our keys
const behaviorTypeMapping: Record<string, PoorTypeKey> = {
  'mouth_poor': 'mouth',
  'hand_poor': 'hand',
  'eye_poor': 'eye',
  'heart_poor': 'heart',
  'vision_poor': 'eye',
  'action_poor': 'hand',
  'mouth': 'mouth',
  'hand': 'hand',
  'eye': 'eye',
  'heart': 'heart',
};

interface TrendDataPoint {
  day: string;
  dayNumber: number;
  嘴穷觉醒: number;
  手穷觉醒: number;
  眼穷觉醒: number;
  心穷觉醒: number;
}

export function FourPoorTrendChart({ campId }: FourPoorTrendChartProps) {
  const { entries, isLoading } = useWealthJournalEntries({ campId });

  const trendData = useMemo<TrendDataPoint[]>(() => {
    if (!entries || entries.length === 0) return [];

    // Group entries by day and calculate cumulative awareness depth for each type
    const dailyScores: Record<number, Record<PoorTypeKey, { sum: number; count: number }>> = {};

    entries.forEach(entry => {
      const dayNum = entry.day_number;
      if (!dailyScores[dayNum]) {
        dailyScores[dayNum] = {
          mouth: { sum: 0, count: 0 },
          hand: { sum: 0, count: 0 },
          eye: { sum: 0, count: 0 },
          heart: { sum: 0, count: 0 },
        };
      }

      const behaviorType = entry.behavior_type as string | null | undefined;
      if (behaviorType) {
        const mappedKey = behaviorTypeMapping[behaviorType];
        if (mappedKey) {
          dailyScores[dayNum][mappedKey].sum += entry.behavior_score ?? 3;
          dailyScores[dayNum][mappedKey].count += 1;
        }
      }
    });

    // Convert to chart data with cumulative transformation rate
    const cumulativeScores: Record<PoorTypeKey, { sum: number; count: number }> = {
      mouth: { sum: 0, count: 0 },
      hand: { sum: 0, count: 0 },
      eye: { sum: 0, count: 0 },
      heart: { sum: 0, count: 0 },
    };

    return Object.keys(dailyScores)
      .map(Number)
      .sort((a, b) => a - b)
      .map(dayNum => {
        const dayData = dailyScores[dayNum];
        
        // Accumulate scores
        (['mouth', 'hand', 'eye', 'heart'] as PoorTypeKey[]).forEach(key => {
          cumulativeScores[key].sum += dayData[key].sum;
          cumulativeScores[key].count += dayData[key].count;
        });

        // Calculate cumulative awakening rate for each type (avgDepth / 5 * 100)
        const getRate = (key: PoorTypeKey) => {
          if (cumulativeScores[key].count === 0) return 0;
          const avgDepth = cumulativeScores[key].sum / cumulativeScores[key].count;
          return Math.round((avgDepth / 5) * 100);
        };

        return {
          day: `D${dayNum}`,
          dayNumber: dayNum,
          嘴穷觉醒: getRate('mouth'),
          手穷觉醒: getRate('hand'),
          眼穷觉醒: getRate('eye'),
          心穷觉醒: getRate('heart'),
        };
      });
  }, [entries]);

  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
        加载中...
      </div>
    );
  }

  if (trendData.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
        完成教练梳理后展示趋势
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px'
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Legend 
            wrapperStyle={{ fontSize: '10px' }}
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="嘴穷觉醒"
            stroke={fourPoorRichConfig.mouth.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="手穷觉醒"
            stroke={fourPoorRichConfig.hand.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="眼穷觉醒"
            stroke={fourPoorRichConfig.eye.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="心穷觉醒"
            stroke={fourPoorRichConfig.heart.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

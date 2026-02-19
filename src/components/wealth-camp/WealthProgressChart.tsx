import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { blockScoreToAwakeningStars } from '@/config/wealthStyleConfig';

interface JournalEntry {
  day_number: number;
  behavior_score: number | null;
  emotion_score: number | null;
  belief_score: number | null;
  created_at: string;
}

interface BaselineData {
  behavior_score: number;
  emotion_score: number;
  belief_score: number;
}

interface WealthProgressChartProps {
  entries: JournalEntry[];
  embedded?: boolean;
  baseline?: BaselineData | null;
  baselineAwakening?: number; // 第 0 天整体觉醒指数 (0-100)
}

type DimensionKey = 'awakening' | 'behavior' | 'emotion' | 'belief';

const DIMENSION_CONFIG = {
  awakening: { label: '觉醒', color: '#f59e0b' },
  behavior: { label: '行为', color: '#d97706' },
  emotion: { label: '情绪', color: '#ec4899' },
  belief: { label: '信念', color: '#8b5cf6' },
};

// Convert 1-5 stars to 0-100 awakening index
const starsToAwakening = (stars: number): number =>
  Math.round(((stars - 1) / 4) * 100);

export function WealthProgressChart({ entries, embedded = false, baseline, baselineAwakening }: WealthProgressChartProps) {
  const [activeDimension, setActiveDimension] = useState<DimensionKey>('awakening');

  // Convert Day 0 assessment BLOCK scores (0-50, higher = more blocked)
  // to AWAKENING stars (1-5, higher = more awakened) using inverse conversion
  const baselineValues = useMemo(() => {
    if (!baseline) return null;
    return {
      behavior: blockScoreToAwakeningStars(baseline.behavior_score, 50),
      emotion: blockScoreToAwakeningStars(baseline.emotion_score, 50),
      belief: blockScoreToAwakeningStars(baseline.belief_score, 50),
    };
  }, [baseline]);

  const chartData = useMemo(() => {
    // 按 created_at 升序排列，依次分配序号 1, 2, 3…
    const sorted = [...entries].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const journalPoints = sorted.map((entry, index) => {
      const b = entry.behavior_score ?? 0;
      const em = entry.emotion_score ?? 0;
      const be = entry.belief_score ?? 0;
      const validScores = [b, em, be].filter(v => v > 0);
      const avg = validScores.length > 0 ? validScores.reduce((a, c) => a + c, 0) / validScores.length : 0;
      const awakening = avg > 0 ? starsToAwakening(avg) : 0;
      return {
        day: `第 ${index + 1} 天`,
        dayNum: index + 1,
        行为流动度: b,
        情绪流动度: em,
        信念松动度: be,
        觉醒指数: awakening,
        hasData: b > 0 || em > 0 || be > 0,
        isBaseline: false,
      };
    });

    // 第 0 天：测评基准点（isBaseline=true 用于特殊渲染）
    const day0BaselineAwakening = baselineAwakening ?? (baselineValues
      ? starsToAwakening((baselineValues.behavior + baselineValues.emotion + baselineValues.belief) / 3)
      : null);

    const day0 = (baselineValues || baselineAwakening !== undefined) ? {
      day: '第 0 天',
      dayNum: 0,
      行为流动度: baselineValues?.behavior ?? 0,
      情绪流动度: baselineValues?.emotion ?? 0,
      信念松动度: baselineValues?.belief ?? 0,
      觉醒指数: day0BaselineAwakening ?? 0,
      hasData: true,
      isBaseline: true,
    } : null;

    return day0 ? [day0, ...journalPoints] : journalPoints;
  }, [entries, baselineValues, baselineAwakening]);

  // Calculate dimension-specific stats
  const dimensionStats = useMemo(() => {
    if (chartData.length === 0) return null;

    // Exclude the Day 0 baseline point from stats (only journal entries)
    const dataWithValues = chartData.filter(d => d.hasData && !d.isBaseline);
    if (dataWithValues.length === 0) return null;

    const getStats = (key: '行为流动度' | '情绪流动度' | '信念松动度', baselineKey: 'behavior' | 'emotion' | 'belief') => {
      const values = dataWithValues.map(d => d[key] as number).filter(v => v > 0);
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const peak = values.length > 0 ? Math.max(...values) : 0;
      const peakDay = dataWithValues.find(d => d[key] === peak)?.dayNum || 0;
      const baselineVal = baselineValues?.[baselineKey] || 0;
      const vsBaseline = avg - baselineVal;
      const daysAboveBaseline = baselineValues
        ? dataWithValues.filter(d => (d[key] as number) > baselineVal).length
        : 0;
      return { avg, peak, peakDay, vsBaseline, daysAboveBaseline, totalDays: dataWithValues.length };
    };

    // Awakening stats
    const awakeningValues = dataWithValues.map(d => d['觉醒指数'] as number).filter(v => v > 0);
    const awakeningStart = chartData.find(d => d.isBaseline)?.['觉醒指数'] as number | undefined;
    const awakeningCurrent = awakeningValues.length > 0 ? awakeningValues[awakeningValues.length - 1] : 0;
    const awakeningPeak = awakeningValues.length > 0 ? Math.max(...awakeningValues) : 0;
    const awakeningPeakDay = dataWithValues.find(d => d['觉醒指数'] === awakeningPeak)?.dayNum || 0;
    const awakeningGrowth = awakeningStart !== undefined ? awakeningCurrent - awakeningStart : 0;

    return {
      awakening: {
        start: awakeningStart ?? 0,
        current: awakeningCurrent,
        peak: awakeningPeak,
        peakDay: awakeningPeakDay,
        growth: awakeningGrowth,
        totalDays: dataWithValues.length,
      },
      behavior: getStats('行为流动度', 'behavior'),
      emotion: getStats('情绪流动度', 'emotion'),
      belief: getStats('信念松动度', 'belief'),
    };
  }, [chartData, baselineValues]);

  const hasJournalEntries = entries.length > 0;
  const hasChartData = chartData.length > 0;

  if (!hasChartData && !baselineValues && baselineAwakening === undefined) {
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

  const showAwakening = activeDimension === 'awakening';
  const showBehavior = activeDimension === 'behavior';
  const showEmotion = activeDimension === 'emotion';
  const showBelief = activeDimension === 'belief';

  // Y-axis config
  const yAxisDomain = showAwakening ? [0, 100] : [0, 5];
  const yAxisTicks = showAwakening ? [0, 20, 40, 60, 80, 100] : [1, 2, 3, 4, 5];

  // Custom dot renderer
  const renderDot = (
    props: any,
    dimensionKey: '行为流动度' | '情绪流动度' | '信念松动度' | '觉醒指数',
    baselineVal: number | undefined,
    color: string,
    prefix: string,
  ) => {
    const { cx, cy, payload } = props;

    if (payload.isBaseline) {
      return (
        <circle
          key={`${prefix}-baseline`}
          cx={cx} cy={cy} r={8}
          fill="#6b7280"
          stroke="#4b5563"
          strokeWidth={2}
        />
      );
    }

    if (!payload.hasData) {
      return (
        <circle
          key={`${prefix}-${payload.dayNum}`}
          cx={cx} cy={cy} r={4}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={2}
          strokeDasharray="3 2"
        />
      );
    }

    const isBreakthrough = baselineVal !== undefined && (payload[dimensionKey] as number) > baselineVal;
    return (
      <circle
        key={`${prefix}-${payload.dayNum}`}
        cx={cx} cy={cy}
        r={isBreakthrough ? 7 : 5}
        fill={isBreakthrough ? '#10b981' : color}
        stroke={isBreakthrough ? '#059669' : 'none'}
        strokeWidth={isBreakthrough ? 2 : 0}
      />
    );
  };

  const awakeningStats = dimensionStats?.awakening;

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
          <ToggleGroupItem value="awakening" className="text-xs px-3 data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700 font-medium">
            ✨ 觉醒
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

      {/* Stats panel */}
      {showAwakening && awakeningStats ? (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-lg p-2 mb-3 border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">起点:</span>
              <span className="font-semibold text-slate-500">{awakeningStats.start}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">当前:</span>
              <span className="font-semibold text-amber-600">{awakeningStats.current}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">成长:</span>
              <span className={`font-semibold ${awakeningStats.growth >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {awakeningStats.growth >= 0 ? '+' : ''}{awakeningStats.growth}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">⭐ 峰值:</span>
              <span className="font-semibold text-amber-600">{awakeningStats.peak}</span>
              <span className="text-muted-foreground text-[10px]">(第 {awakeningStats.peakDay} 天)</span>
            </div>
          </div>
        </div>
      ) : dimensionStats && !showAwakening ? (
        <div className="bg-muted/30 rounded-lg p-2 mb-3">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            {baselineValues && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">vs 基准:</span>
                <span className={`font-semibold ${dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].vsBaseline >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].vsBaseline >= 0 ? '+' : ''}
                  {dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].vsBaseline.toFixed(1)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">⭐ 峰值:</span>
              <span className="font-semibold" style={{ color: DIMENSION_CONFIG[activeDimension].color }}>
                {dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].peak.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-[10px]">
                (第 {dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].peakDay} 天)
              </span>
            </div>
            {baselineValues && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">🎯 突破天数:</span>
                <span className="font-semibold text-emerald-600">
                  {dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].daysAboveBaseline}/{dimensionStats[activeDimension as 'behavior' | 'emotion' | 'belief'].totalDays}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : null}

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
            domain={yAxisDomain}
            ticks={yAxisTicks}
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
            formatter={(value: number, name: string) => [
              showAwakening ? `${value} 分` : value.toFixed(1),
              name,
            ]}
            labelFormatter={(label) => label === '第 0 天' ? '第 0 天（测评基准）' : label}
          />
          {!embedded && <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />}

          {/* 觉醒指数 */}
          {showAwakening && (
            <Line
              type="monotone"
              dataKey="觉醒指数"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={(props: any) => renderDot(props, '觉醒指数', chartData.find(d => d.isBaseline)?.['觉醒指数'] as number | undefined, '#f59e0b', 'awakening')}
            />
          )}

          {/* 行为层 */}
          {showBehavior && (
            <Line
              type="monotone"
              dataKey="行为流动度"
              stroke="#d97706"
              strokeWidth={3}
              dot={(props: any) => renderDot(props, '行为流动度', baselineValues?.behavior, '#d97706', 'behavior')}
            />
          )}

          {/* 情绪层 */}
          {showEmotion && (
            <Line
              type="monotone"
              dataKey="情绪流动度"
              stroke="#ec4899"
              strokeWidth={3}
              dot={(props: any) => renderDot(props, '情绪流动度', baselineValues?.emotion, '#ec4899', 'emotion')}
            />
          )}

          {/* 信念层 */}
          {showBelief && (
            <Line
              type="monotone"
              dataKey="信念松动度"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={(props: any) => renderDot(props, '信念松动度', baselineValues?.belief, '#8b5cf6', 'belief')}
            />
          )}

          {/* 基准虚线辅助线 */}
          {baselineValues && showBehavior && hasJournalEntries && (
            <ReferenceLine y={baselineValues.behavior} stroke="#9ca3af" strokeDasharray="4 6" strokeWidth={1} strokeOpacity={0.5} />
          )}
          {baselineValues && showEmotion && hasJournalEntries && (
            <ReferenceLine y={baselineValues.emotion} stroke="#9ca3af" strokeDasharray="4 6" strokeWidth={1} strokeOpacity={0.5} />
          )}
          {baselineValues && showBelief && hasJournalEntries && (
            <ReferenceLine y={baselineValues.belief} stroke="#9ca3af" strokeDasharray="4 6" strokeWidth={1} strokeOpacity={0.5} />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Motivational message for awakening dimension */}
      {showAwakening && awakeningStats && awakeningStats.growth !== 0 && (() => {
        const g = awakeningStats.growth;
        const start = awakeningStats.start;
        const current = awakeningStats.current;
        const peak = awakeningStats.peak;
        let msg = '';
        if (g >= 30) {
          msg = `🌟 太惊人了！你已突破起点 ${g} 分，财富意识彻底觉醒！`;
        } else if (g >= 20) {
          msg = `🚀 你已突破起点 ${g} 分，正以飞速蜕变中，继续前进！`;
        } else if (g >= 10) {
          msg = `💪 你已突破起点 ${g} 分，每一天都在成长，加油！`;
        } else if (g > 0) {
          msg = `✨ 你已突破起点 ${g} 分，种子已种下，继续浇灌！`;
        } else {
          // g < 0
          msg = `🌱 起点 ${start}，当前 ${current}，每次梳理都是积累，坚持就是胜利！`;
        }
        return (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-center text-xs text-amber-700 font-medium">
            {msg}
          </div>
        );
      })()}

      {/* Score Legend */}
      {embedded && (
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6b7280]" />
            <span>第 0 天起点</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>突破基准</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DIMENSION_CONFIG[activeDimension].color }} />
            <span>常规</span>
          </div>
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

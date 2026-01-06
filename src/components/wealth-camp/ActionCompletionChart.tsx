import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ActionEntry {
  id: string;
  day_number: number;
  giving_action?: string | null;
  action_completed_at?: string | null;
  action_reflection?: string | null;
  action_difficulty?: number | null;
  created_at: string;
}

interface ActionCompletionChartProps {
  entries: ActionEntry[];
}

export function ActionCompletionChart({ entries }: ActionCompletionChartProps) {
  const { chartData, pieData, stats } = useMemo(() => {
    const actionsWithGiving = entries.filter(e => e.giving_action);
    const completedActions = actionsWithGiving.filter(e => e.action_completed_at);
    
    // Calculate cumulative completion rate by day
    const sortedEntries = [...actionsWithGiving].sort((a, b) => a.day_number - b.day_number);
    let cumulativeTotal = 0;
    let cumulativeCompleted = 0;
    
    const dayData = sortedEntries.map(entry => {
      cumulativeTotal += 1;
      if (entry.action_completed_at) {
        cumulativeCompleted += 1;
      }
      
      return {
        day: `第${entry.day_number}天`,
        dayNumber: entry.day_number,
        rate: Math.round((cumulativeCompleted / cumulativeTotal) * 100),
        completed: cumulativeCompleted,
        total: cumulativeTotal,
        hasAction: entry.action_completed_at ? 1 : 0,
      };
    });

    const completionRate = actionsWithGiving.length > 0 
      ? Math.round((completedActions.length / actionsWithGiving.length) * 100)
      : 0;

    const pie = [
      { name: '已完成', value: completedActions.length, color: 'hsl(var(--chart-2))' },
      { name: '待完成', value: actionsWithGiving.length - completedActions.length, color: 'hsl(var(--muted))' },
    ];

    return {
      chartData: dayData,
      pieData: pie,
      stats: {
        total: actionsWithGiving.length,
        completed: completedActions.length,
        pending: actionsWithGiving.length - completedActions.length,
        completionRate,
      }
    };
  }, [entries]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
          <Gift className="w-5 h-5" />
          行动完成率趋势
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pie Chart Overview */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.completionRate}%
              </span>
              <span className="text-sm text-muted-foreground">完成率</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-muted-foreground">已完成 {stats.completed}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted"></span>
                <span className="text-muted-foreground">待完成 {stats.pending}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Cumulative Completion Rate Chart */}
        {chartData.length > 1 && (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actionRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background/95 backdrop-blur border rounded-lg p-2 shadow-lg text-xs">
                        <p className="font-medium">{data.day}</p>
                        <p className="text-emerald-600">完成率: {data.rate}%</p>
                        <p className="text-muted-foreground">累计: {data.completed}/{data.total}</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine 
                  y={80} 
                  stroke="hsl(var(--chart-4))" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  fill="url(#actionRateGradient)"
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--chart-2))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Motivational Message */}
        {stats.completionRate >= 80 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-100/70 dark:bg-emerald-900/30 rounded-lg">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              太棒了！你的行动力非常强，继续保持！
            </span>
          </div>
        )}
        {stats.completionRate >= 50 && stats.completionRate < 80 && (
          <div className="flex items-center gap-2 p-3 bg-amber-100/70 dark:bg-amber-900/30 rounded-lg">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-300">
              你正在稳步前进，每一次行动都是觉醒的体现
            </span>
          </div>
        )}
        {stats.completionRate > 0 && stats.completionRate < 50 && (
          <div className="flex items-center gap-2 p-3 bg-rose-100/70 dark:bg-rose-900/30 rounded-lg">
            <Gift className="w-4 h-4 text-rose-600" />
            <span className="text-sm text-rose-700 dark:text-rose-300">
              小小的给予行动，能带来意想不到的内心富足
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

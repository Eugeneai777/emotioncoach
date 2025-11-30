import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ParentSession {
  id: string;
  created_at: string;
  briefing?: {
    emotion_intensity: number | null;
  };
}

interface ParentCycleAnalysisProps {
  sessions: ParentSession[];
}

export const ParentCycleAnalysis = ({ sessions }: ParentCycleAnalysisProps) => {
  // 按周统计
  const weeklyData = sessions.reduce((acc, session) => {
    const date = new Date(session.created_at);
    const weekNum = Math.floor((date.getDate() - 1) / 7) + 1;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const key = `${monthKey} 第${weekNum}周`;
    
    if (!acc[key]) {
      acc[key] = {
        week: key,
        count: 0,
        totalIntensity: 0,
        validIntensityCount: 0
      };
    }
    
    acc[key].count++;
    if (session.briefing?.emotion_intensity) {
      acc[key].totalIntensity += session.briefing.emotion_intensity;
      acc[key].validIntensityCount++;
    }
    
    return acc;
  }, {} as Record<string, { week: string; count: number; totalIntensity: number; validIntensityCount: number }>);

  const chartData = Object.values(weeklyData)
    .map(item => ({
      week: item.week,
      对话次数: item.count,
      平均强度: item.validIntensityCount > 0 ? (item.totalIntensity / item.validIntensityCount).toFixed(1) : 0
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8); // 最近8周

  // 按月统计
  const monthlyData = sessions.reduce((acc, session) => {
    const date = new Date(session.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        count: 0,
        totalIntensity: 0,
        validIntensityCount: 0
      };
    }
    
    acc[monthKey].count++;
    if (session.briefing?.emotion_intensity) {
      acc[monthKey].totalIntensity += session.briefing.emotion_intensity;
      acc[monthKey].validIntensityCount++;
    }
    
    return acc;
  }, {} as Record<string, { month: string; count: number; totalIntensity: number; validIntensityCount: number }>);

  const monthlyChartData = Object.values(monthlyData)
    .map(item => ({
      month: item.month,
      对话次数: item.count,
      平均强度: item.validIntensityCount > 0 ? (item.totalIntensity / item.validIntensityCount).toFixed(1) : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // 最近6个月

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📊 每周趋势分析
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="对话次数" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="平均强度" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">暂无周趋势数据</p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📈 每月趋势分析
        </h3>
        {monthlyChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="对话次数" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="平均强度" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">暂无月趋势数据</p>
        )}
      </Card>
    </div>
  );
};
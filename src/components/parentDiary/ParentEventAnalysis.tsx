import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ParentSession {
  id: string;
  event_description: string | null;
  created_at: string;
}

interface ParentEventAnalysisProps {
  sessions: ParentSession[];
}

export const ParentEventAnalysis = ({ sessions }: ParentEventAnalysisProps) => {
  // 分析事件类型分布（基于关键词）
  const eventTypes = {
    "作业": 0,
    "刷牙": 0,
    "吃饭": 0,
    "睡觉": 0,
    "玩手机": 0,
    "其他": 0
  };

  sessions.forEach(session => {
    const desc = session.event_description?.toLowerCase() || "";
    if (desc.includes("作业") || desc.includes("学习")) {
      eventTypes["作业"]++;
    } else if (desc.includes("刷牙")) {
      eventTypes["刷牙"]++;
    } else if (desc.includes("吃饭") || desc.includes("饭")) {
      eventTypes["吃饭"]++;
    } else if (desc.includes("睡觉") || desc.includes("睡")) {
      eventTypes["睡觉"]++;
    } else if (desc.includes("手机") || desc.includes("游戏") || desc.includes("电视")) {
      eventTypes["玩手机"]++;
    } else {
      eventTypes["其他"]++;
    }
  });

  const eventData = Object.entries(eventTypes)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  // 时间段分布
  const timeDistribution = {
    "早晨": 0,
    "上午": 0,
    "下午": 0,
    "晚上": 0
  };

  sessions.forEach(session => {
    const hour = new Date(session.created_at).getHours();
    if (hour >= 6 && hour < 9) {
      timeDistribution["早晨"]++;
    } else if (hour >= 9 && hour < 12) {
      timeDistribution["上午"]++;
    } else if (hour >= 12 && hour < 18) {
      timeDistribution["下午"]++;
    } else {
      timeDistribution["晚上"]++;
    }
  });

  const timeData = Object.entries(timeDistribution)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#a78bfa', '#f472b6'];

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">事件类型分布</h3>
        {eventData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">时间段分布</h3>
        {timeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">数据概览</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{sessions.length}</p>
            <p className="text-sm text-muted-foreground mt-1">对话总数</p>
          </div>
          <div className="bg-secondary/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-secondary-foreground">{eventData.length}</p>
            <p className="text-sm text-muted-foreground mt-1">事件类型</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

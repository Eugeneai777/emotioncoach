import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";

interface TrendData {
  date: string;
  count: number;
  avgDifficulty: number;
}

interface ScenarioData {
  name: string;
  value: number;
}

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export function CommunicationTrendAnalysis() {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [scenarioData, setScenarioData] = useState<ScenarioData[]>([]);
  const [tagData, setTagData] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const { data: briefings, error } = await supabase
      .from("communication_briefings")
      .select(`
        created_at,
        communication_difficulty,
        scenario_type,
        difficulty_keywords,
        conversations!inner(user_id)
      `)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading trend data:", error);
      return;
    }

    // 趋势数据
    const grouped = briefings?.reduce((acc, item) => {
      const date = format(new Date(item.created_at), "MM/dd");
      if (!acc[date]) {
        acc[date] = { count: 0, totalDifficulty: 0 };
      }
      acc[date].count++;
      acc[date].totalDifficulty += item.communication_difficulty || 0;
      return acc;
    }, {} as Record<string, { count: number; totalDifficulty: number }>);

    const trend: TrendData[] = Object.entries(grouped || {}).map(([date, stats]) => ({
      date,
      count: stats.count,
      avgDifficulty: stats.count > 0 ? Math.round(stats.totalDifficulty / stats.count) : 0,
    }));

    setTrendData(trend);

    // 场景分布
    const scenarioCount = briefings?.reduce((acc, item) => {
      const scenario = item.scenario_type || "other";
      acc[scenario] = (acc[scenario] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const scenarioLabels: Record<string, string> = {
      family: "家庭",
      work: "职场",
      social: "社交",
      romantic: "恋爱",
      other: "其他",
    };

    const scenarios: ScenarioData[] = Object.entries(scenarioCount || {}).map(
      ([key, value]) => ({
        name: scenarioLabels[key] || key,
        value,
      })
    );

    setScenarioData(scenarios);

    // 难点关键词统计
    const keywordCount: Record<string, number> = {};
    briefings?.forEach((item) => {
      item.difficulty_keywords?.forEach((keyword: string) => {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      });
    });

    const tags = Object.entries(keywordCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setTagData(tags);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>沟通频率趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8B5CF6" name="沟通次数" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>沟通难度变化</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgDifficulty"
                stroke="#EF4444"
                name="平均难度"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>场景类型分布</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scenarioData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {scenarioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>常见难点关键词</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {tagData.map((tag, idx) => {
              const size = Math.max(14, Math.min(32, 14 + tag.count * 2));
              return (
                <span
                  key={idx}
                  className="px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                  style={{ fontSize: `${size}px` }}
                >
                  {tag.name}
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({tag.count})
                  </span>
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
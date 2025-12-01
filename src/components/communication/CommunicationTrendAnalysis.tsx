import { useMemo, useState, useEffect } from "react";
import { format, getDay, getHours, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { zhCN } from "date-fns/locale";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  LineChart, Line, Legend 
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommunicationBriefing {
  id: string;
  communication_theme: string;
  created_at: string;
  communication_difficulty?: number;
  scenario_type?: string;
  difficulty_keywords?: string[];
}

const SCENARIO_TYPES = {
  family: "家庭沟通",
  work: "职场沟通",
  social: "社交沟通",
  romantic: "恋爱沟通",
  other: "其他沟通",
};

export const CommunicationTrendAnalysis = () => {
  const [briefings, setBriefings] = useState<CommunicationBriefing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBriefings();
  }, []);

  const loadBriefings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("communication_briefings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setBriefings(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // 星期分布数据
  const weekdayData = useMemo(() => {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const counts = Array(7).fill(0);
    briefings.forEach((b) => {
      const day = getDay(new Date(b.created_at));
      counts[day] += 1;
    });
    return weekdays.map((name, index) => ({ name, count: counts[index] }));
  }, [briefings]);

  // 时段分布数据
  const timePatternData = useMemo(() => {
    const periods = [
      { name: "深夜 (0-5)", start: 0, end: 5, count: 0 },
      { name: "早晨 (6-11)", start: 6, end: 11, count: 0 },
      { name: "下午 (12-17)", start: 12, end: 17, count: 0 },
      { name: "晚上 (18-23)", start: 18, end: 23, count: 0 },
    ];

    briefings.forEach((b) => {
      const hour = getHours(new Date(b.created_at));
      const period = periods.find((p) => hour >= p.start && hour <= p.end);
      if (period) period.count += 1;
    });

    return periods.map(({ name, count }) => ({ name, count }));
  }, [briefings]);

  // 场景类型分布
  const scenarioDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      family: 0,
      work: 0,
      social: 0,
      romantic: 0,
      other: 0,
    };

    briefings.forEach((b) => {
      const type = b.scenario_type || "other";
      if (type in distribution) {
        distribution[type] += 1;
      }
    });

    const total = briefings.length || 1;
    return Object.entries(distribution).map(([key, count]) => ({
      category: SCENARIO_TYPES[key as keyof typeof SCENARIO_TYPES],
      value: Math.round((count / total) * 100),
      count,
    }));
  }, [briefings]);

  // 沟通难度趋势数据（最近14条）
  const difficultyTrendData = useMemo(() => {
    return briefings
      .slice(0, 14)
      .reverse()
      .map((b, index) => ({
        name: format(new Date(b.created_at), "MM/dd", { locale: zhCN }),
        difficulty: b.communication_difficulty || 0,
        date: b.created_at,
      }));
  }, [briefings]);

  // 沟通难度统计
  const difficultyStats = useMemo(() => {
    const difficulties = briefings
      .map((b) => b.communication_difficulty)
      .filter((d): d is number => d != null);

    if (difficulties.length === 0) {
      return { avg: 0, max: 0, min: 0, trend: "stable" as const };
    }

    const avg = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
    const max = Math.max(...difficulties);
    const min = Math.min(...difficulties);

    // 计算趋势（最近7条 vs 之前7条）
    const recent = difficulties.slice(0, 7);
    const previous = difficulties.slice(7, 14);

    let trend: "up" | "down" | "stable" = "stable";
    if (recent.length > 0 && previous.length > 0) {
      const recentAvg = recent.reduce((sum, d) => sum + d, 0) / recent.length;
      const previousAvg = previous.reduce((sum, d) => sum + d, 0) / previous.length;
      
      if (recentAvg > previousAvg + 0.5) trend = "up";
      else if (recentAvg < previousAvg - 0.5) trend = "down";
    }

    return { avg, max, min, trend };
  }, [briefings]);

  // 周期洞察
  const insights = useMemo(() => {
    const insights: { type: "peak" | "valley" | "pattern"; text: string }[] = [];

    if (briefings.length === 0) return insights;

    // 沟通难度趋势洞察
    if (difficultyStats.trend === "up") {
      insights.push({
        type: "peak",
        text: `近期沟通难度呈上升趋势，平均难度${difficultyStats.avg.toFixed(1)}分`,
      });
    } else if (difficultyStats.trend === "down") {
      insights.push({
        type: "valley",
        text: `近期沟通难度呈下降趋势，平均难度${difficultyStats.avg.toFixed(1)}分`,
      });
    }

    // 星期高峰分析
    const maxWeekdayCount = Math.max(...weekdayData.map((d) => d.count));
    const peakWeekdays = weekdayData.filter((d) => d.count === maxWeekdayCount && d.count > 0);
    if (peakWeekdays.length > 0) {
      insights.push({
        type: "peak",
        text: `${peakWeekdays.map((d) => d.name).join("、")}是沟通记录的高峰期`,
      });
    }

    // 时段偏好分析
    const maxTimeCount = Math.max(...timePatternData.map((d) => d.count));
    const peakTimes = timePatternData.filter((d) => d.count === maxTimeCount && d.count > 0);
    if (peakTimes.length > 0) {
      insights.push({
        type: "pattern",
        text: `${peakTimes.map((d) => d.name).join("、")}是最常进行沟通的时段`,
      });
    }

    // 场景类型分析
    const maxScenario = scenarioDistribution.reduce((max, current) =>
      current.count > max.count ? current : max
    );
    if (maxScenario.count > 0) {
      insights.push({
        type: "pattern",
        text: `${maxScenario.category}占比最高（${maxScenario.value}%）`,
      });
    }

    // 工作日 vs 周末分析
    const weekdayCount = briefings.filter((b) => {
      const day = getDay(new Date(b.created_at));
      return day >= 1 && day <= 5;
    }).length;
    const weekendCount = briefings.length - weekdayCount;

    if (weekendCount > weekdayCount * 1.5) {
      insights.push({
        type: "pattern",
        text: "周末沟通记录明显多于工作日",
      });
    } else if (weekdayCount > weekendCount * 1.5) {
      insights.push({
        type: "pattern",
        text: "工作日沟通记录明显多于周末",
      });
    }

    return insights;
  }, [briefings, weekdayData, timePatternData, scenarioDistribution, difficultyStats]);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return "hsl(142, 76%, 36%)";
    if (difficulty <= 6) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  const getDifficultyBgColor = (difficulty: number) => {
    if (difficulty <= 3) return "bg-green-50 dark:bg-green-950";
    if (difficulty <= 6) return "bg-orange-50 dark:bg-orange-950";
    return "bg-red-50 dark:bg-red-950";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (briefings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">还没有足够的数据进行趋势分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 周期洞察 */}
      {insights.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🔍 周期洞察
          </h3>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                {insight.type === "peak" && (
                  <TrendingUp className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                {insight.type === "valley" && (
                  <TrendingDown className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                {insight.type === "pattern" && (
                  <Minus className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{insight.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 沟通难度趋势 */}
      {difficultyTrendData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📊 沟通难度趋势</h3>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${getDifficultyBgColor(difficultyStats.avg)}`}>
              <div className="text-sm text-muted-foreground mb-1">平均难度</div>
              <div className="text-2xl font-bold" style={{ color: getDifficultyColor(difficultyStats.avg) }}>
                {difficultyStats.avg.toFixed(1)}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${getDifficultyBgColor(difficultyStats.max)}`}>
              <div className="text-sm text-muted-foreground mb-1">最高难度</div>
              <div className="text-2xl font-bold" style={{ color: getDifficultyColor(difficultyStats.max) }}>
                {difficultyStats.max.toFixed(1)}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${getDifficultyBgColor(difficultyStats.min)}`}>
              <div className="text-sm text-muted-foreground mb-1">最低难度</div>
              <div className="text-2xl font-bold" style={{ color: getDifficultyColor(difficultyStats.min) }}>
                {difficultyStats.min.toFixed(1)}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={difficultyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 10]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const difficulty = payload[0].value as number;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">{payload[0].payload.name}</p>
                        <p className="text-sm" style={{ color: getDifficultyColor(difficulty) }}>
                          难度: {difficulty.toFixed(1)}分
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="difficulty"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={getDifficultyColor(payload.difficulty)}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* 颜色图例 */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>轻松 (1-3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>中等 (4-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>困难 (7-10)</span>
            </div>
          </div>
        </Card>
      )}

      {/* 星期分布 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📅 星期分布</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekdayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 时段偏好 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">⏰ 时段偏好</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={timePatternData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Radar
              name="沟通次数"
              dataKey="count"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* 场景类型分布 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🎯 场景类型分布</h3>
        <div className="space-y-4">
          {scenarioDistribution.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.category}</span>
                  <Badge variant="secondary">{item.count}次</Badge>
                </div>
                <span className="text-muted-foreground">{item.value}%</span>
              </div>
              <Progress value={item.value} className="h-2" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

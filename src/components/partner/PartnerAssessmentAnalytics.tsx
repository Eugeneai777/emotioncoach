import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, Users, TrendingUp, Target } from "lucide-react";
import { usePartnerAssessmentAnalytics, type AssessmentAnalytics } from "@/hooks/usePartnerAssessmentAnalytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

interface Props {
  partnerId: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
];

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateAnalyticsCard({ data }: { data: AssessmentAnalytics }) {
  const radarData = Object.entries(data.dimensionAverages).map(([key, val]) => ({
    dimension: key,
    score: Math.round(val * 10) / 10,
  }));

  const pieData = Object.entries(data.patternDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-xl">{data.emoji}</span>
          {data.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Users} label="参与人数" value={data.uniqueUsers} />
          <StatCard icon={BarChart3} label="完成次数" value={data.totalResults} />
          <StatCard icon={TrendingUp} label="平均分" value={data.avgScore} sub={`满分 ${data.maxScore}`} />
          <StatCard icon={Target} label="分数区间" value={`${data.minScore}-${data.maxActualScore}`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Score distribution bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">分数分布</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="人数" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Dimension radar chart */}
          {radarData.length >= 3 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">维度平均分</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fontSize: 9 }} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Pattern distribution pie */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">类型分布</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Daily trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">近30天趋势</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => `日期: ${v}`} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="完成数" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

export function PartnerAssessmentAnalytics({ partnerId }: Props) {
  const { data: analytics, isLoading } = usePartnerAssessmentAnalytics(partnerId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics || analytics.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h4 className="font-medium text-muted-foreground mb-2">暂无测评数据</h4>
          <p className="text-sm text-muted-foreground">创建测评并分享给用户后，这里将展示数据分析</p>
        </CardContent>
      </Card>
    );
  }

  // Aggregate stats
  const totalUsers = analytics.reduce((s, a) => s + a.uniqueUsers, 0);
  const totalCompletions = analytics.reduce((s, a) => s + a.totalResults, 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          测评数据分析
        </h3>
        <p className="text-sm text-muted-foreground">
          累计 {totalUsers} 人参与，共 {totalCompletions} 次完成
        </p>
      </div>

      {analytics.map((a) => (
        <TemplateAnalyticsCard key={a.templateId} data={a} />
      ))}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { SCL90HistoryRecord } from "./SCL90History";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scl90FactorInfo } from "./scl90Data";

interface SCL90TrendProps {
  records: SCL90HistoryRecord[];
}

export function SCL90Trend({ records }: SCL90TrendProps) {
  if (records.length < 2) {
    return null;
  }

  // 准备图表数据（按时间正序）
  const chartData = [...records].reverse().map(record => ({
    date: format(new Date(record.created_at), "MM/dd", { locale: zhCN }),
    gsi: record.gsi,
    positiveCount: record.positive_count,
    somatization: record.somatization_score,
    obsessive: record.obsessive_score,
    interpersonal: record.interpersonal_score,
    depression: record.depression_score,
    anxiety: record.anxiety_score,
    hostility: record.hostility_score,
    phobic: record.phobic_score,
    paranoid: record.paranoid_score,
    psychoticism: record.psychoticism_score,
  }));

  // 计算趋势
  const latest = records[0];
  const first = records[records.length - 1];
  const gsiDiff = latest.gsi - first.gsi;

  const getTrendInfo = () => {
    if (gsiDiff < -0.5) {
      return { 
        icon: TrendingDown, 
        text: "明显改善", 
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
        description: `相比首次测评，你的 GSI 指数降低了 ${Math.abs(gsiDiff).toFixed(2)}，心理健康状况有显著改善！`
      };
    } else if (gsiDiff < 0) {
      return { 
        icon: TrendingDown, 
        text: "有所改善", 
        color: "text-teal-600",
        bgColor: "bg-teal-100",
        description: `相比首次测评，你的 GSI 指数降低了 ${Math.abs(gsiDiff).toFixed(2)}，继续保持积极的生活方式！`
      };
    } else if (gsiDiff > 0.5) {
      return { 
        icon: TrendingUp, 
        text: "需要关注", 
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        description: `相比首次测评，你的 GSI 指数上升了 ${gsiDiff.toFixed(2)}，建议关注近期的心理状态变化。`
      };
    } else if (gsiDiff > 0) {
      return { 
        icon: TrendingUp, 
        text: "略有波动", 
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        description: `相比首次测评，你的 GSI 指数上升了 ${gsiDiff.toFixed(2)}，这可能是暂时的波动，保持觉察即可。`
      };
    } else {
      return { 
        icon: Minus, 
        text: "保持稳定", 
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        description: "你的心理健康状况保持稳定，继续保持积极的生活方式。"
      };
    }
  };

  const trend = getTrendInfo();
  const TrendIcon = trend.icon;

  // 核心因子（排除other）用于趋势图
  const coreFactors = [
    { key: 'depression', name: '抑郁', color: '#3B82F6' },
    { key: 'anxiety', name: '焦虑', color: '#F59E0B' },
    { key: 'somatization', name: '躯体化', color: '#EF4444' },
    { key: 'obsessive', name: '强迫', color: '#8B5CF6' },
    { key: 'interpersonal', name: '人际敏感', color: '#EC4899' },
  ];

  const secondaryFactors = [
    { key: 'hostility', name: '敌对', color: '#DC2626' },
    { key: 'phobic', name: '恐怖', color: '#7C3AED' },
    { key: 'paranoid', name: '偏执', color: '#0891B2' },
    { key: 'psychoticism', name: '精神病性', color: '#64748B' },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          趋势分析
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 趋势指示器 */}
        <div className={cn("flex items-start gap-3 p-3 rounded-lg", trend.bgColor)}>
          <div className={cn("p-2 rounded-full bg-white", trend.color)}>
            <TrendIcon className="w-4 h-4" />
          </div>
          <div>
            <p className={cn("font-medium", trend.color)}>{trend.text}</p>
            <p className="text-sm text-muted-foreground mt-1">{trend.description}</p>
          </div>
        </div>

        {/* GSI 趋势面积图 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">GSI 指数变化趋势</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gsiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 5]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value}`, "GSI"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="gsi" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fill="url(#gsiGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 分层趋势切换 */}
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="core" className="text-xs gap-1">
              <Activity className="w-3 h-3" />
              核心因子
            </TabsTrigger>
            <TabsTrigger value="secondary" className="text-xs gap-1">
              <Activity className="w-3 h-3" />
              其他因子
            </TabsTrigger>
          </TabsList>

          {/* 核心因子趋势图 */}
          <TabsContent value="core" className="mt-3">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 5]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  {coreFactors.map(factor => (
                    <Line 
                      key={factor.key}
                      type="monotone" 
                      dataKey={factor.key} 
                      stroke={factor.color} 
                      strokeWidth={2}
                      dot={{ fill: factor.color, r: 3 }}
                      name={factor.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              {coreFactors.map(factor => (
                <div key={factor.key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: factor.color }} />
                  <span className="text-xs text-muted-foreground">{factor.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 其他因子趋势图 */}
          <TabsContent value="secondary" className="mt-3">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 5]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  {secondaryFactors.map(factor => (
                    <Line 
                      key={factor.key}
                      type="monotone" 
                      dataKey={factor.key} 
                      stroke={factor.color} 
                      strokeWidth={2}
                      dot={{ fill: factor.color, r: 3 }}
                      name={factor.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              {secondaryFactors.map(factor => (
                <div key={factor.key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: factor.color }} />
                  <span className="text-xs text-muted-foreground">{factor.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

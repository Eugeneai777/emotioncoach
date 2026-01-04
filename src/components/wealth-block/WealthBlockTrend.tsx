import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Layers, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart } from "recharts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { HistoryRecord } from "./WealthBlockHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WealthBlockTrendProps {
  records: HistoryRecord[];
}

export function WealthBlockTrend({ records }: WealthBlockTrendProps) {
  if (records.length < 2) {
    return null;
  }

  // 准备图表数据（按时间正序）
  const chartData = [...records].reverse().map(record => ({
    date: format(new Date(record.created_at), "MM/dd", { locale: zhCN }),
    behavior: record.behavior_score,
    emotion: record.emotion_score,
    belief: record.belief_score,
    total: record.behavior_score + record.emotion_score + record.belief_score,
    mouth: record.mouth_score || 0,
    hand: record.hand_score || 0,
    eye: record.eye_score || 0,
    heart: record.heart_score || 0,
  }));

  // 计算趋势
  const latest = records[0];
  const first = records[records.length - 1];
  const latestTotal = latest.behavior_score + latest.emotion_score + latest.belief_score;
  const firstTotal = first.behavior_score + first.emotion_score + first.belief_score;
  const diff = latestTotal - firstTotal;

  const getTrendInfo = () => {
    if (diff < -10) {
      return { 
        icon: TrendingDown, 
        text: "明显改善", 
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
        description: `相比首次测评，你的财富卡点总分降低了 ${Math.abs(diff)} 分，说明你在突破财富障碍方面取得了显著进步！`
      };
    } else if (diff < 0) {
      return { 
        icon: TrendingDown, 
        text: "有所改善", 
        color: "text-teal-600",
        bgColor: "bg-teal-100",
        description: `相比首次测评，你的财富卡点总分降低了 ${Math.abs(diff)} 分，继续保持，你正在正确的道路上！`
      };
    } else if (diff > 10) {
      return { 
        icon: TrendingUp, 
        text: "需要关注", 
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        description: `相比首次测评，你的财富卡点总分增加了 ${diff} 分，建议关注近期的财富相关经历，可能有新的卡点浮现。`
      };
    } else if (diff > 0) {
      return { 
        icon: TrendingUp, 
        text: "略有波动", 
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        description: `相比首次测评，你的财富卡点总分增加了 ${diff} 分，这可能是暂时的波动，保持觉察即可。`
      };
    } else {
      return { 
        icon: Minus, 
        text: "保持稳定", 
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        description: "你的财富卡点得分保持稳定，继续保持日常的觉察和练习。"
      };
    }
  };

  const trend = getTrendInfo();
  const TrendIcon = trend.icon;

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

        {/* 总分趋势面积图 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">总分变化趋势</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
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
                  domain={[0, 150]}
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
                  formatter={(value: number) => [`${value} 分`, "总分"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  fill="url(#totalGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 分层趋势切换 */}
        <Tabs defaultValue="layers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="layers" className="text-xs gap-1">
              <Layers className="w-3 h-3" />
              三层得分
            </TabsTrigger>
            <TabsTrigger value="fourPoor" className="text-xs gap-1">
              <Target className="w-3 h-3" />
              四穷得分
            </TabsTrigger>
          </TabsList>

          {/* 三层趋势图 */}
          <TabsContent value="layers" className="mt-3">
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
                    domain={[0, 50]}
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
                  <Line 
                    type="monotone" 
                    dataKey="behavior" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6", r: 3 }}
                    name="行为层"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="emotion" 
                    stroke="#EC4899" 
                    strokeWidth={2}
                    dot={{ fill: "#EC4899", r: 3 }}
                    name="情绪层"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="belief" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: "#8B5CF6", r: 3 }}
                    name="信念层"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">行为层</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span className="text-xs text-muted-foreground">情绪层</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-xs text-muted-foreground">信念层</span>
              </div>
            </div>
          </TabsContent>

          {/* 四穷趋势图 */}
          <TabsContent value="fourPoor" className="mt-3">
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
                    domain={[0, 15]}
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
                  <Line 
                    type="monotone" 
                    dataKey="mouth" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: "#EF4444", r: 3 }}
                    name="嘴穷"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hand" 
                    stroke="#F97316" 
                    strokeWidth={2}
                    dot={{ fill: "#F97316", r: 3 }}
                    name="手穷"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="eye" 
                    stroke="#0EA5E9" 
                    strokeWidth={2}
                    dot={{ fill: "#0EA5E9", r: 3 }}
                    name="眼穷"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="heart" 
                    stroke="#A855F7" 
                    strokeWidth={2}
                    dot={{ fill: "#A855F7", r: 3 }}
                    name="心穷"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">嘴穷</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-xs text-muted-foreground">手穷</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs text-muted-foreground">眼穷</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-xs text-muted-foreground">心穷</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

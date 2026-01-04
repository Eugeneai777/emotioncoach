import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { HistoryRecord } from "./WealthBlockHistory";

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

        {/* 趋势图 */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 50]}
                tick={{ fontSize: 12 }}
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
                labelStyle={{ color: "hsl(var(--foreground))" }}
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

        {/* 图例 */}
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">行为层</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <span className="text-xs text-muted-foreground">情绪层</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-muted-foreground">信念层</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

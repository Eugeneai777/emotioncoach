import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CommHistoryRecord } from "./CommAssessmentHistory";

interface CommAssessmentTrendProps {
  records: CommHistoryRecord[];
}

const dimensionLines = [
  { key: 'listening', label: '倾听', color: '#0ea5e9' },
  { key: 'empathy', label: '共情', color: '#ec4899' },
  { key: 'boundary', label: '边界', color: '#f59e0b' },
  { key: 'expression', label: '表达', color: '#10b981' },
  { key: 'conflict', label: '冲突', color: '#ef4444' },
  { key: 'understanding', label: '理解', color: '#6366f1' },
];

export function CommAssessmentTrend({ records }: CommAssessmentTrendProps) {
  if (records.length < 2) return null;

  const chartData = [...records].reverse().map(record => ({
    date: format(new Date(record.created_at), "MM/dd", { locale: zhCN }),
    listening: record.listening_score,
    empathy: record.empathy_score,
    boundary: record.boundary_score,
    expression: record.expression_score,
    conflict: record.conflict_score,
    understanding: record.understanding_score,
  }));

  const latest = records[0];
  const first = records[records.length - 1];
  const getTotal = (r: CommHistoryRecord) => r.listening_score + r.empathy_score + r.boundary_score + r.expression_score + r.conflict_score + r.understanding_score;
  const diff = getTotal(latest) - getTotal(first);

  const getTrendInfo = () => {
    if (diff > 5) return { icon: TrendingUp, text: "明显改善", color: "text-emerald-600", bgColor: "bg-emerald-100" };
    if (diff > 0) return { icon: TrendingUp, text: "有所改善", color: "text-teal-600", bgColor: "bg-teal-100" };
    if (diff < -5) return { icon: TrendingDown, text: "需要关注", color: "text-amber-600", bgColor: "bg-amber-100" };
    if (diff < 0) return { icon: TrendingDown, text: "略有波动", color: "text-orange-600", bgColor: "bg-orange-100" };
    return { icon: Minus, text: "保持稳定", color: "text-sky-600", bgColor: "bg-sky-100" };
  };

  const trend = getTrendInfo();
  const TrendIcon = trend.icon;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>沟通趋势</span>
          <span className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1", trend.bgColor, trend.color)}>
            <TrendIcon className="w-3 h-3" />
            {trend.text}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const dim = dimensionLines.find(d => d.key === name);
                  return [`${value}/12`, dim?.label || name];
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const dim = dimensionLines.find(d => d.key === value);
                  return <span className="text-xs">{dim?.label || value}</span>;
                }}
              />
              {dimensionLines.map(dim => (
                <Line
                  key={dim.key}
                  type="monotone"
                  dataKey={dim.key}
                  stroke={dim.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          共 {records.length} 次测评 · 综合得分变化 {diff > 0 ? '+' : ''}{diff}
        </p>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CommHistoryRecord } from "./CommAssessmentHistory";

interface CommAssessmentTrendProps {
  records: CommHistoryRecord[];
}

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
    total: record.listening_score + record.empathy_score + record.boundary_score + 
           record.expression_score + record.conflict_score + record.understanding_score,
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
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="commTotalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 72]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => [`${value}分`, '综合得分']} />
              <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} fill="url(#commTotalGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          共 {records.length} 次测评 · 综合得分变化 {diff > 0 ? '+' : ''}{diff}
        </p>
      </CardContent>
    </Card>
  );
}

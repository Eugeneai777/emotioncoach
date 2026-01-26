import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, GitCompare, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { SCL90HistoryRecord } from "./SCL90History";
import { scl90FactorInfo, severityConfig } from "./scl90Data";

interface SCL90ComparisonProps {
  current: SCL90HistoryRecord;
  previous: SCL90HistoryRecord;
}

export function SCL90Comparison({ current, previous }: SCL90ComparisonProps) {
  // 计算变化
  const gsiChange = current.gsi - previous.gsi;
  const positiveCountChange = current.positive_count - previous.positive_count;

  // 因子变化
  const factorChanges = [
    { key: 'somatization' as const, current: current.somatization_score, previous: previous.somatization_score },
    { key: 'obsessive' as const, current: current.obsessive_score, previous: previous.obsessive_score },
    { key: 'interpersonal' as const, current: current.interpersonal_score, previous: previous.interpersonal_score },
    { key: 'depression' as const, current: current.depression_score, previous: previous.depression_score },
    { key: 'anxiety' as const, current: current.anxiety_score, previous: previous.anxiety_score },
    { key: 'hostility' as const, current: current.hostility_score, previous: previous.hostility_score },
    { key: 'phobic' as const, current: current.phobic_score, previous: previous.phobic_score },
    { key: 'paranoid' as const, current: current.paranoid_score, previous: previous.paranoid_score },
    { key: 'psychoticism' as const, current: current.psychoticism_score, previous: previous.psychoticism_score },
  ].map(f => ({
    ...f,
    change: f.current - f.previous,
    changePercent: f.previous > 0 ? ((f.current - f.previous) / f.previous * 100) : 0
  }));

  // 找出改善最大和恶化最大的因子
  const improved = factorChanges.filter(f => f.change < -0.2).sort((a, b) => a.change - b.change);
  const worsened = factorChanges.filter(f => f.change > 0.2).sort((a, b) => b.change - a.change);

  const getChangeIcon = (value: number) => {
    // 对于心理症状，降低是好事
    if (value < -0.2) return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    if (value > 0.2) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getChangeColor = (value: number) => {
    if (value < -0.2) return 'text-emerald-600';
    if (value > 0.2) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-600" />
            测评对比分析
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {format(new Date(previous.created_at), "MM/dd", { locale: zhCN })} → {format(new Date(current.created_at), "MM/dd", { locale: zhCN })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* 核心指标变化 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="text-xs text-muted-foreground mb-1">GSI 指数</div>
            <div className="flex items-center gap-2">
              {getChangeIcon(gsiChange)}
              <span className={cn("font-bold text-lg", getChangeColor(gsiChange))}>
                {gsiChange > 0 ? '+' : ''}{gsiChange.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {previous.gsi} → {current.gsi}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <div className="text-xs text-muted-foreground mb-1">阳性项目数</div>
            <div className="flex items-center gap-2">
              {getChangeIcon(positiveCountChange)}
              <span className={cn("font-bold text-lg", getChangeColor(positiveCountChange))}>
                {positiveCountChange > 0 ? '+' : ''}{positiveCountChange}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {previous.positive_count} → {current.positive_count}
            </div>
          </div>
        </div>

        {/* 严重程度变化 */}
        {current.severity_level !== previous.severity_level && (
          <div className={cn(
            "p-3 rounded-lg flex items-center gap-3",
            severityConfig[current.severity_level].bgColor.replace('bg-', 'bg-opacity-20 bg-')
          )}>
            <Activity className={cn("w-5 h-5", severityConfig[current.severity_level].textColor)} />
            <div>
              <div className="text-sm font-medium">严重程度变化</div>
              <div className="text-xs text-muted-foreground">
                {severityConfig[previous.severity_level].label} → {severityConfig[current.severity_level].label}
              </div>
            </div>
          </div>
        )}

        {/* 改善最大的因子 */}
        {improved.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" />
              明显改善
            </p>
            <div className="flex flex-wrap gap-2">
              {improved.slice(0, 3).map(f => {
                const info = scl90FactorInfo[f.key];
                return (
                  <span 
                    key={f.key}
                    className="text-xs px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center gap-1"
                  >
                    {info.emoji} {info.name}
                    <span className="font-medium">↓{Math.abs(f.change).toFixed(1)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 恶化的因子 */}
        {worsened.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              需要关注
            </p>
            <div className="flex flex-wrap gap-2">
              {worsened.slice(0, 3).map(f => {
                const info = scl90FactorInfo[f.key];
                return (
                  <span 
                    key={f.key}
                    className="text-xs px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full flex items-center gap-1"
                  >
                    {info.emoji} {info.name}
                    <span className="font-medium">↑{f.change.toFixed(1)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 所有因子变化列表 */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium text-muted-foreground">各因子变化</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {factorChanges.map(f => {
              const info = scl90FactorInfo[f.key];
              return (
                <div key={f.key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{info.emoji} {info.name}</span>
                  <span className={cn("font-medium", getChangeColor(f.change))}>
                    {f.change > 0 ? '+' : ''}{f.change.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

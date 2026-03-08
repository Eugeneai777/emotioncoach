import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalDimensionScore {
  key?: string;
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
  average?: number;
  severity?: string;
}

interface ClinicalResultSectionProps {
  dimensionScores: ClinicalDimensionScore[];
  meta?: Record<string, any>;
}

const severityConfig: Record<string, { color: string; bg: string; border: string; barColor: string }> = {
  "正常": { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", barColor: "bg-emerald-500" },
  "轻度": { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", barColor: "bg-amber-500" },
  "中度": { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", barColor: "bg-orange-500" },
  "中重度": { color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", barColor: "bg-red-500" },
  "重度": { color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/40", border: "border-red-300 dark:border-red-700", barColor: "bg-red-600" },
};

export function ClinicalResultSection({ dimensionScores, meta }: ClinicalResultSectionProps) {
  const hasClinicalData = dimensionScores.some((d) => d.average !== undefined);
  if (!hasClinicalData) return null;

  const sorted = [...dimensionScores].sort((a, b) => (b.average || 0) - (a.average || 0));
  const abnormalCount = sorted.filter((d) => (d.average || 0) >= 2.0).length;
  const globalAvg = meta?.globalAverage || 0;
  const positiveItems = meta?.positiveItemCount || 0;
  const totalItems = meta?.totalItems || 0;

  return (
    <div className="space-y-4">
      {/* Clinical overview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">临床概览</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-muted/40">
                <p className="text-lg font-bold text-foreground">{globalAvg}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">总均分</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/40">
                <p className="text-lg font-bold text-foreground">{positiveItems}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">阳性项目数</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/40">
                <p className={cn("text-lg font-bold", abnormalCount > 0 ? "text-orange-500" : "text-emerald-600")}>
                  {abnormalCount}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">异常因子数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Factor severity bars */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">因子分析</h3>
            </div>
            {sorted.map((d, i) => {
              const avg = d.average || 0;
              const severity = d.severity || "正常";
              const config = severityConfig[severity] || severityConfig["正常"];
              // Bar width: avg out of 5 scale
              const barPct = Math.min((avg / 4) * 100, 100);

              return (
                <motion.div
                  key={d.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {d.emoji} {d.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        均分 {avg}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", config.color, config.bg, config.border)}
                      >
                        {severity}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", config.barColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.8, delay: 0.7 + i * 0.05, ease: "easeOut" }}
                    />
                    {/* Threshold line at 2.0 (clinical threshold) */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-destructive/40"
                      style={{ left: `${(2 / 4) * 100}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
            <p className="text-[10px] text-muted-foreground text-center pt-2">
              红色虚线 = 临界值 (均分 2.0)，超过该值建议关注
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Severity legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="flex items-center justify-center gap-3 flex-wrap"
      >
        {Object.entries(severityConfig).map(([label, cfg]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn("w-2.5 h-2.5 rounded-full", cfg.barColor)} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

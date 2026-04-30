import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Sparkles, Users, BellRing, RefreshCw, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import { DimensionRadarChart } from "./DimensionRadarChart";
import { DynamicAssessmentRecord } from "@/hooks/useDynamicAssessmentHistory";
import {
  getStatusBand,
  getStatusLabel,
  getDeltaCopy,
  getActionForWeakestDimension,
  getStatusToneText,
} from "@/config/maleMidlifeVitalityCopy";
import { useToast } from "@/hooks/use-toast";

interface DimScore {
  label: string;
  emoji?: string;
  score: number;
  maxScore: number;
}

interface Props {
  current: DynamicAssessmentRecord;
  previous: DynamicAssessmentRecord;
}

const toStatusPct = (raw: number, max: number) => {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(100 - (raw / max) * 100)));
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const bandColorMap = {
  emerald: {
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    bar: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
} as const;

export function MaleVitalityCompareView({ current, previous }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 保证 current 是较新的那条
  const [latest, earlier] = useMemo(() => {
    const a = new Date(current.created_at).getTime();
    const b = new Date(previous.created_at).getTime();
    return a >= b ? [current, previous] : [previous, current];
  }, [current, previous]);

  const latestDims = (latest.dimension_scores || []) as DimScore[];
  const earlierDims = (previous.dimension_scores || []) as DimScore[];

  const { latestPct, earlierPct, deltaPct, statusDims, earlierStatusDims } = useMemo(() => {
    const latestMax = latestDims.reduce((s, d) => s + (d.maxScore || 0), 0) || latest.total_score || 1;
    const earlierMax = earlierDims.reduce((s, d) => s + (d.maxScore || 0), 0) || earlier.total_score || 1;
    const lp = toStatusPct(latest.total_score, latestMax);
    const ep = toStatusPct(earlier.total_score, earlierMax);
    return {
      latestPct: lp,
      earlierPct: ep,
      deltaPct: lp - ep,
      statusDims: latestDims.map((d) => ({
        label: getStatusLabel(d.label),
        emoji: d.emoji || "🔋",
        score: toStatusPct(d.score, d.maxScore),
        maxScore: 100,
      })),
      earlierStatusDims: earlierDims.map((d) => ({
        label: getStatusLabel(d.label),
        emoji: d.emoji || "🔋",
        score: toStatusPct(d.score, d.maxScore),
        maxScore: 100,
      })),
    };
  }, [latestDims, earlierDims, latest.total_score, earlier.total_score]);

  const band = getStatusBand(latestPct);
  const colors = bandColorMap[band.color];

  // 计算每个维度的变化(状态指数差)
  const deltas = useMemo(() => {
    return latestDims.map((d, i) => {
      const e = earlierDims[i];
      const cur = toStatusPct(d.score, d.maxScore);
      const prev = e ? toStatusPct(e.score, e.maxScore) : cur;
      return {
        rawLabel: d.label,
        label: getStatusLabel(d.label),
        emoji: d.emoji || "🔋",
        cur,
        prev,
        delta: cur - prev,
      };
    });
  }, [latestDims, earlierDims]);

  const topUps = useMemo(
    () => [...deltas].filter((x) => x.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3),
    [deltas]
  );
  const topDown = useMemo(
    () => [...deltas].filter((x) => x.delta < 0).sort((a, b) => a.delta - b.delta)[0],
    [deltas]
  );
  const weakest = useMemo(
    () => [...deltas].sort((a, b) => a.cur - b.cur)[0],
    [deltas]
  );

  const handleRecheckReminder = () => {
    try {
      const target = new Date();
      target.setDate(target.getDate() + 7);
      localStorage.setItem("vitality_recheck_at", target.toISOString());
    } catch {/* ignore */}
    toast({
      title: "已设置 7 天后复测提醒",
      description: "到时再来,看看你的电量回到多少。",
    });
  };

  return (
    <motion.div
      className="w-full min-w-0 mb-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="border-primary/30 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden w-full min-w-0">
        <div className={`h-1 ${colors.bar}`} />
        <CardContent className="p-4 sm:p-5 space-y-5">
          {/* Block 1: 状态电量对比卡 */}
          <div className="w-full min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-semibold text-sm">有劲状态对比</h3>
              <Badge variant="outline" className={`ml-auto text-[10px] ${colors.chip}`}>
                {band.headline}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <motion.div className="text-center min-w-0" {...fadeUp(0.05)}>
                <p className="text-[10px] text-muted-foreground mb-1 truncate">
                  {format(new Date(earlier.created_at), "MM/dd", { locale: zhCN })}
                </p>
                <div className="text-2xl sm:text-3xl font-bold text-muted-foreground tabular-nums">
                  {earlierPct}
                  <span className="text-xs font-medium ml-0.5">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">上次</p>
              </motion.div>
              <motion.div className="text-center min-w-0" {...fadeUp(0.15)}>
                {deltaPct > 0 ? (
                  <div className={`flex items-center justify-center gap-1 ${colors.text}`}>
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-base sm:text-lg font-bold tabular-nums whitespace-nowrap">
                      +{deltaPct}%
                    </span>
                  </div>
                ) : deltaPct < 0 ? (
                  <div className="flex items-center justify-center gap-1 text-rose-500">
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-base sm:text-lg font-bold tabular-nums whitespace-nowrap">
                      {deltaPct}%
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">持平</span>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">变化</p>
              </motion.div>
              <motion.div className="text-center min-w-0" {...fadeUp(0.25)}>
                <p className="text-[10px] text-muted-foreground mb-1 truncate">
                  {format(new Date(latest.created_at), "MM/dd", { locale: zhCN })}
                </p>
                <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${colors.text}`}>
                  {latestPct}
                  <span className="text-xs font-medium ml-0.5">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">本次</p>
              </motion.div>
            </div>
            <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed mt-3 px-1">
              你的电量回到了 <span className={`font-bold ${colors.text}`}>{latestPct}%</span>
              ,{band.subline}
            </p>
          </div>

          {/* Block 2: 雷达图叠层 */}
          {statusDims.length >= 3 && (
            <div className="w-full min-w-0">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                📊 6 维状态指数对比
                <span className="text-[10px] font-normal text-muted-foreground/70">
                  (越靠外越好)
                </span>
              </h4>
              <div className="h-[260px] sm:h-[300px] md:h-[360px] w-full">
                <DimensionRadarChart
                  dimensionScores={statusDims}
                  compareScores={earlierStatusDims.length >= 3 ? earlierStatusDims : undefined}
                  variant="default"
                />
              </div>
            </div>
          )}

          {/* Block 3: 关键变化 */}
          <div className="w-full min-w-0 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              🎯 这次变化在哪
            </h4>
            {topUps.length === 0 && !topDown && (
              <p className="text-xs text-muted-foreground italic px-1">
                各项基本持平,继续保持节奏。
              </p>
            )}
            {topUps.map((d, i) => (
              <motion.div
                key={`up-${d.rawLabel}`}
                className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5"
                {...fadeUp(0.05 * i)}
              >
                <span className="text-base shrink-0 leading-none mt-0.5">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{d.label}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 tabular-nums"
                    >
                      +{d.delta}%
                    </Badge>
                  </div>
                  <p className="text-[11px] sm:text-xs text-foreground/75 mt-0.5 leading-relaxed break-words">
                    {getDeltaCopy(d.rawLabel, d.delta)}
                  </p>
                </div>
              </motion.div>
            ))}
            {topDown && (
              <motion.div
                className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5"
                {...fadeUp(0.2)}
              >
                <span className="text-base shrink-0 leading-none mt-0.5">{topDown.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{topDown.label}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/10 tabular-nums"
                    >
                      {topDown.delta}%
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">需留意</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-foreground/75 mt-0.5 leading-relaxed break-words">
                    {getDeltaCopy(topDown.rawLabel, topDown.delta)}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Block 4: 本周一个动作 */}
          {weakest && (
            <motion.div
              className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 to-primary/3 p-3.5 sm:p-4 w-full min-w-0"
              {...fadeUp(0.3)}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-primary">本周一个动作</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                  {weakest.emoji} {weakest.label} · {getStatusToneText(weakest.cur)}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed break-words">
                {getActionForWeakestDimension(weakest.rawLabel)}
              </p>
            </motion.div>
          )}

          {/* Block 5: CTA */}
          <div className="w-full min-w-0 pt-1">
            <p className="text-[11px] text-muted-foreground mb-2 px-1">下一步,挑一个最适合你的:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              <Button
                variant={band.ctaPrimary === "coach" ? "default" : "outline"}
                size="sm"
                className="min-h-[44px] gap-1.5 text-xs sm:text-sm w-full"
                onClick={() => navigate("/coaches")}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">找教练 1v1 拆解</span>
                {band.ctaPrimary === "coach" && <ArrowRight className="w-3 h-3 shrink-0" />}
              </Button>
              <Button
                variant={band.ctaPrimary === "camp" ? "default" : "outline"}
                size="sm"
                className="min-h-[44px] gap-1.5 text-xs sm:text-sm w-full"
                onClick={() => navigate("/assessment/male_midlife_vitality")}
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">回到测评 / 重测</span>
                {band.ctaPrimary === "camp" && <ArrowRight className="w-3 h-3 shrink-0" />}
              </Button>
              <Button
                variant={band.ctaPrimary === "recheck" ? "default" : "outline"}
                size="sm"
                className="min-h-[44px] gap-1.5 text-xs sm:text-sm w-full"
                onClick={handleRecheckReminder}
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">7 天后再测一次</span>
                {band.ctaPrimary === "recheck" && <ArrowRight className="w-3 h-3 shrink-0" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MaleVitalityCompareView;

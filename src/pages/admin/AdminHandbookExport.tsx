import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportNodeToPdf } from "@/utils/exportReportToPdf";
import { fetchHandbookInsights, type HandbookType } from "@/lib/reportAIInsight";
import {
  HandbookContainer,
  type HandbookData,
} from "@/components/admin/handbook/HandbookContainer";
import {
  MALE_CLUSTERS,
  MALE_FALLBACK_BY_SCORE,
  MALE_SEVEN_DAYS,
  MALE_CAMP_INVITE,
} from "@/config/maleVitalityHandbook";
import {
  FEMALE_CLUSTERS,
  FEMALE_FALLBACK_BY_SCORE,
  FEMALE_SEVEN_DAYS,
  FEMALE_CAMP_INVITE,
} from "@/config/emotionHealthHandbook";
import { useMarketingPoolAdminStatus } from "@/hooks/useMarketingPools";
import { dedupeClusterInsights } from "@/components/admin/handbook/clusterCopy";

const MALE_LABEL: Record<string, string> = {
  energy: "精力续航",
  sleep: "睡眠修复",
  stress: "压力内耗",
  confidence: "信心",
  relationship: "关系温度",
  recovery: "恢复阻力",
};
const FEMALE_PATTERN_LABEL: Record<string, string> = {
  exhaustion: "情绪耗竭",
  tension: "紧绷绷紧",
  suppression: "压抑收回",
  avoidance: "回避卡住",
};

export default function AdminHandbookExport() {
  const { type, recordId } = useParams<{ type: "male" | "emotion"; recordId: string }>();
  const { isAdmin, isLoading: roleLoading } = useMarketingPoolAdminStatus();
  const [data, setData] = useState<HandbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handbookType: HandbookType =
    type === "emotion" ? "emotion_health" : "male_vitality";

  useEffect(() => {
    if (!recordId || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let built: HandbookData;
        if (handbookType === "male_vitality") {
          built = await buildMaleData(recordId);
        } else {
          built = await buildEmotionData(recordId);
        }
        if (!cancelled) setData(built);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recordId, handbookType, isAdmin]);

  const filename = useMemo(() => {
    if (!data || !recordId) return "";
    const namePart = data.displayName.replace(/[\s\\/:*?"<>|]/g, "").slice(0, 12) || "用户";
    const idPart = recordId.replace(/-/g, "").slice(0, 8);
    const dateStr = format(new Date(), "yyyyMMdd");
    const typeName = handbookType === "male_vitality" ? "男人有劲" : "情绪健康";
    return `${typeName}_${namePart}_${idPart}_${dateStr}`;
  }, [data, recordId, handbookType]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin" replace />;
  if (!recordId) return <div className="p-8 text-destructive">缺少 recordId 参数</div>;

  const handleDownload = async () => {
    if (!data || !containerRef.current || downloading) return;
    setDownloading(true);
    try {
      await document.fonts?.ready;
      // 给 recharts 雷达图绘制完成留时间
      await new Promise((r) => setTimeout(r, 400));
      await exportNodeToPdf(containerRef.current, { filename, scale: 2 });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("pdf_generation_logs").insert({
          admin_id: user.id,
          record_id: recordId,
          handbook_type: handbookType,
          filename: `${filename}.pdf`,
          status: "success",
        });
      }
      toast.success("PDF 已下载");
    } catch (e: any) {
      toast.error("下载失败：" + (e?.message || ""));
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("pdf_generation_logs").insert({
          admin_id: user.id,
          record_id: recordId,
          handbook_type: handbookType,
          filename: `${filename}.pdf`,
          status: "failed",
          error_message: String(e?.message || e),
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3 flex items-center gap-4">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            7 天伴随手册 · {handbookType === "male_vitality" ? "男人有劲" : "情绪健康"}
          </div>
          <div className="text-xs text-muted-foreground font-mono truncate">
            recordId: {recordId} · {data?.displayName || "—"}
          </div>
        </div>
        <Button onClick={handleDownload} disabled={!data || downloading} className="gap-1.5">
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          下载 PDF
        </Button>
      </div>

      <div className="p-8">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> 正在生成个性化心声（约 10-20 秒）…
          </div>
        )}
        {error && <div className="text-destructive">{error}</div>}
        {data && (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              预览（缩略，PDF 实际为 A4 9 页）：
            </div>
            <div
              style={{
                transform: "scale(0.5)",
                transformOrigin: "top left",
                width: "397px",
                height: "5057px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* 同时把它显示出来当预览 */}
            </div>
            <HandbookContainer ref={containerRef} data={data} key={recordId} />
          </>
        )}
      </div>
    </div>
  );
}

// ============= 数据装配 =============

async function buildMaleData(recordId: string): Promise<HandbookData> {
  const { data: row, error } = await supabase
    .from("partner_assessment_results")
    .select("id, user_id, answers, dimension_scores, total_score, primary_pattern, created_at, template_id, ai_insight")
    .eq("id", recordId)
    .maybeSingle();
  if (error || !row) throw new Error("加载测评结果失败");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", row.user_id)
    .maybeSingle();
  const displayName =
    profile?.display_name?.trim() ||
    (profile?.phone ? `用户_${String(profile.phone).slice(-4)}` : "用户");

  const { data: tpl } = await supabase
    .from("partner_assessment_templates")
    .select("questions")
    .eq("id", row.template_id)
    .maybeSingle();
  const questions: any[] = Array.isArray(tpl?.questions) ? (tpl!.questions as any[]) : [];
  const answers: Record<string, any> = (row.answers as any) || {};

  const rawDims = (row.dimension_scores as Record<string, any>) || {};
  // 归一化：若 key 不在 MALE_LABEL，按位置映射到标准 6 维
  const STANDARD_KEYS = ["energy", "sleep", "stress", "confidence", "relationship", "recovery"];
  const dims: Record<string, number> = {};
  const rawEntries = Object.entries(rawDims);
  rawEntries.forEach(([k, v], i) => {
    const num = typeof v === "number" ? v : Number(v?.score ?? v?.value ?? 0) || 0;
    const normKey = MALE_LABEL[k] ? k : STANDARD_KEYS[i] || k;
    dims[normKey] = num;
  });

  const weakestKey =
    Object.entries(dims).sort((a, b) => b[1] - a[1])[0]?.[0] || "energy";
  const weakestLabel = MALE_LABEL[weakestKey] || weakestKey;

  const clusters = MALE_CLUSTERS.map((c) => {
    const items = c.questionIndexes
      .map((idx) => {
        const q = questions[idx];
        if (!q) return null;
        const ans = answers[q.id];
        const opt = Array.isArray(q.options)
          ? q.options.find((o: any) => o.value === ans || o.id === ans)
          : null;
        return { q: String(q.text || q.title || `Q${idx + 1}`).slice(0, 40), a: opt ? String(opt.text || opt.label) : String(ans ?? "未答") };
      })
      .filter(Boolean) as Array<{ q: string; a: string }>;
    const avgScore = c.questionIndexes.reduce((s, idx) => {
      const q = questions[idx];
      const ans = answers[q?.id];
      return s + (typeof ans === "number" ? ans : 0);
    }, 0) / Math.max(c.questionIndexes.length, 1);
    return {
      key: c.key,
      title: c.title,
      subtitle: c.subtitle,
      items,
      insight: MALE_FALLBACK_BY_SCORE[Math.round(avgScore)] || MALE_FALLBACK_BY_SCORE[1],
      _summary: items.map((i) => `${i.q}=${i.a}`).join("；"),
    };
  });

  const insights = await fetchHandbookInsights({
    recordId,
    type: "male_vitality",
    weakestKey,
    weakestLabel,
    displayName,
    totalScore: row.total_score,
    clusters: clusters.map((c) => ({ key: c.key, title: c.title, summary: c._summary })),
  });

  // 用 AI 心声覆盖 fallback
  for (const c of clusters) {
    const ai = insights.clusterInsights[c.key];
    if (ai) c.insight = ai;
  }
  // 去重 + 兜底，保证 4 张卡 4 种语气
  const deduped = dedupeClusterInsights(
    clusters.map((c) => ({ key: c.key, insight: c.insight })),
  );
  deduped.forEach((d, i) => {
    clusters[i].insight = d.insight;
  });

  const dayScripts = MALE_SEVEN_DAYS[weakestKey] || MALE_SEVEN_DAYS.energy;

  // 优势 / 风险（用归一化后的 dims）
  const sortedDims = Object.entries(dims).sort((a, b) => a[1] - b[1]);
  const strengthVariants = [
    (label: string) => `「${label}」目前还撑得住，是你这 7 天可以倚靠的部分。`,
    (label: string) => `「${label}」还在你手里。先用它接住自己，不要急着挑最难的硬扛。`,
  ];
  const strengths = sortedDims
    .slice(-2)
    .reverse()
    .map(([k], i) => strengthVariants[i % 2](MALE_LABEL[k] || k));
  const risks = sortedDims
    .slice(0, 2)
    .map(([k, v]) => `「${MALE_LABEL[k] || k}」目前 ${v} 分，已经在亮黄/红灯，这 7 天先别再加压。`);

  return {
    type: "male_vitality",
    recordId,
    displayName,
    assessmentDate: format(new Date(row.created_at), "yyyy-MM-dd"),
    weakestLabel,
    totalScore: row.total_score,
    clusters: clusters.map(({ _summary, ...rest }) => rest),
    strengths,
    risks,
    days: dayScripts,
    campName: MALE_CAMP_INVITE.campName,
    campIntro: MALE_CAMP_INVITE.intro,
    campValues: MALE_CAMP_INVITE.values,
    whyNotAlone: MALE_CAMP_INVITE.whyNotAlone,
    ctaHint: MALE_CAMP_INVITE.ctaHint,
    coverNote: insights.coverNote,
    day7Reflection: insights.day7Reflection,
    dims,
    aiInsightsFull: (insights.fullReading || String(row.ai_insight || "").trim() || insights.coverNote || "").trim(),
  };
}

async function buildEmotionData(recordId: string): Promise<HandbookData> {
  const { data: row, error } = await supabase
    .from("emotion_health_assessments")
    .select("*")
    .eq("id", recordId)
    .maybeSingle();
  if (error || !row) throw new Error("加载测评结果失败");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", row.user_id)
    .maybeSingle();
  const displayName =
    profile?.display_name?.trim() ||
    (profile?.phone ? `用户_${String(profile.phone).slice(-4)}` : "用户");

  // 加载题目
  const { emotionHealthQuestions } = await import("@/components/emotion-health/emotionHealthData");
  const questions = emotionHealthQuestions as any[];
  const answers: Record<string, any> = (row.answers as any) || {};

  const pattern = (row.primary_pattern as string) || "exhaustion";
  const weakestLabel = FEMALE_PATTERN_LABEL[pattern] || pattern;

  const clusters = FEMALE_CLUSTERS.map((c) => {
    const items = c.questionIds
      .map((id) => {
        const q = questions.find((x) => x.id === id);
        if (!q) return null;
        const ans = answers[String(id)] ?? answers[id];
        return { q: String(q.text).slice(0, 40), a: typeof ans === "number" ? `选项 ${ans}` : String(ans ?? "未答") };
      })
      .filter(Boolean) as Array<{ q: string; a: string }>;
    const avg =
      c.questionIds.reduce((s, id) => {
        const ans = answers[String(id)] ?? answers[id];
        return s + (typeof ans === "number" ? ans : 0);
      }, 0) / Math.max(c.questionIds.length, 1);
    return {
      key: c.key,
      title: c.title,
      subtitle: c.subtitle,
      items,
      insight: FEMALE_FALLBACK_BY_SCORE[Math.round(avg)] || FEMALE_FALLBACK_BY_SCORE[1],
      _summary: items.map((i) => `${i.q}=${i.a}`).join("；"),
    };
  });

  const insights = await fetchHandbookInsights({
    recordId,
    type: "emotion_health",
    weakestKey: pattern,
    weakestLabel,
    displayName,
    totalScore: row.energy_index,
    clusters: clusters.map((c) => ({ key: c.key, title: c.title, summary: c._summary })),
  });
  for (const c of clusters) {
    const ai = insights.clusterInsights[c.key];
    if (ai) c.insight = ai;
  }
  // 去重 + 兜底
  const deduped = dedupeClusterInsights(
    clusters.map((c) => ({ key: c.key, insight: c.insight })),
  );
  deduped.forEach((d, i) => {
    clusters[i].insight = d.insight;
  });

  const dayScripts = (FEMALE_SEVEN_DAYS as any)[pattern] || FEMALE_SEVEN_DAYS.exhaustion;

  const num = (v: any) => (typeof v === "number" ? v : Number(v?.score ?? v?.value ?? 0) || 0);
  const indices = [
    { k: "energy_index", label: "精力指数", v: num(row.energy_index) },
    { k: "anxiety_index", label: "焦虑指数", v: num(row.anxiety_index) },
    { k: "stress_index", label: "压力指数", v: num(row.stress_index) },
  ];
  const strengths = indices.filter((x) => x.v >= 60).map((x) => `「${x.label}」还在 ${x.v} 分，是你这 7 天可以倚靠的部分。`);
  const risks = indices.filter((x) => x.v < 40).map((x) => `「${x.label}」仅 ${x.v} 分，是身体在小声求救，这 7 天先别再加压。`);

  // 雷达图 dims（女版用三大指数）
  const dims: Record<string, number> = {
    energy_index: num(row.energy_index),
    anxiety_index: num(row.anxiety_index),
    stress_index: num(row.stress_index),
  };

  // 提取完整 AI 解读
  const ai = (row as any).ai_analysis;
  let aiInsightsFull = "";
  if (typeof ai === "string") aiInsightsFull = ai;
  else if (ai && typeof ai === "object") {
    aiInsightsFull = String(ai.summary || ai.overview || ai.analysis || ai.text || "").trim();
    if (!aiInsightsFull) {
      try { aiInsightsFull = JSON.stringify(ai, null, 2).slice(0, 800); } catch { aiInsightsFull = ""; }
    }
  }

  return {
    type: "emotion_health",
    recordId,
    displayName,
    assessmentDate: format(new Date(row.created_at || Date.now()), "yyyy-MM-dd"),
    weakestLabel,
    totalScore: row.energy_index,
    clusters: clusters.map(({ _summary, ...rest }) => rest),
    strengths,
    risks,
    days: dayScripts,
    campName: FEMALE_CAMP_INVITE.campName,
    campIntro: FEMALE_CAMP_INVITE.intro,
    campValues: FEMALE_CAMP_INVITE.values,
    whyNotAlone: FEMALE_CAMP_INVITE.whyNotAlone,
    ctaHint: FEMALE_CAMP_INVITE.ctaHint,
    coverNote: insights.coverNote,
    day7Reflection: insights.day7Reflection,
    dims,
    aiInsightsFull: aiInsightsFull.trim(),
  };
}

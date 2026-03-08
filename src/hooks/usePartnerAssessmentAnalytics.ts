import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssessmentAnalytics {
  templateId: string;
  title: string;
  emoji: string;
  questionCount: number;
  maxScore: number;
  totalResults: number;
  avgScore: number;
  minScore: number;
  maxActualScore: number;
  completionCount: number;
  uniqueUsers: number;
  dimensionAverages: Record<string, number>;
  patternDistribution: Record<string, number>;
  scoreDistribution: { range: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export function usePartnerAssessmentAnalytics(partnerId: string) {
  return useQuery({
    queryKey: ["partner-assessment-analytics", partnerId],
    queryFn: async () => {
      // Fetch templates
      const { data: templates, error: tErr } = await supabase
        .from("partner_assessment_templates" as any)
        .select("id, title, emoji, question_count, max_score, dimensions")
        .eq("created_by_partner_id", partnerId);
      if (tErr) throw tErr;
      if (!templates || templates.length === 0) return [];

      const templateIds = (templates as any[]).map((t: any) => t.id);

      // Fetch all results for these templates
      const { data: results, error: rErr } = await supabase
        .from("partner_assessment_results" as any)
        .select("*")
        .in("template_id", templateIds)
        .order("created_at", { ascending: false });
      if (rErr) throw rErr;

      const allResults = (results || []) as any[];

      return (templates as any[]).map((tmpl: any): AssessmentAnalytics => {
        const tResults = allResults.filter((r: any) => r.template_id === tmpl.id);
        const scores = tResults.map((r: any) => r.total_score || 0);
        const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
        const uniqueUsers = new Set(tResults.map((r: any) => r.user_id)).size;

        // Dimension averages
        const dimTotals: Record<string, number[]> = {};
        tResults.forEach((r: any) => {
          const ds = r.dimension_scores;
          if (ds && typeof ds === "object") {
            Object.entries(ds).forEach(([key, val]) => {
              if (!dimTotals[key]) dimTotals[key] = [];
              dimTotals[key].push(Number(val) || 0);
            });
          }
        });
        const dimensionAverages: Record<string, number> = {};
        Object.entries(dimTotals).forEach(([key, vals]) => {
          dimensionAverages[key] = vals.reduce((a, b) => a + b, 0) / vals.length;
        });

        // Pattern distribution
        const patternDistribution: Record<string, number> = {};
        tResults.forEach((r: any) => {
          const p = r.primary_pattern || "未分类";
          patternDistribution[p] = (patternDistribution[p] || 0) + 1;
        });

        // Score distribution (5 buckets)
        const maxS = tmpl.max_score || 100;
        const bucketSize = Math.ceil(maxS / 5);
        const scoreDistribution = Array.from({ length: 5 }, (_, i) => {
          const lo = i * bucketSize;
          const hi = Math.min((i + 1) * bucketSize, maxS);
          return {
            range: `${lo}-${hi}`,
            count: scores.filter((s: number) => s >= lo && (i === 4 ? s <= hi : s < hi)).length,
          };
        });

        // Daily trend (last 30 days)
        const now = new Date();
        const dailyMap: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          dailyMap[d.toISOString().slice(0, 10)] = 0;
        }
        tResults.forEach((r: any) => {
          const day = (r.created_at || "").slice(0, 10);
          if (dailyMap[day] !== undefined) dailyMap[day]++;
        });
        const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

        return {
          templateId: tmpl.id,
          title: tmpl.title,
          emoji: tmpl.emoji || "📊",
          questionCount: tmpl.question_count || 0,
          maxScore: maxS,
          totalResults: tResults.length,
          avgScore: Math.round(avgScore * 10) / 10,
          minScore: scores.length > 0 ? Math.min(...scores) : 0,
          maxActualScore: scores.length > 0 ? Math.max(...scores) : 0,
          completionCount: tResults.length,
          uniqueUsers,
          dimensionAverages,
          patternDistribution,
          scoreDistribution,
          dailyTrend,
        };
      });
    },
    enabled: !!partnerId,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RespondentRow {
  resultId: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
  totalScore: number;
  primaryPattern: string | null;
  dimensionScores: Record<string, number> | null;
  answers: any;
  aiInsight: string | null;
  createdAt: string;
}

export interface AssessmentInsights {
  template: {
    id: string;
    title: string;
    emoji: string | null;
    questionCount: number;
    maxScore: number;
    dimensions: any;
    questions: any;
    resultPatterns: any;
  };
  totalResults: number;
  uniqueUsers: number;
  todayCount: number;
  last7dCount: number;
  retestRate: number; // 复测率
  avgScore: number;
  patternDistribution: { name: string; value: number }[];
  scoreDistribution: { range: string; count: number }[];
  dimensionAverages: { name: string; value: number }[];
  dailyTrend: { date: string; count: number }[];
  respondents: RespondentRow[];
}

export function useAdminAssessmentInsights(templateId: string | undefined) {
  return useQuery({
    queryKey: ["admin-assessment-insights", templateId],
    enabled: !!templateId,
    queryFn: async (): Promise<AssessmentInsights | null> => {
      if (!templateId) return null;

      const { data: tmpl, error: tErr } = await supabase
        .from("partner_assessment_templates" as any)
        .select("id, title, emoji, question_count, max_score, dimensions, questions, result_patterns")
        .eq("id", templateId)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!tmpl) return null;

      const { data: results, error: rErr } = await supabase
        .from("partner_assessment_results" as any)
        .select("*")
        .eq("template_id", templateId)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (rErr) throw rErr;

      const rows = (results || []) as any[];
      const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, phone, phone_country_code")
          .in("id", userIds);
        (profiles || []).forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }

      const respondents: RespondentRow[] = rows.map((r) => {
        const p = profileMap[r.user_id] || {};
        return {
          resultId: r.id,
          userId: r.user_id,
          displayName: p.display_name || null,
          avatarUrl: p.avatar_url || null,
          phone: p.phone || null,
          phoneCountryCode: p.phone_country_code || null,
          totalScore: r.total_score || 0,
          primaryPattern: r.primary_pattern || null,
          dimensionScores: r.dimension_scores || null,
          answers: r.answers || null,
          aiInsight: r.ai_insight || null,
          createdAt: r.created_at,
        };
      });

      const t = tmpl as any;
      const totalResults = rows.length;
      const uniqueUsers = userIds.length;
      const retestRate = uniqueUsers > 0 ? Math.round(((totalResults - uniqueUsers) / uniqueUsers) * 100) : 0;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const sevenStart = new Date(now.getTime() - 7 * 86400000).toISOString();
      const todayCount = rows.filter((r) => r.created_at >= todayStart).length;
      const last7dCount = rows.filter((r) => r.created_at >= sevenStart).length;

      const scores = rows.map((r) => r.total_score || 0);
      const avgScore =
        scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

      // pattern
      const patternMap: Record<string, number> = {};
      rows.forEach((r) => {
        const p = r.primary_pattern || "未分类";
        patternMap[p] = (patternMap[p] || 0) + 1;
      });
      const patternDistribution = Object.entries(patternMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // score buckets (5)
      const maxS = t.max_score || 100;
      const bucketSize = Math.max(1, Math.ceil(maxS / 5));
      const scoreDistribution = Array.from({ length: 5 }, (_, i) => {
        const lo = i * bucketSize;
        const hi = Math.min((i + 1) * bucketSize, maxS);
        const count = scores.filter((s) => s >= lo && (i === 4 ? s <= hi : s < hi)).length;
        return { range: `${lo}-${hi}`, count };
      });

      // dimension averages
      const dimSums: Record<string, number[]> = {};
      rows.forEach((r) => {
        const ds = r.dimension_scores;
        if (ds && typeof ds === "object") {
          Object.entries(ds).forEach(([k, v]) => {
            if (!dimSums[k]) dimSums[k] = [];
            dimSums[k].push(Number(v) || 0);
          });
        }
      });
      const dimensionAverages = Object.entries(dimSums).map(([name, vals]) => ({
        name,
        value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      }));

      // daily trend 30d
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
      }
      rows.forEach((r) => {
        const day = (r.created_at || "").slice(0, 10);
        if (dailyMap[day] !== undefined) dailyMap[day]++;
      });
      const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

      return {
        template: {
          id: t.id,
          title: t.title,
          emoji: t.emoji,
          questionCount: t.question_count || 0,
          maxScore: maxS,
          dimensions: t.dimensions,
          questions: t.questions,
          resultPatterns: t.result_patterns,
        },
        totalResults,
        uniqueUsers,
        todayCount,
        last7dCount,
        retestRate,
        avgScore,
        patternDistribution,
        scoreDistribution,
        dimensionAverages,
        dailyTrend,
        respondents,
      };
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RespondentRow } from "./useAdminAssessmentInsights";

export interface EmotionHealthInsights {
  template: {
    id: string;
    title: string;
    emoji: string;
    assessmentKey: string;
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
  retestRate: number;
  avgScore: number; // 用 energy_index 的均值
  paidCount: number;
  patternDistribution: { name: string; value: number }[];
  blockedDimensionDistribution: { name: string; value: number }[];
  scoreDistribution: { range: string; count: number }[];
  dimensionAverages: { name: string; value: number }[];
  dailyTrend: { date: string; count: number }[];
  respondents: (RespondentRow & { isPaid: boolean; blockedDimension: string | null; battery: number; energyIndex: number; anxietyIndex: number; stressIndex: number })[];
}

/**
 * 情绪健康测评(emotion_health_assessments 独立表)的管理员数据洞察。
 * 仅 admin 角色能拉取全量(由 RLS 控制)。
 */
export function useAdminEmotionHealthInsights() {
  return useQuery({
    queryKey: ["admin-emotion-health-insights"],
    queryFn: async (): Promise<EmotionHealthInsights> => {
      const sb = supabase as any;
      const { data: results, error } = await sb
        .from("emotion_health_assessments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;

      const rows = (results || []) as any[];
      const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, phone, phone_country_code")
          .in("id", userIds);
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      let noteMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: notes } = await sb
          .from("admin_user_notes")
          .select("user_id, note, tags, updated_at")
          .in("user_id", userIds);
        (notes || []).forEach((n: any) => { noteMap[n.user_id] = n; });
      }

      const respondents = rows.map((r) => {
        const p = profileMap[r.user_id] || {};
        const n = noteMap[r.user_id] || null;
        const energyIndex = r.energy_index || 0;
        const anxietyIndex = r.anxiety_index || 0;
        const stressIndex = r.stress_index || 0;
        const fatigueAvg = (anxietyIndex + stressIndex) / 2;
        const battery = Math.max(0, Math.min(100, Math.round((100 - fatigueAvg) * 0.6 + energyIndex * 0.4)));
        return {
          resultId: r.id,
          userId: r.user_id,
          displayName: p.display_name || null,
          avatarUrl: p.avatar_url || null,
          phone: p.phone || null,
          phoneCountryCode: p.phone_country_code || null,
          totalScore: energyIndex,
          primaryPattern: r.primary_pattern || null,
          dimensionScores: {
            精力指数: energyIndex,
            焦虑指数: anxietyIndex,
            压力指数: stressIndex,
            耗竭分: r.exhaustion_score || 0,
            紧张分: r.tension_score || 0,
            压抑分: r.suppression_score || 0,
            回避分: r.avoidance_score || 0,
          },
          answers: r.answers || null,
          aiInsight: r.ai_analysis ? JSON.stringify(r.ai_analysis) : null,
          createdAt: r.created_at,
          adminNote: n?.note || null,
          adminTags: Array.isArray(n?.tags) ? n.tags : [],
          adminNoteUpdatedAt: n?.updated_at || null,
          claimCode: r.claim_code || null,
          isPaid: !!r.is_paid,
          blockedDimension: r.blocked_dimension || null,
          battery,
          energyIndex,
          anxietyIndex,
          stressIndex,
        };
      });

      const totalResults = rows.length;
      const uniqueUsers = userIds.length;
      const retestRate = uniqueUsers > 0
        ? Math.round(((totalResults - uniqueUsers) / uniqueUsers) * 100)
        : 0;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const sevenStart = new Date(now.getTime() - 7 * 86400000).toISOString();
      const todayCount = rows.filter((r) => r.created_at >= todayStart).length;
      const last7dCount = rows.filter((r) => r.created_at >= sevenStart).length;
      const paidCount = rows.filter((r) => r.is_paid).length;

      const energies = rows.map((r) => r.energy_index || 0);
      const avgScore = energies.length > 0
        ? Math.round((energies.reduce((a, b) => a + b, 0) / energies.length) * 10) / 10
        : 0;

      const patternMap: Record<string, number> = {};
      rows.forEach((r) => {
        const p = r.primary_pattern || "未分类";
        patternMap[p] = (patternMap[p] || 0) + 1;
      });
      const patternDistribution = Object.entries(patternMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const blockedMap: Record<string, number> = {};
      rows.forEach((r) => {
        const b = r.blocked_dimension || "未分类";
        blockedMap[b] = (blockedMap[b] || 0) + 1;
      });
      const blockedDimensionDistribution = Object.entries(blockedMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // energy 100 分 5 段
      const scoreDistribution = Array.from({ length: 5 }, (_, i) => {
        const lo = i * 20;
        const hi = (i + 1) * 20;
        const count = energies.filter((s) => s >= lo && (i === 4 ? s <= hi : s < hi)).length;
        return { range: `${lo}-${hi}`, count };
      });

      const dimensionAverages = [
        { name: "精力指数", values: rows.map((r) => r.energy_index || 0) },
        { name: "焦虑指数", values: rows.map((r) => r.anxiety_index || 0) },
        { name: "压力指数", values: rows.map((r) => r.stress_index || 0) },
        { name: "耗竭", values: rows.map((r) => r.exhaustion_score || 0) },
        { name: "紧张", values: rows.map((r) => r.tension_score || 0) },
        { name: "压抑", values: rows.map((r) => r.suppression_score || 0) },
        { name: "回避", values: rows.map((r) => r.avoidance_score || 0) },
      ].map(({ name, values }) => ({
        name,
        value: values.length > 0
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
          : 0,
      }));

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
          id: "builtin-emotion-health",
          title: "情绪健康测评",
          emoji: "💚",
          assessmentKey: "emotion_health",
          questionCount: 28,
          maxScore: 100,
          dimensions: null,
          questions: null,
          resultPatterns: null,
        },
        totalResults,
        uniqueUsers,
        todayCount,
        last7dCount,
        retestRate,
        avgScore,
        paidCount,
        patternDistribution,
        blockedDimensionDistribution,
        scoreDistribution,
        dimensionAverages,
        dailyTrend,
        respondents,
      };
    },
  });
}

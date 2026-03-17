import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { ChevronRight, CheckCircle2, Clock, Sparkles, PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Assessment {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  detail: string;
  route: string;
  gradient: string;
  tag?: "hot" | "new" | "recommend";
}

interface AssessmentCategory {
  key: string;
  label: string;
  emoji: string;
  assessments: Assessment[];
}

const categories: AssessmentCategory[] = [
  {
    key: "mental-health",
    label: "心理健康",
    emoji: "🧠",
    assessments: [
      {
        id: "emotion-health",
        emoji: "💚",
        title: "情绪健康测评",
        sub: "焦虑/抑郁水平",
        detail: "PHQ-9+GAD-7 · 5分钟",
        route: "/emotion-health",
        gradient: "from-emerald-500 to-teal-500",
        tag: "recommend",
      },
      {
        id: "scl90",
        emoji: "🔬",
        title: "SCL-90 心理筛查",
        sub: "10因子临床级",
        detail: "90题 · 15分钟",
        route: "/scl90",
        gradient: "from-blue-500 to-indigo-500",
      },
    ],
  },
  {
    key: "growth",
    label: "个人成长",
    emoji: "🌱",
    assessments: [
      {
        id: "midlife-awakening",
        emoji: "🧭",
        title: "中场觉醒力测评",
        sub: "6维度人生卡点",
        detail: "30题 · 8分钟",
        route: "/midlife-awakening",
        gradient: "from-purple-500 to-pink-500",
        tag: "hot",
      },
      {
        id: "wealth-block",
        emoji: "💰",
        title: "财富卡点测评",
        sub: "限制财富的信念",
        detail: "20题 · 6分钟",
        route: "/wealth-block",
        gradient: "from-amber-500 to-orange-500",
        tag: "new",
      },
    ],
  },
  {
    key: "ability",
    label: "能力评估",
    emoji: "💪",
    assessments: [
      {
        id: "women-competitiveness",
        emoji: "👑",
        title: "女性竞争力",
        sub: "独特优势与潜力",
        detail: "25题 · 7分钟",
        route: "/assessment/women_competitiveness",
        gradient: "from-rose-500 to-pink-500",
      },
    ],
  },
  {
    key: "parenting",
    label: "亲子教育",
    emoji: "👨‍👩‍👧",
    assessments: [
      {
        id: "parent-ability",
        emoji: "🎯",
        title: "家长应对能力",
        sub: "养育风格与应对策略",
        detail: "20题 · 5分钟",
        route: "/assessment/parent_ability",
        gradient: "from-violet-500 to-purple-500",
        tag: "recommend" as const,
      },
      {
        id: "communication-parent",
        emoji: "🗣️",
        title: "亲子沟通（家长版）",
        sub: "发现你的沟通模式",
        detail: "20题 · 5分钟",
        route: "/assessment/communication_parent",
        gradient: "from-sky-500 to-cyan-500",
      },
      {
        id: "communication-teen",
        emoji: "💬",
        title: "亲子沟通（青少年版）",
        sub: "让孩子也来测一测",
        detail: "20题 · 5分钟",
        route: "/assessment/communication_teen",
        gradient: "from-indigo-500 to-blue-500",
        tag: "new" as const,
      },
    ],
  },
];

// Map assessment id to its awakening_entries type value (for free assessments completion check)
const ASSESSMENT_TYPE_MAP: Record<string, string> = {
  "midlife-awakening": "midlife_awakening",
  "emotion-health": "emotion_health",
  "scl90": "scl90",
  "wealth-block": "wealth_block",
  "women-competitiveness": "women_competitiveness",
  "parent-ability": "parent_ability",
  "communication-parent": "communication_parent",
  "communication-teen": "communication_teen",
};

// Paid assessments: assessment_id → package_key in orders table
const PAID_ASSESSMENT_MAP: Record<string, string> = {
  "emotion-health": "emotion_health_assessment",
  "scl90": "scl90_report",
  "wealth-block": "wealth_block_assessment",
};

// Free assessments (ownership determined by awakening_entries completion)
const FREE_ASSESSMENT_IDS = [
  "midlife-awakening",
  "women-competitiveness",
  "parent-ability",
  "communication-parent",
  "communication-teen",
];

function useCompletedAssessments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["completed-assessments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const types = Object.values(ASSESSMENT_TYPE_MAP);
      const { data } = await supabase
        .from("awakening_entries")
        .select("type, created_at")
        .eq("user_id", user!.id)
        .in("type", types)
        .order("created_at", { ascending: false });

      const completedMap: Record<string, string> = {};
      const reverseMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(ASSESSMENT_TYPE_MAP)) {
        reverseMap[v] = k;
      }
      for (const row of data || []) {
        const assessmentId = reverseMap[row.type];
        if (assessmentId && !completedMap[assessmentId]) {
          completedMap[assessmentId] = row.created_at;
        }
      }
      return completedMap;
    },
  });
}

function usePurchasedAssessments() {
  const { user } = useAuth();
  const packageKeys = Object.values(PAID_ASSESSMENT_MAP);

  return useQuery({
    queryKey: ["purchased-assessments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("package_key")
        .eq("user_id", user!.id)
        .in("package_key", packageKeys)
        .eq("status", "paid");

      if (error) throw error;

      // Reverse map: package_key → assessment_id
      const reverseMap: Record<string, string> = {};
      for (const [assessmentId, pkgKey] of Object.entries(PAID_ASSESSMENT_MAP)) {
        reverseMap[pkgKey] = assessmentId;
      }

      const purchasedIds = new Set<string>();
      for (const row of data || []) {
        const assessmentId = reverseMap[row.package_key];
        if (assessmentId) purchasedIds.add(assessmentId);
      }
      return purchasedIds;
    },
  });
}

function useOwnedAssessments() {
  const { data: completedMap, isLoading: loadingCompleted } = useCompletedAssessments();
  const { data: purchasedIds, isLoading: loadingPurchased } = usePurchasedAssessments();

  const ownedSet = new Set<string>();

  // Paid assessments: owned if purchased
  if (purchasedIds) {
    purchasedIds.forEach((id) => ownedSet.add(id));
  }

  // Free assessments: owned if completed
  if (completedMap) {
    for (const id of FREE_ASSESSMENT_IDS) {
      if (completedMap[id]) {
        ownedSet.add(id);
      }
    }
  }

  return {
    ownedSet,
    completedMap: completedMap || {},
    isLoading: loadingCompleted || loadingPurchased,
  };
}

const TAG_CONFIG = {
  hot: { label: "热门", className: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800" },
  new: { label: "新", className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  recommend: { label: "推荐", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
};

export default function AssessmentPicker() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { ownedSet, completedMap, isLoading } = useOwnedAssessments();

  // Filter categories to only show owned assessments
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      assessments: cat.assessments.filter((a) => ownedSet.has(a.id)),
    }))
    .filter((cat) => cat.assessments.length > 0);

  const showEmpty = !authLoading && !isLoading && filteredCategories.length === 0;

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: "touch" }}>
      <PageHeader title="我的测评" />

      <main className="container max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* Guide */}
        <div className="text-center space-y-1 pt-1 pb-1">
          <h2 className="text-lg font-bold text-foreground">我的测评</h2>
          <p className="text-sm text-muted-foreground">已购买和已完成的测评</p>
        </div>

        {/* Loading state */}
        {(authLoading || isLoading) && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <motion.div
            className="flex flex-col items-center justify-center py-16 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <PackageOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">暂无可用测评</p>
              <p className="text-xs text-muted-foreground">购买套餐或完成体验后将在此显示</p>
            </div>
          </motion.div>
        )}

        {/* Categories */}
        {!authLoading && !isLoading && filteredCategories.map((cat, catIdx) => (
          <motion.section
            key={cat.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.08, duration: 0.35 }}
          >
            {/* Category header */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-base">{cat.emoji}</span>
              <h3 className="text-sm font-semibold text-foreground">{cat.label}</h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {cat.assessments.map((a, i) => {
                const done = completedMap?.[a.id];
                const tagConf = a.tag ? TAG_CONFIG[a.tag] : null;

                return (
                  <motion.button
                    key={a.id}
                    onClick={() => navigate(a.route)}
                    className="relative flex flex-col p-3.5 rounded-2xl border border-border bg-card hover:shadow-md active:scale-[0.97] transition-all text-left group"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: catIdx * 0.08 + i * 0.04, duration: 0.3 }}
                  >
                    {/* Top row: emoji + tag */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{a.emoji}</span>
                      <div className="flex items-center gap-1">
                        {tagConf && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${tagConf.className}`}>
                            {tagConf.label}
                          </Badge>
                        )}
                        {done && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold text-foreground leading-tight">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.sub}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                        <Clock className="w-3 h-3" />
                        {a.detail}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        ))}
      </main>
    </div>
  );
}

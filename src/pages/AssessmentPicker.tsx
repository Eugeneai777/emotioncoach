import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { ChevronRight, CheckCircle2, Clock, Sparkles } from "lucide-react";
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
        route: "/women-competitiveness",
        gradient: "from-rose-500 to-pink-500",
      },
      {
        id: "communication",
        emoji: "🗣️",
        title: "沟通力评估",
        sub: "沟通模式与盲区",
        detail: "20题 · 5分钟",
        route: "/communication-assessment",
        gradient: "from-sky-500 to-cyan-500",
      },
      {
        id: "parent-ability",
        emoji: "👨‍👩‍👧",
        title: "家长能力评估",
        sub: "养育风格分析",
        detail: "20题 · 5分钟",
        route: "/parent-ability-assessment",
        gradient: "from-violet-500 to-purple-500",
      },
    ],
  },
];

const ALL_ASSESSMENT_IDS = categories.flatMap((c) => c.assessments.map((a) => a.id));

// Map assessment id to its awakening_entries type value
const ASSESSMENT_TYPE_MAP: Record<string, string> = {
  "midlife-awakening": "midlife_awakening",
  "emotion-health": "emotion_health",
  "scl90": "scl90",
  "wealth-block": "wealth_block",
  "women-competitiveness": "women_competitiveness",
  "communication": "communication",
  "parent-ability": "parent_ability",
};

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

      // Build a map: assessment_id -> latest completion date
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

const TAG_CONFIG = {
  hot: { label: "热门", className: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800" },
  new: { label: "新", className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  recommend: { label: "推荐", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
};

export default function AssessmentPicker() {
  const navigate = useNavigate();
  const { data: completedMap } = useCompletedAssessments();

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: "touch" }}>
      <PageHeader title="看清自己" />

      <main className="container max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* Guide */}
        <div className="text-center space-y-1 pt-1 pb-1">
          <h2 className="text-lg font-bold text-foreground">选一个最想了解的方向</h2>
          <p className="text-sm text-muted-foreground">每个测评都免费，结果即时生成</p>
        </div>

        {/* Categories */}
        {categories.map((cat, catIdx) => (
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

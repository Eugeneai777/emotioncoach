import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { ChevronRight, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ─── 测评数据 ─── */
interface Assessment {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  detail: string;
  route: string;
  tag?: "hot" | "new" | "recommend";
}

interface AssessmentCategory {
  key: string;
  label: string;
  emoji: string;
  assessments: Assessment[];
}

const assessmentCategories: AssessmentCategory[] = [
  {
    key: "mental-health",
    label: "心理健康",
    emoji: "🧠",
    assessments: [
      { id: "emotion-health", emoji: "💚", title: "情绪健康测评", sub: "焦虑/抑郁水平", detail: "PHQ-9+GAD-7 · 5分钟", route: "/emotion-health", tag: "recommend" },
      { id: "scl90", emoji: "🔬", title: "SCL-90 心理筛查", sub: "10因子临床级", detail: "90题 · 15分钟", route: "/scl90" },
    ],
  },
  {
    key: "growth",
    label: "个人成长",
    emoji: "🌱",
    assessments: [
      { id: "midlife-awakening", emoji: "🧭", title: "中场觉醒力测评", sub: "6维度人生卡点", detail: "30题 · 8分钟", route: "/midlife-awakening", tag: "hot" },
      { id: "wealth-block", emoji: "💰", title: "财富卡点测评", sub: "限制财富的信念", detail: "20题 · 6分钟", route: "/wealth-block", tag: "new" },
    ],
  },
  {
    key: "ability",
    label: "能力评估",
    emoji: "💪",
    assessments: [
      { id: "women-competitiveness", emoji: "👑", title: "女性竞争力", sub: "独特优势与潜力", detail: "25题 · 7分钟", route: "/assessment/women_competitiveness" },
    ],
  },
  {
    key: "parenting",
    label: "亲子教育",
    emoji: "👨‍👩‍👧",
    assessments: [
      { id: "parent-ability", emoji: "🎯", title: "家长应对能力", sub: "养育风格与应对策略", detail: "20题 · 5分钟", route: "/assessment/parent_ability", tag: "recommend" },
      { id: "communication-parent", emoji: "🗣️", title: "亲子沟通（家长版）", sub: "发现你的沟通模式", detail: "20题 · 5分钟", route: "/assessment/communication_parent" },
      { id: "communication-teen", emoji: "💬", title: "亲子沟通（青少年版）", sub: "让孩子也来测一测", detail: "20题 · 5分钟", route: "/assessment/communication_teen", tag: "new" },
    ],
  },
];

/* ─── 日常工具数据 ─── */
interface Tool {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  route: string;
  accent: string;
  bg: string;
}

const dailyTools: Tool[] = [
  { id: "emotion-button", emoji: "🆘", title: "情绪SOS按钮", desc: "崩溃时按一下，3分钟恢复平静", route: "/emotion-button", accent: "hsl(25 95% 53%)", bg: "hsl(25 95% 53% / 0.08)" },
  { id: "alive-check", emoji: "💗", title: "每日安全守护", desc: "每日确认平安，守护你在乎的人", route: "/alive-check", accent: "hsl(350 80% 60%)", bg: "hsl(350 80% 60% / 0.08)" },
  { id: "awakening", emoji: "📔", title: "觉察日记", desc: "AI陪你写日记，看见情绪变化", route: "/awakening", accent: "hsl(250 60% 60%)", bg: "hsl(250 60% 60% / 0.08)" },
  { id: "gratitude", emoji: "🌸", title: "感恩日记", desc: "记录美好，提升幸福感", route: "/gratitude", accent: "hsl(330 65% 55%)", bg: "hsl(330 65% 55% / 0.08)" },
  { id: "breathing", emoji: "🧘", title: "呼吸练习", desc: "科学呼吸法，快速减压", route: "/breathing", accent: "hsl(180 55% 45%)", bg: "hsl(180 55% 45% / 0.08)" },
  { id: "declaration", emoji: "⚡", title: "能量宣言卡", desc: "给自己一句有力量的话", route: "/declaration", accent: "hsl(45 95% 50%)", bg: "hsl(45 95% 50% / 0.08)" },
];

/* ─── 已完成状态 hook ─── */
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
      for (const [k, v] of Object.entries(ASSESSMENT_TYPE_MAP)) reverseMap[v] = k;
      for (const row of data || []) {
        const aid = reverseMap[row.type];
        if (aid && !completedMap[aid]) completedMap[aid] = row.created_at;
      }
      return completedMap;
    },
  });
}

/* ─── Tag 配置 ─── */
const TAG_CONFIG = {
  hot: { label: "热门", cls: "bg-red-500/10 text-red-600 border-red-200" },
  new: { label: "新", cls: "bg-amber-500/10 text-amber-600 border-amber-200" },
  recommend: { label: "推荐", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
};

/* ─── 主组件 ─── */
export default function AssessmentTools() {
  const navigate = useNavigate();
  const { data: completedMap } = useCompletedAssessments();

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-stone-50 via-white to-stone-50" style={{ WebkitOverflowScrolling: "touch" }}>
      <PageHeader title="测评 & 工具" showBack />

      <main className="max-w-2xl mx-auto px-4 pt-2 pb-12 space-y-6">

        {/* ═══ Hero 引导 ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-3"
        >
          <h2 className="text-lg font-bold text-foreground">了解自己，善待自己</h2>
          <p className="text-sm text-muted-foreground mt-1">专业测评 + 日常工具，全方位支持你的成长</p>
        </motion.div>

        {/* ═══ 日常工具区 ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🛠</span>
            <h3 className="text-sm font-bold text-foreground">日常工具</h3>
            <span className="text-[11px] text-muted-foreground">随时可用</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {dailyTools.map((tool, i) => (
              <motion.button
                key={tool.id}
                onClick={() => navigate(tool.route)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.03 }}
                className="group flex items-start gap-2.5 p-3 rounded-2xl border border-border/60 bg-card hover:shadow-md active:scale-[0.97] transition-all text-left"
              >
                <span
                  className="text-lg w-9 h-9 flex items-center justify-center rounded-xl shrink-0 mt-0.5"
                  style={{ background: tool.bg }}
                >
                  {tool.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground leading-tight">{tool.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{tool.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ═══ 分割装饰 ═══ */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[11px] text-muted-foreground/60 font-medium tracking-wider">专 业 测 评</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ═══ 测评分类区 ═══ */}
        {assessmentCategories.map((cat, catIdx) => (
          <motion.section
            key={cat.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + catIdx * 0.06 }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-base">{cat.emoji}</span>
              <h3 className="text-sm font-bold text-foreground">{cat.label}</h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {cat.assessments.map((a, i) => {
                const done = completedMap?.[a.id];
                const tagConf = a.tag ? TAG_CONFIG[a.tag] : null;

                return (
                  <motion.button
                    key={a.id}
                    onClick={() => navigate(a.route)}
                    className="relative flex flex-col p-3.5 rounded-2xl border border-border/60 bg-card hover:shadow-md active:scale-[0.97] transition-all text-left group"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + catIdx * 0.06 + i * 0.03 }}
                  >
                    {/* Top: emoji + badges */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{a.emoji}</span>
                      <div className="flex items-center gap-1">
                        {tagConf && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${tagConf.cls}`}>
                            {tagConf.label}
                          </Badge>
                        )}
                        {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-foreground leading-tight">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.sub}</p>

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

        {/* ═══ 底部提示 ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-2 pb-4"
        >
          <p className="text-xs text-muted-foreground/50">所有测评结果仅供参考，不构成医学诊断</p>
        </motion.div>
      </main>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { ChevronRight } from "lucide-react";

const assessments = [
  {
    id: "midlife-awakening",
    emoji: "🧭",
    title: "中场觉醒力测评",
    sub: "6维度扫描，看清人生卡点在哪",
    detail: "30题 · 约8分钟",
    route: "/midlife-awakening",
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200/50 dark:border-purple-800/40",
  },
  {
    id: "emotion-health",
    emoji: "💚",
    title: "情绪健康测评",
    sub: "了解你的焦虑和抑郁水平",
    detail: "PHQ-9 + GAD-7 · 约5分钟",
    route: "/emotion-health",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200/50 dark:border-emerald-800/40",
  },
  {
    id: "scl90",
    emoji: "🔬",
    title: "SCL-90 心理健康",
    sub: "10因子临床级心理筛查",
    detail: "90题 · 约15分钟",
    route: "/scl90",
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200/50 dark:border-blue-800/40",
  },
  {
    id: "wealth-block",
    emoji: "💰",
    title: "财富卡点测评",
    sub: "看见限制你财富的信念模式",
    detail: "20题 · 约6分钟",
    route: "/wealth-block",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200/50 dark:border-amber-800/40",
  },
  {
    id: "women-competitiveness",
    emoji: "👑",
    title: "女性竞争力测评",
    sub: "发现你的独特优势和潜力",
    detail: "25题 · 约7分钟",
    route: "/women-competitiveness",
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200/50 dark:border-rose-800/40",
  },
  {
    id: "communication",
    emoji: "🗣️",
    title: "沟通力评估",
    sub: "发现你的沟通模式和盲区",
    detail: "20题 · 约5分钟",
    route: "/communication-assessment",
    gradient: "from-sky-500 to-cyan-500",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200/50 dark:border-sky-800/40",
  },
  {
    id: "parent-ability",
    emoji: "👨‍👩‍👧",
    title: "家长能力评估",
    sub: "了解你的养育风格和成长空间",
    detail: "20题 · 约5分钟",
    route: "/parent-ability-assessment",
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200/50 dark:border-violet-800/40",
  },
];

export default function AssessmentPicker() {
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: "touch" }}>
      <PageHeader title="看清自己" />

      <main className="container max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Guide text */}
        <div className="text-center space-y-1.5 pt-2 pb-2">
          <h2 className="text-lg font-bold text-foreground">选一个最想了解的方向</h2>
          <p className="text-sm text-muted-foreground">每个测评都免费，结果即时生成</p>
        </div>

        {/* Assessment cards */}
        <div className="space-y-3">
          {assessments.map((a, i) => (
            <motion.button
              key={a.id}
              onClick={() => navigate(a.route)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${a.border} ${a.bg} hover:shadow-md active:scale-[0.98] transition-all text-left`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
            >
              <span className="text-3xl shrink-0">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.sub}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{a.detail}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}

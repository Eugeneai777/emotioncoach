import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Sparkles } from "lucide-react";
import logoImage from "@/assets/logo-youjin-ai.png";

const audiences = [
  { id: "mama", emoji: "👩‍👧", label: "宝妈专区", subtitle: "陪你一起带娃", route: "/mama", color: "bg-rose-50 dark:bg-rose-950/40", accent: "text-rose-600 dark:text-rose-400", border: "border-rose-200/60 dark:border-rose-800/40", tag: "热门", tagColor: "bg-rose-500" },
  { id: "workplace", emoji: "💼", label: "职场解压", subtitle: "压力·倦怠恢复", route: "/promo/synergy", color: "bg-blue-50 dark:bg-blue-950/40", accent: "text-blue-600 dark:text-blue-400", border: "border-blue-200/60 dark:border-blue-800/40", tag: "推荐", tagColor: "bg-blue-500" },
  { id: "couple", emoji: "💑", label: "情侣夫妻", subtitle: "亲密关系·沟通", route: "/us-ai", color: "bg-purple-50 dark:bg-purple-950/40", accent: "text-purple-600 dark:text-purple-400", border: "border-purple-200/60 dark:border-purple-800/40", tag: "热门", tagColor: "bg-purple-500" },
  { id: "youth", emoji: "🎓", label: "青少年", subtitle: "学业·情绪·自信", route: "/xiaojin", color: "bg-amber-50 dark:bg-amber-950/40", accent: "text-amber-600 dark:text-amber-400", border: "border-amber-200/60 dark:border-amber-800/40", tag: "新", tagColor: "bg-amber-500" },
  { id: "midlife", emoji: "🧭", label: "中年觉醒", subtitle: "转型·意义重建", route: "/laoge", color: "bg-orange-50 dark:bg-orange-950/40", accent: "text-orange-600 dark:text-orange-400", border: "border-orange-200/60 dark:border-orange-800/40", tag: null, tagColor: "" },
  { id: "senior", emoji: "🌿", label: "银发陪伴", subtitle: "长辈陪伴·关怀", route: "/elder-care", color: "bg-emerald-50 dark:bg-emerald-950/40", accent: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-800/40", tag: "推荐", tagColor: "bg-emerald-500" },
];

const dailyTools = [
  { id: "emotion-button", emoji: "🆘", title: "情绪SOS", desc: "3分钟恢复平静", route: "/emotion-button" },
  { id: "alive-check", emoji: "💗", title: "安全守护", desc: "每日平安确认", route: "/alive-check" },
  { id: "awakening", emoji: "📔", title: "觉察日记", desc: "AI陪你记录", route: "/awakening" },
  { id: "gratitude", emoji: "🌸", title: "感恩日记", desc: "提升幸福感", route: "/gratitude" },
  { id: "breathing", emoji: "🧘", title: "呼吸练习", desc: "科学减压", route: "/breathing" },
  { id: "declaration", emoji: "⚡", title: "能量宣言", desc: "给自己力量", route: "/declaration" },
];

const assessments = [
  { id: "emotion-health", emoji: "💚", title: "情绪健康测评", sub: "焦虑/抑郁水平", detail: "5分钟", route: "/emotion-health", tag: "推荐" },
  { id: "midlife-awakening", emoji: "🧭", title: "中场觉醒力测评", sub: "6维度人生卡点", detail: "8分钟", route: "/midlife-awakening", tag: "热门" },
  { id: "wealth-block", emoji: "💰", title: "财富卡点测评", sub: "限制财富的信念", detail: "6分钟", route: "/wealth-block", tag: "新" },
  { id: "scl90", emoji: "🔬", title: "SCL-90 心理筛查", sub: "10因子临床级", detail: "15分钟", route: "/scl90", tag: null },
  { id: "women-competitiveness", emoji: "👑", title: "女性竞争力", sub: "独特优势与潜力", detail: "7分钟", route: "/assessment/women_competitiveness", tag: null },
  { id: "parent-ability", emoji: "🎯", title: "家长应对能力", sub: "养育风格与应对策略", detail: "5分钟", route: "/assessment/parent_ability", tag: "推荐" },
];

const tagMap: Record<string, string> = {
  "热门": "bg-rose-500/90 text-white",
  "推荐": "bg-emerald-500/90 text-white",
  "新": "bg-amber-500/90 text-white",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } } };

const MiniAppEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ── 顶部品牌 ── */}
      <div
        className="flex items-center gap-3 px-5 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)', paddingRight: '110px' }}
      >
        <img src={logoImage} alt="有劲AI" className="w-11 h-11 rounded-xl object-cover shadow-md flex-shrink-0" />
        <div>
          <h1 className="text-base font-bold text-foreground tracking-wide">有劲AI</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">每个人的生活教练</p>
        </div>
      </div>

      {/* ── 人群入口 3x2 ── */}
      <motion.div className="px-4 pb-5" variants={container} initial="hidden" animate="show">
        <div className="grid grid-cols-3 gap-2.5">
          {audiences.map((a) => (
            <motion.button
              key={a.id}
              variants={item}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(a.route)}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl p-3 pt-4 pb-3 border ${a.color} ${a.border} transition-shadow hover:shadow-md`}
            >
              <span className="text-3xl">{a.emoji}</span>
              <span className={`text-xs font-semibold ${a.accent}`}>{a.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{a.subtitle}</span>
              {a.tag && (
                <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${a.tagColor} text-white shadow-sm`}>
                  {a.tag}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── 日常工具 ── */}
      <div className="px-4 pb-5">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">日常工具</h2>
        </div>
        <motion.div className="grid grid-cols-3 gap-2" variants={container} initial="hidden" animate="show">
          {dailyTools.map((tool) => (
            <motion.button
              key={tool.id}
              variants={item}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(tool.route)}
              className="flex flex-col items-center gap-1 rounded-xl bg-card border border-border/50 p-2.5 py-3 transition-shadow hover:shadow-sm"
            >
              <span className="text-2xl">{tool.emoji}</span>
              <span className="text-[11px] font-semibold text-foreground">{tool.title}</span>
              <span className="text-[9px] text-muted-foreground leading-tight">{tool.desc}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* ── 专业测评 ── */}
      <div className="px-4 pb-8">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-sm">📋</span>
          <h2 className="text-sm font-bold text-foreground">专业测评</h2>
        </div>
        <motion.div className="flex flex-col gap-2" variants={container} initial="hidden" animate="show">
          {assessments.map((a) => (
            <motion.button
              key={a.id}
              variants={item}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(a.route)}
              className="flex items-center gap-3 rounded-xl bg-card border border-border/50 p-3 text-left transition-shadow hover:shadow-sm"
            >
              <span className="text-2xl flex-shrink-0">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{a.title}</span>
                  {a.tag && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tagMap[a.tag] || "bg-muted text-muted-foreground"}`}>
                      {a.tag}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">{a.sub}</span>
              </div>
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground flex-shrink-0">
                <Clock className="w-3 h-3" />
                {a.detail}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default MiniAppEntry;

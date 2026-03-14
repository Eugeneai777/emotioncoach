import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import logoImage from "@/assets/logo-youjin-ai.png";

const audiences = [
  { id: "mama", emoji: "👩‍👧", label: "宝妈专区", subtitle: "陪你一起带娃", route: "/mama", bg: "bg-gradient-to-br from-rose-50 to-pink-100/80", iconBg: "bg-rose-100", accent: "text-rose-700", tag: "热门", tagBg: "bg-rose-500" },
  { id: "workplace", emoji: "💼", label: "职场解压", subtitle: "压力·倦怠恢复", route: "/promo/synergy", bg: "bg-gradient-to-br from-sky-50 to-blue-100/80", iconBg: "bg-sky-100", accent: "text-sky-700", tag: "推荐", tagBg: "bg-sky-500" },
  { id: "couple", emoji: "💑", label: "情侣夫妻", subtitle: "亲密关系·沟通", route: "/us-ai", bg: "bg-gradient-to-br from-violet-50 to-purple-100/80", iconBg: "bg-violet-100", accent: "text-violet-700", tag: "热门", tagBg: "bg-violet-500" },
  { id: "youth", emoji: "🎓", label: "青少年", subtitle: "学业·情绪·自信", route: "/xiaojin", bg: "bg-gradient-to-br from-amber-50 to-orange-100/80", iconBg: "bg-amber-100", accent: "text-amber-700", tag: "新", tagBg: "bg-amber-500" },
  { id: "midlife", emoji: "🧭", label: "中年觉醒", subtitle: "转型·意义重建", route: "/laoge", bg: "bg-gradient-to-br from-orange-50 to-amber-100/80", iconBg: "bg-orange-100", accent: "text-orange-700", tag: null, tagBg: "" },
  { id: "senior", emoji: "🌿", label: "银发陪伴", subtitle: "长辈陪伴·关怀", route: "/elder-care", bg: "bg-gradient-to-br from-emerald-50 to-teal-100/80", iconBg: "bg-emerald-100", accent: "text-emerald-700", tag: "推荐", tagBg: "bg-emerald-500" },
];

const dailyTools = [
  { id: "emotion-button", emoji: "🆘", title: "情绪SOS", route: "/emotion-button" },
  { id: "alive-check", emoji: "💗", title: "安全守护", route: "/alive-check" },
  { id: "awakening", emoji: "📔", title: "觉察日记", route: "/awakening" },
  { id: "gratitude", emoji: "🌸", title: "感恩日记", route: "/gratitude" },
  { id: "breathing", emoji: "🧘", title: "呼吸练习", route: "/breathing" },
  { id: "declaration", emoji: "⚡", title: "能量宣言", route: "/declaration" },
];

const assessments = [
  { id: "emotion-health", emoji: "💚", title: "情绪健康测评", detail: "5分钟", route: "/emotion-health", tag: "推荐" },
  { id: "midlife-awakening", emoji: "🧭", title: "中场觉醒力测评", detail: "8分钟", route: "/midlife-awakening", tag: "热门" },
  { id: "wealth-block", emoji: "💰", title: "财富卡点测评", detail: "6分钟", route: "/wealth-block", tag: "新" },
  { id: "scl90", emoji: "🔬", title: "SCL-90 心理筛查", detail: "15分钟", route: "/scl90", tag: null },
  { id: "women-competitiveness", emoji: "👑", title: "女性竞争力", detail: "7分钟", route: "/assessment/women_competitiveness", tag: null },
  { id: "parent-ability", emoji: "🎯", title: "家长应对能力", detail: "5分钟", route: "/assessment/parent_ability", tag: "推荐" },
];

const tagColors: Record<string, string> = {
  "热门": "bg-rose-500",
  "推荐": "bg-emerald-500",
  "新": "bg-amber-500",
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.035 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 28 } },
};

const MiniAppEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-background to-background">
      {/* ── 顶部品牌区（适配小程序胶囊） ── */}
      <div
        className="flex items-center gap-2.5 px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 48px)", paddingRight: "110px" }}
      >
        <img src={logoImage} alt="有劲AI" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        <div>
          <h1 className="text-[15px] font-bold text-foreground">有劲AI</h1>
          <p className="text-[10px] text-muted-foreground">每个人的生活教练</p>
        </div>
      </div>

      {/* ── 人群入口 2x3 横向大卡 ── */}
      <motion.div className="px-3 pb-4" variants={stagger} initial="hidden" animate="show">
        <div className="grid grid-cols-2 gap-2.5">
          {audiences.map((a) => (
            <motion.button
              key={a.id}
              variants={fadeUp}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(a.route)}
              className={`relative flex items-center gap-2.5 rounded-2xl p-3 ${a.bg} text-left active:opacity-90 overflow-hidden`}
            >
              {/* icon */}
              <div className={`w-11 h-11 rounded-xl ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-[22px]">{a.emoji}</span>
              </div>
              {/* text */}
              <div className="flex-1 min-w-0">
                <span className={`text-[13px] font-bold ${a.accent} block truncate`}>{a.label}</span>
                <span className="text-[10px] text-muted-foreground block truncate mt-0.5">{a.subtitle}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
              {/* tag */}
              {a.tag && (
                <span className={`absolute top-0 right-0 text-[8px] font-semibold text-white px-2 py-0.5 rounded-bl-lg ${a.tagBg}`}>
                  {a.tag}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── 日常工具 横滑 ── */}
      <div className="px-3 pb-4">
        <h2 className="text-[13px] font-bold text-foreground mb-2 flex items-center gap-1">
          <span>🛠</span> 日常工具
        </h2>
        <motion.div
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-3 px-3"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {dailyTools.map((tool) => (
            <motion.button
              key={tool.id}
              variants={fadeUp}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(tool.route)}
              className="flex flex-col items-center gap-1.5 min-w-[64px] py-2.5 px-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-card border border-border/60 flex items-center justify-center shadow-sm">
                <span className="text-[22px]">{tool.emoji}</span>
              </div>
              <span className="text-[10px] font-medium text-foreground whitespace-nowrap">{tool.title}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* ── 专业测评 列表 ── */}
      <div className="px-3 pb-6">
        <h2 className="text-[13px] font-bold text-foreground mb-2 flex items-center gap-1">
          <span>📋</span> 专业测评
        </h2>
        <motion.div
          className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/40"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {assessments.map((a) => (
            <motion.button
              key={a.id}
              variants={fadeUp}
              whileTap={{ backgroundColor: "rgba(0,0,0,0.02)" }}
              onClick={() => navigate(a.route)}
              className="flex items-center gap-3 w-full px-3.5 py-3 text-left active:bg-muted/30"
            >
              <span className="text-xl flex-shrink-0">{a.emoji}</span>
              <span className="text-[13px] font-medium text-foreground flex-1 truncate">{a.title}</span>
              {a.tag && (
                <span className={`text-[9px] font-semibold text-white px-1.5 py-0.5 rounded-full ${tagColors[a.tag] || "bg-muted"}`}>
                  {a.tag}
                </span>
              )}
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground flex-shrink-0">
                <Clock className="w-3 h-3" />
                {a.detail}
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* safe area bottom */}
      <div style={{ height: "env(safe-area-inset-bottom, 16px)" }} />
    </div>
  );
};

export default MiniAppEntry;

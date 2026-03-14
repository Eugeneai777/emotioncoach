import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoImage from "@/assets/logo-youjin-ai.png";

const audiences = [
  {
    id: "mama",
    emoji: "👩‍👧",
    label: "宝妈专区",
    subtitle: "陪你一起带娃",
    route: "/mama",
    gradient: "from-rose-400 to-pink-500",
    tag: "热门",
  },
  {
    id: "workplace",
    emoji: "💼",
    label: "职场解压",
    subtitle: "压力·倦怠恢复",
    route: "/promo/synergy",
    gradient: "from-blue-400 to-indigo-500",
    tag: "推荐",
  },
  {
    id: "couple",
    emoji: "💑",
    label: "情侣夫妻",
    subtitle: "亲密关系·沟通",
    route: "/us-ai",
    gradient: "from-purple-400 to-violet-500",
    tag: "热门",
  },
  {
    id: "youth",
    emoji: "🎓",
    label: "青少年",
    subtitle: "学业·情绪·自信",
    route: "/xiaojin",
    gradient: "from-amber-400 to-orange-500",
    tag: "新",
  },
  {
    id: "midlife",
    emoji: "🧭",
    label: "中年觉醒",
    subtitle: "转型·意义重建",
    route: "/laoge",
    gradient: "from-amber-500 to-yellow-600",
    tag: null,
  },
  {
    id: "senior",
    emoji: "🌿",
    label: "银发陪伴",
    subtitle: "长辈陪伴·关怀",
    route: "/elder-care",
    gradient: "from-emerald-400 to-teal-500",
    tag: "推荐",
  },
];

const dailyTools = [
  { id: "emotion-button", emoji: "🆘", title: "情绪SOS按钮", desc: "崩溃时按一下，3分钟恢复平静", route: "/emotion-button" },
  { id: "alive-check", emoji: "💗", title: "每日安全守护", desc: "每日确认平安，守护你在乎的人", route: "/alive-check" },
  { id: "awakening", emoji: "📔", title: "觉察日记", desc: "AI陪你写日记，看见情绪变化", route: "/awakening" },
  { id: "gratitude", emoji: "🌸", title: "感恩日记", desc: "记录美好，提升幸福感", route: "/gratitude" },
  { id: "breathing", emoji: "🧘", title: "呼吸练习", desc: "科学呼吸法，快速减压", route: "/breathing" },
  { id: "declaration", emoji: "⚡", title: "能量宣言卡", desc: "给自己一句有力量的话", route: "/declaration" },
];

const assessments = [
  { id: "emotion-health", emoji: "💚", title: "情绪健康测评", sub: "焦虑/抑郁水平", detail: "5分钟", route: "/emotion-health", tag: "推荐" },
  { id: "midlife-awakening", emoji: "🧭", title: "中场觉醒力测评", sub: "6维度人生卡点", detail: "8分钟", route: "/midlife-awakening", tag: "热门" },
  { id: "wealth-block", emoji: "💰", title: "财富卡点测评", sub: "限制财富的信念", detail: "6分钟", route: "/wealth-block", tag: "新" },
  { id: "scl90", emoji: "🔬", title: "SCL-90 心理筛查", sub: "10因子临床级", detail: "15分钟", route: "/scl90", tag: null },
  { id: "women-competitiveness", emoji: "👑", title: "女性竞争力", sub: "独特优势与潜力", detail: "7分钟", route: "/assessment/women_competitiveness", tag: null },
  { id: "parent-ability", emoji: "🎯", title: "家长应对能力", sub: "养育风格与应对策略", detail: "5分钟", route: "/assessment/parent_ability", tag: "推荐" },
];

const tagGradients: Record<string, string> = {
  "热门": "from-red-400 to-rose-500",
  "推荐": "from-emerald-400 to-teal-500",
  "新": "from-amber-400 to-orange-500",
};

const MiniAppEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background relative overflow-x-hidden">
      {/* 装饰性光晕 */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/20 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-16 w-40 h-40 rounded-full bg-gradient-to-br from-rose-200/30 to-pink-200/10 blur-3xl pointer-events-none" />

      {/* 顶部品牌区 — 适配微信小程序胶囊按钮 */}
      <div
        className="flex items-center gap-3 pb-5 px-5 relative z-10"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)',
          paddingRight: '110px',
        }}
      >
        <img
          src={logoImage}
          alt="有劲AI"
          className="w-12 h-12 rounded-full object-cover shadow-md flex-shrink-0"
        />
        <div>
          <h1 className="text-base font-bold text-foreground tracking-wide">
            有劲AI
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            每个人的生活教练
          </p>
        </div>
      </div>

      {/* 6 个人群入口 2x3 */}
      <div className="px-4 pb-6 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          {audiences.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -3 }}
              onClick={() => navigate(a.route)}
              className="relative flex items-center gap-3 rounded-2xl p-4 bg-background/60 backdrop-blur-md border border-border/40 shadow-sm overflow-hidden text-left transition-shadow hover:shadow-md"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${a.gradient}`} />
              <span className="text-5xl flex-shrink-0 ml-1">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-foreground block truncate">{a.label}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">{a.subtitle}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              {a.tag && (
                <Badge className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 border-0 bg-gradient-to-r ${a.gradient} text-white font-medium`}>
                  {a.tag}
                </Badge>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══ 日常工具 ═══ */}
      <div className="px-4 pb-6 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🛠</span>
          <h2 className="text-sm font-bold text-foreground">日常工具</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {dailyTools.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 + i * 0.05, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(tool.route)}
              className="flex items-center gap-2.5 rounded-2xl p-3 bg-background/60 backdrop-blur-md border border-border/40 shadow-sm text-left transition-shadow hover:shadow-md"
            >
              <span className="text-2xl flex-shrink-0">{tool.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-foreground block truncate">{tool.title}</span>
                <span className="text-[10px] text-muted-foreground block truncate">{tool.desc}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══ 专业测评 ═══ */}
      <div className="px-4 pb-10 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📋</span>
          <h2 className="text-sm font-bold text-foreground">专业测评</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {assessments.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.66 + i * 0.05, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(a.route)}
              className="relative flex flex-col items-start rounded-2xl p-3 bg-background/60 backdrop-blur-md border border-border/40 shadow-sm text-left transition-shadow hover:shadow-md overflow-hidden"
            >
              <span className="text-2xl mb-1.5">{a.emoji}</span>
              <span className="text-xs font-bold text-foreground block truncate w-full">{a.title}</span>
              <span className="text-[10px] text-muted-foreground block truncate w-full">{a.sub}</span>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/70">
                <Clock className="w-3 h-3" />
                <span>{a.detail}</span>
              </div>
              {a.tag && (
                <Badge className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 border-0 bg-gradient-to-r ${tagGradients[a.tag] || "from-gray-400 to-gray-500"} text-white font-medium`}>
                  {a.tag}
                </Badge>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MiniAppEntry;

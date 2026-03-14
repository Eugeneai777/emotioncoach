import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoImage from "@/assets/logo-youjin-ai.png";

const audiences = [
  { id: "mama", emoji: "👩‍👧", label: "宝妈专区", subtitle: "陪你一起带娃", route: "/mama", gradient: "from-rose-500/90 to-pink-600/90", glow: "shadow-rose-500/25", tag: "热门" },
  { id: "workplace", emoji: "💼", label: "职场解压", subtitle: "压力·倦怠恢复", route: "/promo/synergy", gradient: "from-blue-500/90 to-indigo-600/90", glow: "shadow-blue-500/25", tag: "推荐" },
  { id: "couple", emoji: "💑", label: "情侣夫妻", subtitle: "亲密关系·沟通", route: "/us-ai", gradient: "from-purple-500/90 to-violet-600/90", glow: "shadow-purple-500/25", tag: "热门" },
  { id: "youth", emoji: "🎓", label: "青少年", subtitle: "学业·情绪·自信", route: "/xiaojin", gradient: "from-amber-500/90 to-orange-600/90", glow: "shadow-amber-500/25", tag: "新" },
  { id: "midlife", emoji: "🧭", label: "中年觉醒", subtitle: "转型·意义重建", route: "/laoge", gradient: "from-yellow-500/90 to-amber-600/90", glow: "shadow-yellow-500/25", tag: null },
  { id: "senior", emoji: "🌿", label: "银发陪伴", subtitle: "长辈陪伴·关怀", route: "/elder-care", gradient: "from-emerald-500/90 to-teal-600/90", glow: "shadow-emerald-500/25", tag: "推荐" },
];

const dailyTools = [
  { id: "emotion-button", emoji: "🆘", title: "情绪SOS按钮", desc: "崩溃时按一下，3分钟恢复平静", route: "/emotion-button", gradient: "from-orange-500/80 to-red-600/80", glow: "shadow-orange-500/20" },
  { id: "alive-check", emoji: "💗", title: "每日安全守护", desc: "每日确认平安，守护你在乎的人", route: "/alive-check", gradient: "from-rose-500/80 to-pink-600/80", glow: "shadow-rose-500/20" },
  { id: "awakening", emoji: "📔", title: "觉察日记", desc: "AI陪你写日记，看见情绪变化", route: "/awakening", gradient: "from-violet-500/80 to-purple-600/80", glow: "shadow-violet-500/20" },
  { id: "gratitude", emoji: "🌸", title: "感恩日记", desc: "记录美好，提升幸福感", route: "/gratitude", gradient: "from-pink-500/80 to-fuchsia-600/80", glow: "shadow-pink-500/20" },
  { id: "breathing", emoji: "🧘", title: "呼吸练习", desc: "科学呼吸法，快速减压", route: "/breathing", gradient: "from-cyan-500/80 to-teal-600/80", glow: "shadow-cyan-500/20" },
  { id: "declaration", emoji: "⚡", title: "能量宣言卡", desc: "给自己一句有力量的话", route: "/declaration", gradient: "from-amber-400/80 to-yellow-600/80", glow: "shadow-amber-500/20" },
];

const assessments = [
  { id: "emotion-health", emoji: "💚", title: "情绪健康测评", sub: "焦虑/抑郁水平", detail: "5分钟", route: "/emotion-health", tag: "推荐", gradient: "from-emerald-500/80 to-green-600/80", glow: "shadow-emerald-500/20" },
  { id: "midlife-awakening", emoji: "🧭", title: "中场觉醒力测评", sub: "6维度人生卡点", detail: "8分钟", route: "/midlife-awakening", tag: "热门", gradient: "from-amber-500/80 to-orange-600/80", glow: "shadow-amber-500/20" },
  { id: "wealth-block", emoji: "💰", title: "财富卡点测评", sub: "限制财富的信念", detail: "6分钟", route: "/wealth-block", tag: "新", gradient: "from-yellow-400/80 to-amber-600/80", glow: "shadow-yellow-500/20" },
  { id: "scl90", emoji: "🔬", title: "SCL-90 心理筛查", sub: "10因子临床级", detail: "15分钟", route: "/scl90", tag: null, gradient: "from-sky-500/80 to-blue-600/80", glow: "shadow-sky-500/20" },
  { id: "women-competitiveness", emoji: "👑", title: "女性竞争力", sub: "独特优势与潜力", detail: "7分钟", route: "/assessment/women_competitiveness", tag: null, gradient: "from-fuchsia-500/80 to-purple-600/80", glow: "shadow-fuchsia-500/20" },
  { id: "parent-ability", emoji: "🎯", title: "家长应对能力", sub: "养育风格与应对策略", detail: "5分钟", route: "/assessment/parent_ability", tag: "推荐", gradient: "from-teal-500/80 to-cyan-600/80", glow: "shadow-teal-500/20" },
];

const tagStyles: Record<string, string> = {
  "热门": "bg-red-500 shadow-red-500/40 shadow-sm",
  "推荐": "bg-emerald-500 shadow-emerald-500/40 shadow-sm",
  "新": "bg-amber-500 shadow-amber-500/40 shadow-sm",
};

const MiniAppEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* 装饰性霓虹光晕 */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-purple-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute top-60 -left-24 w-64 h-64 rounded-full bg-rose-600/15 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-40 right-0 w-72 h-72 rounded-full bg-blue-600/10 blur-[90px] pointer-events-none" />

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
          className="w-12 h-12 rounded-full object-cover shadow-lg shadow-purple-500/20 ring-1 ring-white/10 flex-shrink-0"
        />
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">
            有劲AI
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            每个人的生活教练
          </p>
        </div>
      </div>

      {/* 6 个人群入口 2x3 */}
      <div className="px-4 pb-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {audiences.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -3 }}
              onClick={() => navigate(a.route)}
              className={`relative flex items-center gap-3 rounded-2xl p-4 bg-gradient-to-br ${a.gradient} shadow-lg ${a.glow} overflow-hidden text-left transition-all hover:shadow-xl`}
            >
              <span className="text-4xl flex-shrink-0 drop-shadow-lg">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-white block truncate">{a.label}</span>
                <span className="text-[11px] text-white/70 mt-0.5 block truncate">{a.subtitle}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
              {a.tag && (
                <Badge className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 border-0 ${tagStyles[a.tag] || "bg-gray-500"} text-white font-medium`}>
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
          <h2 className="text-sm font-bold text-white/90">日常工具</h2>
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
              className={`flex items-center gap-2.5 rounded-2xl p-3 bg-gradient-to-br ${tool.gradient} shadow-lg ${tool.glow} text-left transition-all hover:shadow-xl`}
            >
              <span className="text-2xl flex-shrink-0 drop-shadow-md">{tool.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block truncate">{tool.title}</span>
                <span className="text-[10px] text-white/60 block truncate">{tool.desc}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══ 专业测评 ═══ */}
      <div className="px-4 pb-10 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📋</span>
          <h2 className="text-sm font-bold text-white/90">专业测评</h2>
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
              className={`relative flex flex-col items-start rounded-2xl p-3 bg-gradient-to-br ${a.gradient} shadow-lg ${a.glow} text-left transition-all hover:shadow-xl overflow-hidden`}
            >
              <span className="text-2xl mb-1.5 drop-shadow-md">{a.emoji}</span>
              <span className="text-xs font-bold text-white block truncate w-full">{a.title}</span>
              <span className="text-[10px] text-white/60 block truncate w-full">{a.sub}</span>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-white/40">
                <Clock className="w-3 h-3" />
                <span>{a.detail}</span>
              </div>
              {a.tag && (
                <Badge className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 border-0 ${tagStyles[a.tag] || "bg-gray-500"} text-white font-medium`}>
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
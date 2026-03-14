import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoImage from "@/assets/logo-youjin-ai.png";

const audiences = [
  { id: "mama", emoji: "👩‍👧", label: "宝妈专区", subtitle: "陪你一起带娃", route: "/mama", accent: "border-rose-400/30", tag: "热门", tagColor: "bg-rose-500/80" },
  { id: "workplace", emoji: "💼", label: "职场解压", subtitle: "压力·倦怠恢复", route: "/promo/synergy", accent: "border-blue-400/30", tag: "推荐", tagColor: "bg-blue-500/80" },
  { id: "couple", emoji: "💑", label: "情侣夫妻", subtitle: "亲密关系·沟通", route: "/us-ai", accent: "border-purple-400/30", tag: "热门", tagColor: "bg-purple-500/80" },
  { id: "youth", emoji: "🎓", label: "青少年", subtitle: "学业·情绪·自信", route: "/xiaojin", accent: "border-amber-400/30", tag: "新", tagColor: "bg-amber-500/80" },
  { id: "midlife", emoji: "🧭", label: "中年觉醒", subtitle: "转型·意义重建", route: "/laoge", accent: "border-yellow-400/30", tag: null, tagColor: "" },
  { id: "senior", emoji: "🌿", label: "银发陪伴", subtitle: "长辈陪伴·关怀", route: "/elder-care", accent: "border-emerald-400/30", tag: "推荐", tagColor: "bg-emerald-500/80" },
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
  { id: "emotion-health", emoji: "💚", title: "情绪健康测评", sub: "焦虑/抑郁水平", detail: "5分钟", route: "/emotion-health", tag: "推荐", tagColor: "bg-emerald-500/80" },
  { id: "midlife-awakening", emoji: "🧭", title: "中场觉醒力测评", sub: "6维度人生卡点", detail: "8分钟", route: "/midlife-awakening", tag: "热门", tagColor: "bg-rose-500/80" },
  { id: "wealth-block", emoji: "💰", title: "财富卡点测评", sub: "限制财富的信念", detail: "6分钟", route: "/wealth-block", tag: "新", tagColor: "bg-amber-500/80" },
  { id: "scl90", emoji: "🔬", title: "SCL-90 心理筛查", sub: "10因子临床级", detail: "15分钟", route: "/scl90", tag: null, tagColor: "" },
  { id: "women-competitiveness", emoji: "👑", title: "女性竞争力", sub: "独特优势与潜力", detail: "7分钟", route: "/assessment/women_competitiveness", tag: null, tagColor: "" },
  { id: "parent-ability", emoji: "🎯", title: "家长应对能力", sub: "养育风格与应对策略", detail: "5分钟", route: "/assessment/parent_ability", tag: "推荐", tagColor: "bg-emerald-500/80" },
];

/* 毛玻璃卡片通用样式 */
const glassCard = "bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-2xl transition-all hover:bg-white/[0.10] hover:border-white/[0.12]";

const MiniAppEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f14] relative overflow-x-hidden">
      {/* 背景光晕 — 柔和不抢眼 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-gradient-to-b from-purple-900/20 via-violet-900/10 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute top-[60%] -left-20 w-60 h-60 rounded-full bg-rose-900/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-48 h-48 rounded-full bg-blue-900/10 blur-[70px] pointer-events-none" />

      {/* 顶部品牌区 */}
      <div
        className="flex items-center gap-3 pb-6 px-5 relative z-10"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)',
          paddingRight: '110px',
        }}
      >
        <img
          src={logoImage}
          alt="有劲AI"
          className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
        />
        <div>
          <h1 className="text-base font-bold text-white/95 tracking-wide">
            有劲AI
          </h1>
          <p className="text-[11px] text-white/40 mt-0.5">
            每个人的生活教练
          </p>
        </div>
      </div>

      {/* 6 个人群入口 */}
      <div className="px-4 pb-7 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {audiences.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 24 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.route)}
              className={`relative flex items-center gap-3 p-3.5 ${glassCard} ${a.accent} text-left overflow-hidden`}
            >
              <span className="text-[38px] flex-shrink-0 leading-none">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-white/90 block truncate">{a.label}</span>
                <span className="text-[11px] text-white/40 mt-0.5 block truncate">{a.subtitle}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
              {a.tag && (
                <Badge className={`absolute top-2 right-2 text-[9px] px-1.5 py-0 h-[18px] border-0 ${a.tagColor} text-white font-medium backdrop-blur-sm`}>
                  {a.tag}
                </Badge>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 分割线 */}
      <div className="mx-4 mb-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ═══ 日常工具 ═══ */}
      <div className="px-4 pb-7 relative z-10">
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <span className="text-sm">🛠</span>
          <h2 className="text-[13px] font-semibold text-white/70 tracking-wide">日常工具</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {dailyTools.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.04, type: "spring", stiffness: 280, damping: 24 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(tool.route)}
              className={`flex flex-col items-center gap-1.5 py-3.5 px-2 ${glassCard} text-center`}
            >
              <span className="text-2xl">{tool.emoji}</span>
              <span className="text-[11px] font-medium text-white/80 leading-tight">{tool.title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 分割线 */}
      <div className="mx-4 mb-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ═══ 专业测评 ═══ */}
      <div className="px-4 pb-12 relative z-10">
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <span className="text-sm">📋</span>
          <h2 className="text-[13px] font-semibold text-white/70 tracking-wide">专业测评</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {assessments.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.04, type: "spring", stiffness: 280, damping: 24 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.route)}
              className={`relative flex flex-col items-start p-3 ${glassCard} text-left overflow-hidden`}
            >
              <span className="text-xl mb-1.5">{a.emoji}</span>
              <span className="text-[12px] font-semibold text-white/85 block truncate w-full">{a.title}</span>
              <span className="text-[10px] text-white/35 block truncate w-full mt-0.5">{a.sub}</span>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-white/25">
                <Clock className="w-3 h-3" />
                <span>{a.detail}</span>
              </div>
              {a.tag && (
                <Badge className={`absolute top-2 right-2 text-[9px] px-1.5 py-0 h-[18px] border-0 ${a.tagColor} text-white font-medium backdrop-blur-sm`}>
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
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageCircle, Heart, Zap, GraduationCap, Package, Users, Brain, Target, MessagesSquare, Star, Pen, Eye, Bot, UserCheck, ChevronDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

const audiences = [
  { emoji: "👩‍👧", label: "宝妈专区", route: "/mama", desc: "情绪日记·SOS·AI陪聊", gradient: "from-rose-400 to-pink-500" },
  { emoji: "💼", label: "职场解压", route: "/workplace", desc: "压力释放·倦怠恢复", gradient: "from-blue-400 to-indigo-500" },
  { emoji: "💑", label: "情侣夫妻", route: "/us-ai", desc: "沟通翻译·冲突修复", gradient: "from-purple-400 to-violet-500" },
  { emoji: "🎓", label: "青少年", route: "/xiaojin", desc: "心情探索·天赋发现", gradient: "from-amber-400 to-orange-500" },
  { emoji: "🧭", label: "中年觉醒", route: "/laoge", desc: "决策分析·方向探索", gradient: "from-amber-500 to-yellow-600" },
  { emoji: "🌿", label: "银发陪伴", route: "/elder-care", desc: "每日问候·心情记录", gradient: "from-emerald-400 to-teal-500" },
];

const supportLayers = [
  { step: "1", icon: Pen, label: "轻记录入口", tagline: "30秒写下状态", desc: "选择关键词或一句话，门槛极低，随时随地记录", color: "text-amber-600 dark:text-amber-400", accent: "bg-amber-500", ring: "ring-amber-200 dark:ring-amber-800", bg: "from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20" },
  { step: "2", icon: Eye, label: "智能看见", tagline: "AI即时反馈", desc: "看见情绪 → 正常化 → 发现盲点 → 新角度 → 微行动", color: "text-blue-600 dark:text-blue-400", accent: "bg-blue-500", ring: "ring-blue-200 dark:ring-blue-800", bg: "from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20" },
  { step: "3", icon: Bot, label: "AI教练深聊", tagline: "6大专属教练", desc: "情绪·感恩·行动·选择·关系·方向，随时深入对话", color: "text-purple-600 dark:text-purple-400", accent: "bg-purple-500", ring: "ring-purple-200 dark:ring-purple-800", bg: "from-purple-50 to-violet-50/50 dark:from-purple-950/30 dark:to-violet-950/20" },
  { step: "4", icon: UserCheck, label: "真人教练 + 训练营", tagline: "持续陪伴", desc: "21天结构化训练 + 专业教练，陪你走出困境", color: "text-teal-600 dark:text-teal-400", accent: "bg-teal-500", ring: "ring-teal-200 dark:ring-teal-800", bg: "from-teal-50 to-emerald-50/50 dark:from-teal-950/30 dark:to-emerald-950/20" },
];

const outcomes = [
  { icon: Brain, label: "看清情绪模式", desc: "发现反复困住你的反应模式", gradient: "from-rose-100 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20", iconBg: "bg-rose-500" },
  { icon: Target, label: "想到就能做到", desc: "每次记录都带一个微行动", gradient: "from-amber-100 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20", iconBg: "bg-amber-500" },
  { icon: MessagesSquare, label: "改善沟通方式", desc: "表达真实想法而不伤人", gradient: "from-blue-100 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/20", iconBg: "bg-blue-500" },
  { icon: Star, label: "找到人生方向", desc: "在记录中看清自己的主线", gradient: "from-violet-100 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20", iconBg: "bg-violet-500" },
];

const AwakeningSystemIntro = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="关于有劲AI" />

      <div className="pb-24 max-w-lg mx-auto">

        {/* ═══ 核心理念区 ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="px-5 pt-2 pb-6 text-center"
        >
          <h2 className="text-lg font-bold text-foreground mb-2 leading-snug tracking-tight">
            生活不易，你不必独自扛着
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            有劲AI是一套基于领导力的生活教练系统。<br />
            通过频繁记录情绪、想法和行动，<br />
            帮你看清自己的模式，找到改变的切入点。
          </p>
          {/* 核心金句卡片 */}
          <div className="relative mx-auto max-w-xs">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-2xl blur-xl" />
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl px-5 py-4">
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
              <p className="text-sm font-bold text-foreground tracking-wide">
                「频繁记录自己，可以改命」
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══ 渐变分隔 ═══ */}
        <div className="h-2 bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* ═══ 四层支持系统 — 编号卡片式 ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="px-5 py-6"
        >
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            🏰 四层支持系统
          </h3>
          <div className="space-y-3">
            {supportLayers.map((layer, i) => (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <div className={`relative flex gap-4 p-4 rounded-2xl bg-gradient-to-br ${layer.bg} border border-border/30`}>
                  {/* 大号步骤编号 */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl ${layer.accent} flex items-center justify-center shadow-sm`}>
                      <span className="text-lg font-black text-white">{layer.step}</span>
                    </div>
                  </div>
                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <layer.icon className={`w-4 h-4 ${layer.color} flex-shrink-0`} />
                      <span className="text-sm font-bold text-foreground">{layer.label}</span>
                    </div>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${layer.accent}/10 ${layer.color} font-medium mb-1.5`}>
                      {layer.tagline}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
                {/* 连接箭头 */}
                {i < supportLayers.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ 渐变分隔 ═══ */}
        <div className="h-2 bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* ═══ 你会收获 — 全宽图标卡片 ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-5 py-6 bg-muted/20"
        >
          <h3 className="text-base font-bold text-foreground mb-4">🎯 你会收获</h3>
          <div className="space-y-2.5">
            {outcomes.map((o) => (
              <div key={o.label} className={`flex items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-r ${o.gradient} border border-border/30`}>
                <div className={`w-10 h-10 rounded-xl ${o.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <o.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{o.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══ 渐变分隔 ═══ */}
        <div className="h-2 bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* ═══ 六大人群入口 — 2列紧凑网格 ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="px-5 py-6"
        >
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            六大专属入口
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {audiences.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                onClick={() => navigate(a.route)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card border border-border/40 cursor-pointer active:scale-[0.96] transition-transform text-center"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-sm`}>
                  <span className="text-lg">{a.emoji}</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{a.label}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ 渐变分隔 ═══ */}
        <div className="h-2 bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* ═══ 结尾 ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center px-5 py-8"
        >
          <p className="text-sm text-muted-foreground mb-5">有劲AI，陪你过好每一天 ✨</p>
          <Button onClick={() => navigate("/mini-app")} className="rounded-full px-8 shadow-md">
            返回主页
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AwakeningSystemIntro;

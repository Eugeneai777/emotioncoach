import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Pen, Eye, Bot, UserCheck, Brain, Target, MessagesSquare, Star, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo-youjin-ai.png";

const audiences = [
  { emoji: "👩‍👧", label: "宝妈", route: "/mama", gradient: "from-rose-400 to-pink-500" },
  { emoji: "💼", label: "职场", route: "/workplace", gradient: "from-blue-400 to-indigo-500" },
  { emoji: "💑", label: "情侣", route: "/us-ai", gradient: "from-purple-400 to-violet-500" },
  { emoji: "🎓", label: "青少年", route: "/xiaojin", gradient: "from-amber-400 to-orange-500" },
  { emoji: "🧭", label: "中年", route: "/laoge", gradient: "from-amber-500 to-yellow-600" },
  { emoji: "🌿", label: "银发", route: "/elder-care", gradient: "from-emerald-400 to-teal-500" },
];

const supportLayers = [
  { icon: Pen, label: "轻记录", desc: "30秒写下状态，门槛极低", color: "text-amber-600 dark:text-amber-400", accent: "bg-amber-500" },
  { icon: Eye, label: "AI看见", desc: "即时反馈，发现盲点", color: "text-blue-600 dark:text-blue-400", accent: "bg-blue-500" },
  { icon: Bot, label: "AI深聊", desc: "6大专属教练，随时对话", color: "text-purple-600 dark:text-purple-400", accent: "bg-purple-500" },
  { icon: UserCheck, label: "真人陪伴", desc: "训练营 + 专业教练", color: "text-teal-600 dark:text-teal-400", accent: "bg-teal-500" },
];

const outcomes = [
  { icon: Brain, label: "看清情绪模式", iconColor: "text-rose-500" },
  { icon: Target, label: "想到就能做到", iconColor: "text-amber-500" },
  { icon: MessagesSquare, label: "改善沟通方式", iconColor: "text-blue-500" },
  { icon: Star, label: "找到人生方向", iconColor: "text-violet-500" },
];

const AwakeningSystemIntro = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="关于有劲AI" />

      <div className="pb-24 max-w-lg mx-auto">

        {/* ═══ Hero ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="px-6 pt-4 pb-5 text-center"
        >
          <img src={logoImage} alt="有劲AI" className="w-14 h-14 rounded-2xl mx-auto mb-3 shadow-md" />
          <h2 className="text-xl font-extrabold text-foreground mb-2">
            生活不易，你不必独自扛着
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            有劲AI 是你的 AI 生活教练<br />
            帮你觉察情绪、理清想法、付诸行动
          </p>
        </motion.div>

        {/* ═══ 金句 ═══ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="px-6 pb-6"
        >
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl px-5 py-4 text-center">
            <p className="text-base font-bold text-foreground">
              ✨ 看见自己，就是改变的开始
            </p>
          </div>
        </motion.div>

        {/* ═══ 四层系统 — 横向紧凑 ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 pb-6"
        >
          <h3 className="text-base font-bold text-foreground mb-3">🏰 四层支持</h3>
          <div className="grid grid-cols-2 gap-2">
            {supportLayers.map((layer, i) => (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border/40"
              >
                <div className={`w-8 h-8 rounded-lg ${layer.accent} flex items-center justify-center flex-shrink-0`}>
                  <layer.icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight">{layer.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{layer.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ 你会收获 — 单行横排 ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="px-6 pb-6"
        >
          <h3 className="text-base font-bold text-foreground mb-3">🎯 你会收获</h3>
          <div className="grid grid-cols-2 gap-2">
            {outcomes.map((o) => (
              <div key={o.label} className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/30">
                <o.icon className={`w-5 h-5 ${o.iconColor} flex-shrink-0`} />
                <span className="text-sm font-medium text-foreground">{o.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══ 人群入口 — 3列紧凑 ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-6 pb-6"
        >
          <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            六大专属入口
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {audiences.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + i * 0.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(a.route)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br ${a.gradient} shadow-sm`}
              >
                <span className="text-lg">{a.emoji}</span>
                <span className="text-xs font-bold text-white">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══ CTA ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center px-6 pb-8"
        >
          <Button onClick={() => navigate("/mini-app")} className="rounded-full px-8 shadow-md gap-2">
            开始使用 <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">有劲AI，陪你过好每一天 ✨</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AwakeningSystemIntro;

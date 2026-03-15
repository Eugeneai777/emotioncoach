import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageCircle, Heart, Zap, GraduationCap, Package, Users, Brain, Target, MessagesSquare, Star, Pen, Eye, Bot, UserCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import logoImage from "@/assets/logo-youjin-ai.png";
import { Button } from "@/components/ui/button";

const audiences = [
  { emoji: "👩‍👧", label: "宝妈专区", route: "/mama", border: "border-l-rose-400", desc: "情绪日记、情绪SOS、AI陪聊，记录你的每一份辛苦" },
  { emoji: "💼", label: "职场解压", route: "/promo/synergy", border: "border-l-blue-400", desc: "压力释放、倦怠恢复，给自己一个喘息的空间" },
  { emoji: "💑", label: "情侣夫妻", route: "/us-ai", border: "border-l-purple-400", desc: "沟通翻译、冲突修复、每日对话，让爱被听见" },
  { emoji: "🎓", label: "青少年", route: "/xiaojin", border: "border-l-amber-400", desc: "心情探索、天赋发现、未来方向，陪你一起长大" },
  { emoji: "🧭", label: "中年觉醒", route: "/laoge", border: "border-l-orange-400", desc: "决策分析、职业规划、方向探索，想清楚再出发" },
  { emoji: "🌿", label: "银发陪伴", route: "/elder-care", border: "border-l-emerald-400", desc: "每日问候、吃药提醒、心情记录，每天陪您聊聊天" },
];

const quickTools = [
  { icon: Heart, label: "情绪按钮", desc: "随时记录你的情绪状态" },
  { icon: Zap, label: "安全守护", desc: "关心你在不在的安心功能" },
  { icon: GraduationCap, label: "学习课程", desc: "视频课程助你成长" },
  { icon: Package, label: "产品中心", desc: "查看全部服务与训练营" },
  { icon: Users, label: "教练空间", desc: "与真人教练连接" },
  { icon: MessageCircle, label: "建议反馈", desc: "告诉我们你的想法" },
];

const supportLayers = [
  { step: "①", icon: Pen, label: "轻记录入口", tagline: "30秒写下状态", desc: "选择关键词或一句话，门槛极低，随时随地记录", color: "text-amber-500", accent: "bg-amber-500", bg: "bg-amber-50/80 dark:bg-amber-950/20" },
  { step: "②", icon: Eye, label: "智能看见", tagline: "AI即时反馈", desc: "看见情绪 → 正常化 → 发现盲点 → 新角度 → 微行动", color: "text-blue-500", accent: "bg-blue-500", bg: "bg-blue-50/80 dark:bg-blue-950/20" },
  { step: "③", icon: Bot, label: "AI教练深聊", tagline: "6大专属教练", desc: "情绪·感恩·行动·选择·关系·方向，随时深入对话", color: "text-purple-500", accent: "bg-purple-500", bg: "bg-purple-50/80 dark:bg-purple-950/20" },
  { step: "④", icon: UserCheck, label: "真人教练 + 训练营", tagline: "持续陪伴", desc: "21天结构化训练 + 专业教练，陪你走出困境", color: "text-teal-500", accent: "bg-teal-500", bg: "bg-teal-50/80 dark:bg-teal-950/20" },
];

const outcomes = [
  { icon: Brain, label: "看清情绪模式", desc: "发现反复困住你的反应模式" },
  { icon: Target, label: "想到就能做到", desc: "每次记录都带一个微行动" },
  { icon: MessagesSquare, label: "改善沟通方式", desc: "表达真实想法而不伤人" },
  { icon: Star, label: "找到人生方向", desc: "在记录中看清自己的主线" },
];

const AwakeningSystemIntro = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30">
      <PageHeader title="关于有劲AI" />

      <div className="px-4 pb-24 max-w-lg mx-auto">
        {/* 品牌区 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pt-6 pb-2"
        >
          <img src={logoImage} alt="有劲AI" className="w-14 h-14 rounded-2xl object-cover mb-2" />
          <h1 className="text-xl font-bold text-foreground">有劲AI</h1>
          <p className="text-sm text-muted-foreground mt-0.5">每个人的生活教练</p>
        </motion.div>

        {/* 核心理念 + 是什么（合并为一个紧凑区域） */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-center mb-5 px-2"
        >
          <h2 className="text-base font-semibold text-foreground mb-1.5">生活不易，你不必独自扛着</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            有劲AI是一套基于心理学的生活教练系统。通过频繁记录情绪、想法和行动，帮你看清自己的模式，打破自动驾驶，找到改变的切入点。
          </p>
          <p className="text-xs font-semibold text-foreground mt-2 inline-block px-3 py-1 rounded-full bg-primary/10">
            「频繁记录自己，可以改命」
          </p>
        </motion.div>

        {/* 四层支持系统 — 垂直时间线风格 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            🏰 四层支持系统
          </h3>
          <div className="relative pl-4">
            {/* 竖线 */}
            <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
            <div className="space-y-3">
              {supportLayers.map((layer, i) => (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  className="relative"
                >
                  {/* 节点圆点 */}
                  <div className={`absolute -left-4 top-3 w-3 h-3 rounded-full ${layer.accent} ring-2 ring-background z-10`} />
                  <div className={`ml-3 p-3 rounded-xl ${layer.bg} border border-border/40`}>
                    <div className="flex items-center gap-2 mb-1">
                      <layer.icon className={`w-4 h-4 ${layer.color} flex-shrink-0`} />
                      <span className="text-sm font-semibold text-foreground">{layer.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-background/80 text-muted-foreground font-medium`}>{layer.tagline}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 使用结果 — 横向紧凑网格 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">🎯 你会收获</h3>
          <div className="grid grid-cols-2 gap-2">
            {outcomes.map((o) => (
              <div key={o.label} className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border/40">
                <o.icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground leading-snug">{o.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 分隔线 */}
        <div className="border-t border-border/30 my-5" />

        {/* 6大人群入口 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            六大专属入口
          </h3>
          <div className="space-y-2">
            {audiences.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.04 }}
                onClick={() => navigate(a.route)}
                className={`flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 border-l-4 ${a.border} cursor-pointer active:scale-[0.98] transition-transform`}
              >
                <span className="text-xl flex-shrink-0">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{a.label}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{a.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 快捷工具栏 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-foreground mb-2">✨ 底部快捷工具</h3>
          <p className="text-[10px] text-muted-foreground mb-2">点击底部中央按钮，即可快速访问：</p>
          <div className="grid grid-cols-3 gap-1.5">
            {quickTools.map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-card border border-border/30 text-center">
                <t.icon className="w-4 h-4 text-amber-500" />
                <p className="text-[10px] font-medium text-foreground">{t.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 结尾 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">有劲AI，陪你过好每一天 ✨</p>
          <Button onClick={() => navigate("/mini-app")} className="rounded-full px-6">
            返回主页
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AwakeningSystemIntro;

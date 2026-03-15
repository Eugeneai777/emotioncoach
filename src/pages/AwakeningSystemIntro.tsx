import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageCircle, Heart, Zap, GraduationCap, Package, Users, ChevronDown, ChevronUp, Brain, Target, MessagesSquare, Star, Pen, Eye, Bot, UserCheck } from "lucide-react";
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
  { icon: Pen, label: "轻记录入口", desc: "30秒写下你的状态，选择关键词或一句话，门槛极低", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200/50 dark:border-amber-800/30" },
  { icon: Eye, label: "智能看见", desc: "AI帮你做5件事：看见情绪、正常化感受、发现盲点、提供新角度、给出微行动", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200/50 dark:border-blue-800/30" },
  { icon: Bot, label: "AI教练深聊", desc: "6大专属教练：情绪、感恩、行动、选择、关系、方向，随时深入对话", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200/50 dark:border-purple-800/30" },
  { icon: UserCheck, label: "真人教练与训练营", desc: "21天结构化训练营 + 专业真人教练，持续陪伴你走出困境", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30", border: "border-teal-200/50 dark:border-teal-800/30" },
];

const outcomes = [
  { icon: Brain, label: "更了解自己的情绪模式", desc: "看清反复困住你的情绪反应" },
  { icon: Target, label: "从"想改变"到"能行动"", desc: "每次记录都带一个微行动" },
  { icon: MessagesSquare, label: "改善关系中的沟通方式", desc: "学会表达真实想法而不伤人" },
  { icon: Star, label: "找到属于自己的方向", desc: "在记录中逐渐看清人生主线" },
];

const AwakeningSystemIntro = () => {
  const navigate = useNavigate();
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30">
      <PageHeader title="关于有劲AI" />

      <div className="px-4 pb-24 max-w-lg mx-auto">
        {/* 品牌区 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pt-6 pb-4"
        >
          <img src={logoImage} alt="有劲AI" className="w-16 h-16 rounded-2xl object-cover mb-3" />
          <h1 className="text-xl font-bold text-foreground">有劲AI</h1>
          <p className="text-sm text-muted-foreground mt-1">每个人的生活教练</p>
        </motion.div>

        {/* 核心理念 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-base font-semibold text-foreground mb-2">生活不易，你不必独自扛着</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            我们为不同人生阶段的你，准备了专属的AI教练。<br />
            无论你正在经历什么，这里都有人懂。
          </p>
        </motion.div>

        {/* 🆕 有劲AI是什么 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-6 p-4 rounded-xl bg-card border border-border/50"
        >
          <h3 className="text-sm font-semibold text-foreground mb-2">💡 有劲AI是什么？</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            有劲AI不是普通的聊天机器人。它是一套基于心理学的<span className="font-medium text-foreground">生活教练系统</span>，帮助你通过频繁记录自己的情绪、想法和行动，逐步看清自己的模式，打破自动驾驶，找到改变的切入点。
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            核心理念：<span className="font-semibold text-foreground">「频繁记录自己，可以改命」</span>
          </p>
        </motion.div>

        {/* 🆕 四层支持系统 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="mb-6"
        >
          <button
            onClick={() => setLayersOpen(!layersOpen)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/50"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              🏰 四层支持系统
            </h3>
            {layersOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {layersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 space-y-2"
            >
              {supportLayers.map((layer, i) => (
                <div key={layer.label} className={`flex items-start gap-3 p-3 rounded-xl ${layer.bg} border ${layer.border}`}>
                  <div className={`mt-0.5 ${layer.color}`}>
                    <layer.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">第{i + 1}层：{layer.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* 🆕 使用结果 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">🎯 使用有劲AI，你会收获</h3>
          <div className="grid grid-cols-2 gap-2">
            {outcomes.map((o) => (
              <div key={o.label} className="p-3 rounded-xl bg-card border border-border/50 text-center">
                <o.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p className="text-xs font-medium text-foreground leading-snug">{o.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{o.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 6大人群入口 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            六大专属入口
          </h3>
          <div className="space-y-2.5">
            {audiences.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                onClick={() => navigate(a.route)}
                className={`flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 border-l-4 ${a.border} cursor-pointer active:scale-[0.98] transition-transform`}
              >
                <span className="text-2xl flex-shrink-0">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{a.label}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{a.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 快捷工具栏介绍 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">✨ 底部快捷工具</h3>
          <p className="text-xs text-muted-foreground mb-3">点击底部中央按钮，即可快速访问以下功能：</p>
          <div className="grid grid-cols-2 gap-2">
            {quickTools.map((t) => (
              <div key={t.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/30">
                <t.icon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 结尾 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
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

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

        {/* 6大人群入口 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
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
                transition={{ delay: 0.2 + i * 0.05 }}
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
          transition={{ delay: 0.5 }}
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
          transition={{ delay: 0.6 }}
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

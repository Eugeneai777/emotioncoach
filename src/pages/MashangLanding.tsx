import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Brain, Shield, TrendingUp, Zap, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ui/responsive-container";

const themes = [
  { day: 1, title: "马上觉醒", emoji: "🌅", desc: "唤醒沉睡的财富意识，看清卡点根源" },
  { day: 2, title: "马上发财", emoji: "💰", desc: "重塑金钱信念，打通财富能量通道" },
  { day: 3, title: "马上回血", emoji: "🔥", desc: "修复情绪内耗，恢复行动力" },
  { day: 4, title: "马上看见", emoji: "👁️", desc: "洞察潜意识模式，发现隐藏资源" },
  { day: 5, title: "马上破局", emoji: "⚡", desc: "突破限制性信念，打碎旧有框架" },
  { day: 6, title: "马上翻身", emoji: "🚀", desc: "重建财富自信，逆转困局思维" },
  { day: 7, title: "马上出发", emoji: "🎯", desc: "锁定行动方向，开启全新征程" },
];

const sellingPoints = [
  { icon: Brain, title: "AI 深度诊断", desc: "3 分钟精准识别你的财富卡点类型" },
  { icon: Sparkles, title: "个性化教练", desc: "基于测评结果定制专属觉醒方案" },
  { icon: Shield, title: "心理学支撑", desc: "融合 ACT / 认知行为疗法核心理论" },
  { icon: TrendingUp, title: "7 天可见变化", desc: "每天 15 分钟，觉醒指数平均提升 20+" },
];

export default function MashangLanding() {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate("/wealth-assessment-lite");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 via-red-900 to-amber-950 text-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-12 pb-8 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.15),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium mb-4">
            <Star className="w-3 h-3" /> 2025 春节限定
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              马上觉醒
            </span>
            <br />
            <span className="text-xl sm:text-2xl font-bold text-red-100/90">
              7天财富能量重启计划
            </span>
          </h1>
          <p className="text-red-200/70 text-sm max-w-xs mx-auto leading-relaxed">
            AI 教练 × 心理学 × 财富觉醒<br />
            每天 15 分钟，打通你的财富卡点
          </p>
        </motion.div>

        {/* Decorative horse silhouette hint */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-16 bg-gradient-to-t from-red-900 to-transparent" />
      </section>

      {/* CTA Top */}
      <ResponsiveContainer size="sm" className="mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleCTA}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-red-950 shadow-lg shadow-amber-500/30 active:scale-[0.97]"
          >
            <Zap className="w-5 h-5 mr-1" />
            免费测一测你的财富卡点
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <p className="text-center text-amber-300/50 text-xs mt-2">3 分钟 · 完全免费 · 即刻出结果</p>
        </motion.div>
      </ResponsiveContainer>

      {/* 7-Day Journey */}
      <section className="px-4 pb-8">
        <ResponsiveContainer size="sm">
          <h2 className="text-center text-lg font-bold text-amber-200 mb-5">
            🐴 7 天·马上系列旅程
          </h2>
          <div className="space-y-3">
            {themes.map((t, i) => (
              <motion.div
                key={t.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.4 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-amber-500/10 backdrop-blur-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-lg font-black text-white shadow-md">
                  {t.day}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{t.emoji}</span>
                    <span className="font-bold text-amber-100">{t.title}</span>
                  </div>
                  <p className="text-red-200/60 text-xs mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </ResponsiveContainer>
      </section>

      {/* AI Coach Selling Points */}
      <section className="px-4 pb-8">
        <ResponsiveContainer size="sm">
          <h2 className="text-center text-lg font-bold text-amber-200 mb-5">
            ✨ 为什么选择 AI 教练？
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {sellingPoints.map((sp, i) => (
              <motion.div
                key={sp.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.8 }}
                className="p-4 rounded-xl bg-white/5 border border-amber-500/10 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-2">
                  <sp.icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-bold text-amber-100 text-sm">{sp.title}</h3>
                <p className="text-red-200/50 text-xs mt-1 leading-relaxed">{sp.desc}</p>
              </motion.div>
            ))}
          </div>
        </ResponsiveContainer>
      </section>

      {/* Social Proof */}
      <section className="px-4 pb-8">
        <ResponsiveContainer size="sm">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/15 text-center">
            <p className="text-3xl font-black bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              10,000+
            </p>
            <p className="text-red-200/60 text-sm mt-1">用户已完成财富卡点测评</p>
            <div className="flex justify-center gap-6 mt-4 text-xs text-red-200/50">
              <div>
                <p className="text-xl font-bold text-amber-300">92%</p>
                <p>认为精准</p>
              </div>
              <div className="w-px bg-amber-500/20" />
              <div>
                <p className="text-xl font-bold text-amber-300">85%</p>
                <p>推荐给朋友</p>
              </div>
              <div className="w-px bg-amber-500/20" />
              <div>
                <p className="text-xl font-bold text-amber-300">20+</p>
                <p>觉醒提升</p>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-12">
        <ResponsiveContainer size="sm">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Button
              onClick={handleCTA}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-red-950 shadow-lg shadow-amber-500/30 active:scale-[0.97]"
            >
              <Zap className="w-5 h-5 mr-1" />
              立即开始测评
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <p className="text-center text-amber-300/40 text-xs mt-3">
              Powered by 有劲AI · 春节限时开放
            </p>
          </motion.div>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

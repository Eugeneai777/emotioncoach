import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Brain, Shield, TrendingUp, Zap, ArrowRight, Star, Gift, Heart, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ui/responsive-container";

const themes = [
  { day: 1, dateLabel: "除夕", title: "马上觉醒", emoji: "🧨", desc: "辞旧迎新，点燃新年第一把火" },
  { day: 2, dateLabel: "初一", title: "马上发财", emoji: "🧧", desc: "开门迎财神，新年财运滚滚来" },
  { day: 3, dateLabel: "初二", title: "马上回血", emoji: "🏠", desc: "回娘家，满血复活好状态" },
  { day: 4, dateLabel: "初三", title: "马上看见", emoji: "🏮", desc: "小年朝，静心看见新的可能" },
  { day: 5, dateLabel: "初四", title: "马上破局", emoji: "🎆", desc: "迎灶神，破旧局开新篇" },
  { day: 6, dateLabel: "初五", title: "马上翻身", emoji: "🎊", desc: "破五迎财，否极泰来好运翻倍" },
  { day: 7, dateLabel: "初六", title: "马上出发", emoji: "🎯", desc: "开市大吉，新春启程一路生花" },
];

const sellingPoints = [
  { icon: Compass, title: "财富卡点诊断", desc: "3 分钟精准识别阻碍你财富增长的核心卡点" },
  { icon: Gift, title: "专属破局方案", desc: "基于测评结果，为你定制财富突破路径" },
  { icon: Heart, title: "心理学支撑", desc: "融合 ACT、正念等循证心理学方法" },
  { icon: Sparkles, title: "7 天蜕变", desc: "每天 15 分钟，看见财富认知的真实改变" },
];

// Floating wealth, stars & celebration decorations
const sparkles = [
  { left: "6%", top: "10%", delay: "0s", size: "text-sm", emoji: "💰", anim: "animate-float" },
  { left: "92%", top: "6%", delay: "0.5s", size: "text-base", emoji: "✨", anim: "animate-twinkle" },
  { left: "14%", top: "25%", delay: "1.2s", size: "text-xs", emoji: "🪙", anim: "animate-float" },
  { left: "88%", top: "22%", delay: "0.8s", size: "text-sm", emoji: "🌟", anim: "animate-twinkle" },
  { left: "4%", top: "42%", delay: "1.5s", size: "text-sm", emoji: "💎", anim: "animate-float" },
  { left: "96%", top: "48%", delay: "0.3s", size: "text-xs", emoji: "⭐", anim: "animate-twinkle" },
  { left: "10%", top: "58%", delay: "2s", size: "text-xs", emoji: "🧧", anim: "animate-float" },
  { left: "90%", top: "55%", delay: "1s", size: "text-sm", emoji: "💵", anim: "animate-float" },
  { left: "18%", top: "72%", delay: "0.7s", size: "text-xs", emoji: "🎉", anim: "animate-twinkle" },
  { left: "82%", top: "75%", delay: "1.8s", size: "text-sm", emoji: "💰", anim: "animate-float" },
  { left: "50%", top: "5%", delay: "2.2s", size: "text-xs", emoji: "🌟", anim: "animate-twinkle" },
  { left: "30%", top: "88%", delay: "0.4s", size: "text-sm", emoji: "🎊", anim: "animate-float" },
  { left: "70%", top: "90%", delay: "1.3s", size: "text-xs", emoji: "🪙", anim: "animate-twinkle" },
  { left: "3%", top: "85%", delay: "2.5s", size: "text-sm", emoji: "✨", anim: "animate-twinkle" },
  { left: "97%", top: "35%", delay: "1.6s", size: "text-xs", emoji: "💎", anim: "animate-float" },
  { left: "45%", top: "95%", delay: "0.9s", size: "text-xs", emoji: "⭐", anim: "animate-twinkle" },
];

export default function MashangLanding() {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate("/wealth-assessment-lite");
  };

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-red-950 via-red-900 to-amber-950 text-white overflow-x-hidden relative" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Floating wealth + stars + celebration background */}
      {sparkles.map((s, i) => (
        <div
          key={i}
          className={`fixed ${s.size} ${s.anim} pointer-events-none z-0`}
          style={{ left: s.left, top: s.top, animationDelay: s.delay, opacity: 0.2 + (i % 4) * 0.1 }}
        >
          {s.emoji}
        </div>
      ))}

      {/* Hero */}
      <section className="relative pt-12 pb-8 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.18),transparent_60%)]" />
        {/* Gold particle overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_1px_at_20%_30%,_rgba(251,191,36,0.4),transparent),radial-gradient(circle_1px_at_60%_20%,_rgba(251,191,36,0.3),transparent),radial-gradient(circle_1px_at_80%_50%,_rgba(251,191,36,0.35),transparent),radial-gradient(circle_1px_at_40%_70%,_rgba(251,191,36,0.25),transparent)]" />

        {/* Floating lanterns + wealth decorations */}
        <div className="absolute top-6 left-4 text-2xl animate-float opacity-70" style={{ animationDelay: "0s" }}>🏮</div>
        <div className="absolute top-10 right-4 text-xl animate-float opacity-60" style={{ animationDelay: "1.5s" }}>🏮</div>
        <div className="absolute top-20 left-12 text-sm animate-float opacity-40" style={{ animationDelay: "3s" }}>🏮</div>
        <div className="absolute top-16 right-14 text-sm animate-float opacity-30" style={{ animationDelay: "2s" }}>💰</div>
        <div className="absolute top-8 left-1/3 text-xs animate-twinkle opacity-35" style={{ animationDelay: "1s" }}>🪙</div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium mb-4">
            🧧 2026 新春献礼
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-3">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
              马上好运
            </span>
            <br />
            <span className="text-lg sm:text-xl font-bold text-red-100/90 mt-1 block">
              新春开运 · 7天好运加持
            </span>
          </h1>
          <p className="text-red-200/70 text-sm max-w-xs mx-auto leading-relaxed">
            新的一年，看清你的财富卡点<br />
            7 天 AI 教练陪你打通财富好运
          </p>
        </motion.div>

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
            🧧
            <span className="ml-1">测一测你的财富卡点</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <p className="text-center text-amber-300/50 text-xs mt-2">3 分钟 · 新春特惠 ¥9.9 · 即刻出结果</p>
        </motion.div>
      </ResponsiveContainer>

      {/* Auspicious cloud divider */}
      <div className="flex justify-center items-center gap-3 mb-2 opacity-30">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
        <span className="text-amber-400 text-xs">☁︎ ☁︎ ☁︎</span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
      </div>

      {/* 7-Day Journey */}
      <section className="px-4 pb-8">
        <ResponsiveContainer size="sm">
          <h2 className="text-center text-lg font-bold text-amber-200 mb-5">
            🏮 除夕到初六 · 好运马上来
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
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-lg font-black text-white shadow-md relative overflow-hidden">
                  {/* Subtle cloud texture overlay */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,_white_1px,transparent_1px),radial-gradient(circle_at_70%_70%,_white_1px,transparent_1px)] bg-[length:6px_6px]" />
                  <span className="relative z-10 text-xs">{t.dateLabel}</span>
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

      {/* Auspicious cloud divider */}
      <div className="flex justify-center items-center gap-3 mb-2 opacity-30">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
        <span className="text-amber-400 text-xs">☁︎ ☁︎ ☁︎</span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
      </div>

      {/* Selling Points as "New Year Gift" */}
      <section className="px-4 pb-8">
        <ResponsiveContainer size="sm">
          <h2 className="text-center text-lg font-bold text-amber-200 mb-5">
            🧧 新春献礼 · 财富开运测评
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
            <p className="text-red-200/60 text-sm mt-1">人已完成财富卡点测评</p>
            <div className="flex justify-center gap-6 mt-4 text-xs text-red-200/50">
              <div>
                <p className="text-xl font-bold text-amber-300">92%</p>
                <p>认为诊断精准</p>
              </div>
              <div className="w-px bg-amber-500/20" />
              <div>
                <p className="text-xl font-bold text-amber-300">85%</p>
                <p>推荐给朋友</p>
              </div>
              <div className="w-px bg-amber-500/20" />
              <div>
                <p className="text-xl font-bold text-amber-300">20+</p>
                <p>财富认知提升</p>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Rising wealth decorations above bottom CTA */}
      <div className="relative pointer-events-none overflow-hidden h-8">
        <div className="absolute left-[15%] bottom-0 text-sm animate-float opacity-30" style={{ animationDelay: "0s" }}>💰</div>
        <div className="absolute left-[40%] bottom-0 text-xs animate-float opacity-25" style={{ animationDelay: "0.6s" }}>✨</div>
        <div className="absolute left-[65%] bottom-0 text-sm animate-float opacity-30" style={{ animationDelay: "1.2s" }}>🪙</div>
        <div className="absolute left-[85%] bottom-0 text-xs animate-float opacity-20" style={{ animationDelay: "1.8s" }}>🌟</div>
      </div>

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
              <Sparkles className="w-5 h-5 mr-1" />
              立即开启财富测评
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <p className="text-center text-amber-300/40 text-xs mt-3">
              有劲AI · 2026 新春献礼 🧧
            </p>
          </motion.div>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

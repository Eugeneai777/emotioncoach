import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Wrench, BarChart3, Target, Quote } from "lucide-react";

import logoImage from "@/assets/logo-youjin-ai.png";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";
import { Skeleton } from "@/components/ui/skeleton";
import { detectPlatform } from "@/lib/platformDetector";

const audiences = [
  { id: "mama", emoji: "👩‍👧", label: "宝妈专区", subtitle: "你的辛苦，我都懂", route: "/mama", gradient: "from-rose-500 to-pink-400" },
  { id: "workplace", emoji: "💼", label: "职场解压", subtitle: "累了就歇一歇", route: "/workplace", gradient: "from-blue-500 to-indigo-400" },
  { id: "couple", emoji: "💑", label: "情侣夫妻", subtitle: "爱需要被听见", route: "/us-ai", gradient: "from-purple-500 to-violet-400" },
  { id: "youth", emoji: "🎓", label: "青少年", subtitle: "长大不容易", route: "/xiaojin", gradient: "from-amber-500 to-orange-400" },
  { id: "midlife", emoji: "🧭", label: "中年觉醒", subtitle: "人生下半场", route: "/laoge", gradient: "from-orange-500 to-red-400" },
  { id: "senior", emoji: "🌿", label: "银发陪伴", subtitle: "陪您说说话", route: "/elder-care", gradient: "from-emerald-500 to-teal-400" },
];

const exploreBlocks = [
  {
    icon: Wrench,
    emoji: "🛠",
    title: "日常工具",
    desc: "情绪SOS、呼吸练习、感恩日记、能量宣言……随时随地给自己充电",
    btnText: "去看看 →",
    route: "/energy-studio",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: BarChart3,
    emoji: "📊",
    title: "专业测评",
    desc: "PHQ-9抑郁筛查、SCL-90、财富信念测评、关系质量测评……科学看清自己",
    btnText: "去测评 →",
    route: "/energy-studio?tab=assessments",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Target,
    emoji: "🏕️",
    title: "系统训练营",
    desc: "21天情绪觉醒、财富信念重塑、身份认同探索……AI+真人教练全程陪伴",
    btnText: "去报名 →",
    route: "/camps",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

const testimonials = [
  {
    quote: "第三次对话时，AI说'你上次提到对父亲有愧疚感'，我当时就哭了。它真的记得我说过的每一句话。",
    name: "小雨",
    identity: "28岁，产品经理",
    tag: "AI记忆",
  },
  {
    quote: "训练营第15天，AI告诉我'你的焦虑模式已经开始转变'，比我自己更早发现了变化。",
    name: "阿杰",
    identity: "35岁，创业者",
    tag: "AI见证",
  },
  {
    quote: "凌晨三点崩溃大哭时，没有人可以打电话，但AI教练在。那一晚它陪了我整整两个小时。",
    name: "晓晓",
    identity: "24岁，研究生",
    tag: "AI陪伴",
  },
];

const MiniAppEntry = () => {
  const navigate = useNavigate();
  const { greeting, isLoading } = usePersonalizedGreeting();
  const [isExpanded, setIsExpanded] = useState(false);
  const isMiniProgram = useMemo(() => detectPlatform() === 'mini_program', []);
  const reduceMotion = isMiniProgram;

  // 小程序入口页：缓存 mp_openid / mp_unionid，供后续页面（如情绪按钮、产品中心）支付复用
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpOpenId = params.get('mp_openid');
    const mpUnionId = params.get('mp_unionid');
    if (mpOpenId) {
      sessionStorage.setItem('wechat_mp_openid', mpOpenId);
    }
    if (mpUnionId) {
      sessionStorage.setItem('wechat_mp_unionid', mpUnionId);
    }
  }, []);

  React.useEffect(() => {
    const skip = sessionStorage.getItem('skip_preferred_redirect');
    if (skip) {
      sessionStorage.removeItem('skip_preferred_redirect');
      return;
    }
    const preferred = localStorage.getItem('preferred_audience');
    if (preferred) {
      const match = audiences.find(a => a.id === preferred);
      if (match) {
        navigate(match.route, { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-muted/30"
      style={{ WebkitOverflowScrolling: 'touch' as any, WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
    >
      {/* ── 顶部标题 ── */}
      <div className="px-4 pb-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <h1 className="text-lg font-bold text-foreground">有劲AI生活教练</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">选一个最懂你的入口 ↓</p>
        </motion.div>
      </div>

      {/* ── 人群入口 3列网格 ── */}
      <div className="px-3 pb-4">
        <div className="grid grid-cols-3 gap-1.5">
          {audiences.map((a, i) => (
            <motion.button
              key={a.id}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduceMotion ? { duration: 0.1 } : { delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(a.route)}
              style={{ transform: "translateZ(0)" }}
              className={`relative overflow-hidden rounded-xl p-3 bg-gradient-to-br ${a.gradient} shadow-sm min-h-[88px] flex flex-col items-center justify-center gap-1 active:shadow-md transition-shadow duration-150`}
            >
              <div className="absolute top-0 right-0 w-12 h-12 opacity-15">
                <div className="absolute top-0.5 right-0.5 text-2xl opacity-40">
                  {a.emoji}
                </div>
              </div>
              <div className="relative z-10 text-center">
                <span className="text-xl block mb-1">{a.emoji}</span>
                <h3 className="text-sm font-bold text-white leading-tight">{a.label}</h3>
                <p className="text-[10px] text-white/70 mt-0.5 leading-tight line-clamp-1">{a.subtitle}</p>
              </div>
              <div className="absolute inset-0 bg-white/0 active:bg-white/15 transition-colors duration-150" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── 个性化欢迎语 ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-5 py-6"
      >
        <div className="text-center">
          {isLoading ? (
            <Skeleton className="h-9 w-64 mx-auto rounded-full" />
          ) : (
            <p className="text-xl font-bold text-foreground leading-relaxed tracking-wide">
              ✨ {greeting}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── 了解更多折叠区 ── */}
      <div className="px-4 pb-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-1.5 py-2 cursor-pointer"
        >
          <span className="text-sm text-blue-800 dark:text-blue-300">还想探索更多？</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* 三大板块 */}
                {exploreBlocks.map((block, i) => (
                  <motion.div
                    key={block.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-xl bg-card border border-border/50 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${block.bg} flex items-center justify-center shrink-0`}>
                        <span className="text-lg">{block.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground">{block.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{block.desc}</p>
                        <button
                          onClick={() => navigate(block.route)}
                          className={`mt-2 text-xs font-medium ${block.color} active:opacity-70 transition-opacity`}
                        >
                          {block.btnText}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* 用户见证 */}
                <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💬</span>
                    <h4 className="text-sm font-bold text-foreground">用户见证</h4>
                  </div>
                  <div className="space-y-2.5">
                    {testimonials.map((t, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24 + i * 0.08 }}
                        className="p-3 rounded-lg bg-muted/50 border border-border/30"
                      >
                        <span className="inline-block px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] text-primary font-medium mb-1.5">
                          {t.tag}
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                          <Quote className="inline w-3 h-3 mr-0.5 opacity-40" />
                          {t.quote}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-[8px] text-primary-foreground font-bold">{t.name[0]}</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-medium">{t.name}</p>
                            <p className="text-[9px] text-muted-foreground/60">{t.identity}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 收起按钮 */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-full text-center text-xs text-muted-foreground py-2 active:opacity-70"
                >
                  收起 ↑
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Powered by 有劲AI ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center py-3"
      >
        <span className="text-sm text-muted-foreground/60 tracking-wide">Powered by <span className="font-semibold text-muted-foreground/80">有劲AI</span></span>
      </motion.div>

      {/* ── 底部导航 ── */}
      <AwakeningBottomNav />
    </div>
  );
};

export default MiniAppEntry;

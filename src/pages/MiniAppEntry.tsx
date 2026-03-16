import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Wrench, BarChart3, Target, Quote, ShoppingBag, Moon, Briefcase, Heart, TrendingUp } from "lucide-react";

import logoImage from "@/assets/logo-youjin-ai.png";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";
import { Skeleton } from "@/components/ui/skeleton";
import { detectPlatform } from "@/lib/platformDetector";
import { supabase } from "@/integrations/supabase/client";

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
    title: "日常工具",
    sub: "随时充电",
    desc: "情绪SOS、呼吸练习、感恩日记……在情绪涌上来的那一刻，给你即刻支持。",
    route: "/energy-studio",
    iconColor: "text-cyan-300",
    iconBg: "bg-cyan-500/20",
    bg: "bg-gradient-to-br from-cyan-500/15 to-sky-500/8",
    ring: "ring-cyan-400/25",
    glow: "shadow-cyan-500/10",
  },
  {
    icon: BarChart3,
    title: "专业测评",
    sub: "科学看清自己",
    desc: "PHQ-9、SCL-90、财富信念……用科学工具深度了解你的情绪模式。",
    route: "/energy-studio?tab=assessments",
    iconColor: "text-violet-300",
    iconBg: "bg-violet-500/20",
    bg: "bg-gradient-to-br from-violet-500/15 to-purple-500/8",
    ring: "ring-violet-400/25",
    glow: "shadow-violet-500/10",
  },
  {
    icon: Target,
    title: "系统训练营",
    sub: "AI+真人陪伴",
    desc: "情绪觉醒、财富信念、身份探索……在双重陪伴下实现真正蜕变。",
    route: "/camps",
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/20",
    bg: "bg-gradient-to-br from-amber-500/15 to-orange-500/8",
    ring: "ring-amber-400/25",
    glow: "shadow-amber-500/10",
  },
  {
    icon: ShoppingBag,
    title: "健康商城",
    sub: "守护身心平衡",
    desc: "知乐胶囊、协同套餐……科学配方，为你的情绪健康保驾护航。",
    route: "/health-store",
    iconColor: "text-rose-300",
    iconBg: "bg-rose-500/20",
    bg: "bg-gradient-to-br from-rose-500/15 to-pink-500/8",
    ring: "ring-rose-400/25",
    glow: "shadow-rose-500/10",
  },
];

const useCases = [
  {
    icon: Moon,
    title: "深夜焦虑时",
    desc: "凌晨两点翻来覆去，你不想打扰任何人——AI教练24小时在线，随时接住你。",
    iconColor: "text-indigo-300",
    iconBg: "bg-indigo-500/20",
    accent: "border-l-indigo-400",
    bg: "bg-gradient-to-r from-indigo-500/12 to-transparent",
  },
  {
    icon: Briefcase,
    title: "职场迷茫时",
    desc: "不知道该不该换工作、该不该开口……AI帮你看见选择背后的恐惧与渴望。",
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/20",
    accent: "border-l-amber-400",
    bg: "bg-gradient-to-r from-amber-500/12 to-transparent",
  },
  {
    icon: Heart,
    title: "关系困扰时",
    desc: "吵完架的委屈、说不出口的话……在这里可以安全地说出一切，被理解不被评判。",
    iconColor: "text-rose-300",
    iconBg: "bg-rose-500/20",
    accent: "border-l-rose-400",
    bg: "bg-gradient-to-r from-rose-500/12 to-transparent",
  },
  {
    icon: TrendingUp,
    title: "想要成长时",
    desc: "AI教练陪你一步步觉察、记录、突破，见证你的每一个进步。",
    iconColor: "text-emerald-300",
    iconBg: "bg-emerald-500/20",
    accent: "border-l-emerald-400",
    bg: "bg-gradient-to-r from-emerald-500/12 to-transparent",
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
  const [illustrations, setIllustrations] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from('audience_illustrations')
      .select('audience_id, image_url')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => { map[row.audience_id] = row.image_url; });
          setIllustrations(map);
        }
      });
  }, []);

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
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {audiences.map((a, i) => (
            <motion.button
              key={a.id}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduceMotion ? { duration: 0.1 } : { delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate(a.route)}
              style={{ transform: "translateZ(0)" }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.gradient} min-h-[96px] flex flex-col items-start justify-between p-3 shadow-lg active:shadow-inner hover:-translate-y-0.5 transition-all duration-200`}
            >
              {/* 顶部高光层 */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/5 pointer-events-none" />
              {/* 右上角装饰水印 */}
              <span className="absolute -top-1 -right-1 text-3xl opacity-[0.15] pointer-events-none select-none">{a.emoji}</span>
              {/* 图标容器 */}
              <div className="relative z-10 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]">
                <span className="text-lg">{a.emoji}</span>
              </div>
              {/* 文字区 */}
              <div className="relative z-10 mt-auto">
                <h3 className="text-[15px] font-extrabold text-white leading-tight tracking-wide">{a.label}</h3>
                <p className="text-[10px] text-white/80 mt-0.5 leading-tight tracking-wider line-clamp-1">{a.subtitle}</p>
              </div>
              {/* 按压反馈层 */}
              <div className="absolute inset-0 bg-white/0 active:bg-white/10 transition-colors duration-150 pointer-events-none" />
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
          <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">还想探索更多？</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <motion.div animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
            </motion.div>
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
              <div className="pt-3 space-y-5">
               <div className="space-y-3">
                  <div className="flex items-center gap-2 px-0.5">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <h3 className="text-sm font-bold text-foreground">四大板块，助你持续成长</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {exploreBlocks.map((block, i) => {
                      const Icon = block.icon;
                      return (
                        <motion.button
                          key={block.title}
                          onClick={() => navigate(block.route)}
                          className={`text-left p-3.5 rounded-2xl ${block.bg} ring-1 ${block.ring} shadow-lg ${block.glow} active:scale-[0.97] transition-all duration-150 hover:shadow-xl`}
                          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.3 }}
                        >
                          <div className={`w-8 h-8 rounded-xl ${block.iconBg} flex items-center justify-center mb-2.5`}>
                            <Icon className={`w-4 h-4 ${block.iconColor}`} />
                          </div>
                          <p className="text-[13px] font-bold text-foreground">{block.title}</p>
                          <p className="text-[10px] text-muted-foreground/70 mb-1.5">{block.sub}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{block.desc}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* 使用场景引导 */}
                <div className="space-y-3">
                  <div className="px-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-pink-500" />
                      <h3 className="text-sm font-bold text-foreground">什么时候可以找有劲AI？</h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 ml-3">任何时刻，任何情绪，它都在</p>
                  </div>
                  <div className="space-y-2">
                    {useCases.map((c, i) => {
                      const Icon = c.icon;
                      return (
                        <motion.div
                          key={i}
                          className={`p-3.5 rounded-xl ${c.bg} border-l-[3px] ${c.accent}`}
                          initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.3 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                              <Icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground mb-0.5">{c.title}</h4>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">{c.desc}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* 用户见证 - 横滑轮播 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
                    <h4 className="text-sm font-bold text-foreground">用户见证</h4>
                    <span className="text-[10px] text-muted-foreground/50 ml-auto">← 滑动查看</span>
                  </div>
                  <div 
                    className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
                    style={{ WebkitOverflowScrolling: 'touch' as any } as React.CSSProperties}
                  >
                    {testimonials.map((t, i) => {
                      const gradients = [
                        "from-blue-500/10 to-indigo-500/5",
                        "from-emerald-500/10 to-teal-500/5",
                        "from-purple-500/10 to-violet-500/5",
                      ];
                      return (
                      <motion.div
                        key={i}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                        className={`min-w-[78%] max-w-[82%] shrink-0 snap-center rounded-xl bg-gradient-to-br ${gradients[i]} border border-border/30 p-4 shadow-md`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                            <span className="text-[10px] text-primary-foreground font-bold">{t.name[0]}</span>
                          </div>
                          <div>
                            <p className="text-xs text-foreground font-medium">{t.name}</p>
                            <p className="text-[9px] text-muted-foreground/70">{t.identity}</p>
                          </div>
                          <span className="ml-auto inline-block px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] text-primary font-medium">
                            {t.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                          <Quote className="inline w-3 h-3 mr-0.5 opacity-30 -translate-y-px" />
                          {t.quote}
                        </p>
                      </motion.div>
                      );
                    })}
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
      <div className="flex items-center justify-center gap-1.5 py-4">
        <span className="text-xs text-muted-foreground/50 tracking-wider">Powered by</span>
        <span className="text-sm font-bold bg-gradient-to-r from-primary/70 to-accent/70 bg-clip-text text-transparent tracking-wide">有劲AI</span>
      </div>

      {/* ── 底部留白，避免被固定导航栏遮挡 ── */}
      <div className="h-24" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />

      {/* ── 底部导航 ── */}
      <AwakeningBottomNav />
    </div>
  );
};

export default MiniAppEntry;

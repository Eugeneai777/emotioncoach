// force rebuild v5 - 2026-04-02
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Wrench, BarChart3, Target, Quote, ShoppingBag, Moon, Briefcase, Heart, TrendingUp } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import logoImage from "@/assets/logo-youjin-ai.png";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { detectPlatform } from "@/lib/platformDetector";
import { supabase } from "@/integrations/supabase/client";
import AssessmentPickerSheet, { type AssessmentOption } from "@/components/mini-app/AssessmentPickerSheet";
import { usePackagesPurchased } from "@/hooks/usePackagePurchased";
import { useQuery } from "@tanstack/react-query";

interface AudienceBadge {
  text: string;
  assessments: AssessmentOption[];
}

const audiences: Array<{
  id: string; emoji: string; label: string; subtitle: string; route: string; gradient: string; badge?: AudienceBadge | null;
}> = [
  { id: "mama", emoji: "👩", label: "女性专区", subtitle: "懂你也懂生活", route: "/mama", gradient: "from-rose-500 to-pink-400", badge: {
    text: "测一测",
    assessments: [
      { emoji: "👑", title: "35+女性竞争力", sub: "25题·7分钟", route: "/assessment/women_competitiveness", price: "专业版" },
      { emoji: "💚", title: "情绪健康测评", sub: "PHQ-9+GAD-7·5分钟", route: "/emotion-health", price: "限时¥9.9" },
    ],
  }},
  { id: "senior", emoji: "🌿", label: "银发陪伴", subtitle: "陪您说说话", route: "/elder-care", gradient: "from-emerald-500 to-teal-400", badge: null },
  { id: "couple", emoji: "💑", label: "情侣夫妻", subtitle: "爱需要被听见", route: "/us-ai", gradient: "from-purple-500 to-violet-400", badge: null },
  { id: "midlife", emoji: "🧭", label: "中年觉醒", subtitle: "人生下半场", route: "/laoge", gradient: "from-orange-500 to-red-400", badge: {
    text: "测一测",
    assessments: [
      { emoji: "💰", title: "财富卡点测评", sub: "20题·6分钟", route: "/wealth-block", price: "限时¥9.9" },
      { emoji: "🧭", title: "中场觉醒力测评", sub: "6维度·30题·8分钟", route: "/midlife-awakening", price: "专业版" },
    ],
  }},
  { id: "youth", emoji: "🎓", label: "青少年", subtitle: "长大不容易", route: "/xiaojin", gradient: "from-amber-500 to-orange-400", badge: null },
  { id: "workplace", emoji: "💼", label: "职场解压", subtitle: "累了就歇一歇", route: "/workplace", gradient: "from-blue-500 to-indigo-400", badge: null },
];

const exploreBlocks = [
  {
    icon: Wrench,
    title: "日常工具",
    sub: "随时充电",
    desc: "情绪SOS、呼吸练习、感恩日记……在情绪涌上来的那一刻，给你即刻支持。",
    route: "/energy-studio",
    illustrationKey: "block_daily_tools",
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
    illustrationKey: "block_assessments",
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
    illustrationKey: "block_training",
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
    illustrationKey: "block_health_store",
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
    illustrationKey: "scene_anxiety",
    iconColor: "text-indigo-300",
    iconBg: "bg-indigo-500/20",
    accent: "border-l-indigo-400",
    bg: "bg-gradient-to-r from-indigo-500/6 to-transparent",
  },
  {
    icon: Briefcase,
    title: "职场迷茫时",
    desc: "不知道该不该换工作、该不该开口……AI帮你看见选择背后的恐惧与渴望。",
    illustrationKey: "scene_workplace",
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/20",
    accent: "border-l-amber-400",
    bg: "bg-gradient-to-r from-amber-500/6 to-transparent",
  },
  {
    icon: Heart,
    title: "关系困扰时",
    desc: "吵完架的委屈、说不出口的话……在这里可以安全地说出一切，被理解不被评判。",
    illustrationKey: "scene_relationship",
    iconColor: "text-rose-300",
    iconBg: "bg-rose-500/20",
    accent: "border-l-rose-400",
    bg: "bg-gradient-to-r from-rose-500/6 to-transparent",
  },
  {
    icon: TrendingUp,
    title: "财富渴望时",
    desc: "总觉得赚得不少却存不下来？AI帮你找到财富卡点，打通金钱信念。",
    illustrationKey: "scene_growth",
    iconColor: "text-emerald-300",
    iconBg: "bg-emerald-500/20",
    accent: "border-l-emerald-400",
    bg: "bg-gradient-to-r from-emerald-500/6 to-transparent",
  },
];

const testimonials = [
  { quote: "第三次对话时，AI说'你上次提到对父亲有愧疚感'，我当时就哭了。它真的记得我说过的每一句话。", name: "小雨", identity: "28岁，产品经理", tag: "AI记忆" },
  { quote: "训练营第15天，AI告诉我'你的焦虑模式已经开始转变'，比我自己更早发现了变化。", name: "阿杰", identity: "35岁，创业者", tag: "AI见证" },
  { quote: "凌晨三点崩溃大哭时，没有人可以打电话，但AI教练在。那一晚它陪了我整整两个小时。", name: "晓晓", identity: "24岁，研究生", tag: "AI陪伴" },
  { quote: "老公总说我矫情，但AI教练说'你的感受是真实的'。那一刻我觉得终于被理解了。", name: "芳芳", identity: "32岁，全职妈妈", tag: "被理解" },
  { quote: "做完财富信念测评，才发现我一直在'配不上'的信念里打转。这个认知让我开始改变消费习惯。", name: "大伟", identity: "40岁，工程师", tag: "财富觉醒" },
  { quote: "和孩子吵完架，AI教练引导我看到了自己小时候被忽视的伤。原来我在重复父母的模式。", name: "丽姐", identity: "38岁，教师", tag: "代际疗愈" },
  { quote: "每天早上的能量宣言已经坚持30天了，同事说我整个人气场都变了。", name: "小林", identity: "26岁，设计师", tag: "每日坚持" },
  { quote: "情绪SOS真的是救命功能，上周开会被领导怼完，躲在厕所用了5分钟呼吸练习，整个人稳住了。", name: "阿明", identity: "30岁，销售", tag: "情绪急救" },
  { quote: "退休后总觉得自己没用了，AI教练帮我重新发现了生活的意义。现在每天都在社区教太极。", name: "张叔", identity: "62岁，退休干部", tag: "银发觉醒" },
  { quote: "和老婆做了沟通模式分析后，我才知道她说'随便'不是真的随便。这个功能救了我的婚姻。", name: "老王", identity: "36岁，程序员", tag: "关系修复" },
  { quote: "高三压力大到想放弃，AI教练陪我做了一次觉醒日记，发现我怕的不是考试而是让爸妈失望。", name: "小凡", identity: "18岁，高三学生", tag: "青春成长" },
  { quote: "21天训练营结束那天，AI生成的成长报告让我看到了自己的蜕变轨迹，感动到截图发了朋友圈。", name: "思思", identity: "29岁，HR", tag: "蜕变见证" },
];

// 精选5条见证（覆盖宝妈、中年男性、职场、情感、代际场景）
const featuredTestimonials = [
  testimonials[3],  // 芳芳 - 全职妈妈 - 被理解
  testimonials[4],  // 大伟 - 40岁工程师 - 财富觉醒
  testimonials[7],  // 阿明 - 30岁销售 - 情绪急救
  testimonials[9],  // 老王 - 36岁程序员 - 关系修复
  testimonials[5],  // 丽姐 - 38岁教师 - 代际疗愈
];


/* ── 活动轮播图组件 ── */
const promoSlides = [
  {
    id: "assessment",
    emoji: "🎯",
    title: "找到你的卡点",
    subtitle: "科学定位突破方向",
    tag: "中年男性 · 35+女性",
    gradient: "from-violet-600 to-indigo-500",
  },
  {
    id: "women-camp",
    emoji: "🌸",
    title: "7天有劲训练营",
    subtitle: "找回你的劲头",
    tag: "热门推荐",
    gradient: "from-slate-700 to-amber-600",
    route: "/promo/synergy",
  },
];

const PromoBanner: React.FC<{
  onAssessmentClick: () => void;
  navigate: (path: string) => void;
  reduceMotion: boolean;
  slides: typeof promoSlides;
}> = ({ onAssessmentClick, navigate, reduceMotion, slides }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Auto-play 3s (only if multiple slides)
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();

    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);

    const stopTimer = () => clearInterval(timer);
    emblaApi.on("pointerDown", stopTimer);

    return () => {
      clearInterval(timer);
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", stopTimer);
    };
  }, [emblaApi, onSelect, slides.length]);

  const handleSlideClick = (slide: typeof promoSlides[0]) => {
    if (slide.id === "assessment") {
      onAssessmentClick();
    } else if (slide.route) {
      navigate(slide.route);
    }
  };

  if (slides.length === 0) return null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.35 }}
      className="px-4 pb-3 max-w-lg mx-auto"
    >
      <div ref={emblaRef} className="overflow-hidden rounded-2xl">
        <div className="flex">
          {slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => handleSlideClick(slide)}
              className={`relative flex-[0_0_100%] min-w-0 h-[140px] sm:h-[150px] rounded-2xl bg-gradient-to-br ${slide.gradient} flex flex-col items-center justify-center text-center overflow-hidden active:scale-[0.98] transition-transform`}
>
              {/* 内容区 */}
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-[10px] font-medium text-white/90 tracking-wide">
                  {slide.tag}
                </span>
                <span className="text-lg font-extrabold text-white tracking-wide leading-tight">
                  {slide.emoji} {slide.title}
                </span>
                <span className="text-sm text-white/80 tracking-wider">
                  {slide.subtitle}
                </span>
                <span className="mt-1 inline-block px-4 py-1 rounded-full bg-white/30 backdrop-blur-sm text-xs font-semibold text-white">
                  {slide.id === "assessment" ? "立即测评 →" : "了解详情 →"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* 圆点指示器（仅多张时展示） */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === selectedIndex ? "w-4 bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const MiniAppEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { greeting, isLoading } = usePersonalizedGreeting();
  const [isExpanded, setIsExpanded] = useState(false);
  const [pickerAssessments, setPickerAssessments] = useState<AssessmentOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isMiniProgram = useMemo(() => detectPlatform() === 'mini_program', []);
  const reduceMotion = isMiniProgram;

  const { data: illustrations = {} } = useQuery({
    queryKey: ['audience-illustrations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audience_illustrations')
        .select('audience_id, image_url');
      if (!data) return {};
      const map: Record<string, string> = {};
      data.forEach((row: any) => { map[row.audience_id] = row.image_url; });
      return map;
    },
    staleTime: Infinity,
  });

  // ── 购买/完成状态查询 ──
  const { data: purchasedMap = {} } = usePackagesPurchased([
    'synergy_bundle', 'wealth_block_assessment', 'emotion_health_assessment',
  ]);

  const { data: completedFreeAssessments = {} } = useQuery({
    queryKey: ['free-assessment-completion', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('awakening_entries')
        .select('type')
        .eq('user_id', user.id);
      if (error) return {};
      const types = new Set((data || []).map((r: any) => r.type));
      return {
        midlife_awakening: types.has('midlife_assessment') || types.has('midlife_awakening'),
        women_competitiveness: types.has('women_competitiveness') || types.has('female_competitiveness'),
      } as Record<string, boolean>;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // ── 过滤轮播卡片 ──
  const filteredSlides = useMemo(() => {
    if (!user) return promoSlides;
    const allAssessmentsDone =
      !!purchasedMap['wealth_block_assessment'] &&
      !!purchasedMap['emotion_health_assessment'] &&
      !!completedFreeAssessments['midlife_awakening'] &&
      !!completedFreeAssessments['women_competitiveness'];
    return promoSlides.filter(slide => {
      if (slide.id === 'women-camp' && purchasedMap['synergy_bundle']) return false;
      if (slide.id === 'assessment' && allAssessmentsDone) return false;
      return true;
    });
  }, [user, purchasedMap, completedFreeAssessments]);

  // ── 过滤测评选择器列表 ──
  const filterAssessments = useCallback((assessments: AssessmentOption[]): AssessmentOption[] => {
    if (!user) return assessments;
    return assessments.filter(a => {
      if (a.route === '/wealth-block' && purchasedMap['wealth_block_assessment']) return false;
      if (a.route === '/emotion-health' && purchasedMap['emotion_health_assessment']) return false;
      if (a.route === '/midlife-awakening' && completedFreeAssessments['midlife_awakening']) return false;
      if (a.route === '/assessment/women_competitiveness' && completedFreeAssessments['women_competitiveness']) return false;
      return true;
    });
  }, [user, purchasedMap, completedFreeAssessments]);




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
      <div className="px-4 pb-4" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">选一个最懂你的入口 ↓</p>
        </motion.div>
      </div>

      {/* ── 人群入口 3列网格 ── */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2 overflow-visible">
          {audiences.map((a, i) => {
            const card = (
              <motion.button
                key={a.id}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.1 } : { delay: i * 0.02, type: "spring", stiffness: 300, damping: 25 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => navigate(a.route)}
                style={{ transform: "translateZ(0)" }}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${a.gradient} min-h-[96px] flex flex-col items-start justify-between p-3 shadow-md active:shadow-inner hover:-translate-y-0.5 transition-all duration-200 w-full`}
              >
                {/* 右侧插画或 emoji 水印 fallback */}
                {illustrations[a.id] ? (
                  <img
                    src={illustrations[a.id]}
                    alt=""
                    className="absolute -right-2 -top-2 w-20 h-20 object-cover opacity-30 pointer-events-none select-none rounded-full"
                    loading="lazy"
                  />
                ) : null}
                {/* 图标容器 */}
                <div className={`relative z-10 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${illustrations[a.id] ? 'border-2 border-white/40 shadow-md' : 'bg-white/20 backdrop-blur-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]'}`}>
                  {illustrations[a.id] ? (
                    <img src={illustrations[a.id]} alt="" className="w-[120%] h-[120%] object-cover" loading="lazy" />
                  ) : (
                    <span className="text-lg">{a.emoji}</span>
                  )}
                </div>
                {/* 文字区 */}
                <div className="relative z-10 mt-auto">
                  <h3 className="text-[15px] font-extrabold text-white leading-tight tracking-wide">{a.label}</h3>
                  <p className="text-[10px] text-white/80 mt-0.5 leading-tight tracking-wider line-clamp-1">{a.subtitle}</p>
                </div>
              </motion.button>
            );

            return a.badge ? (
              <div key={a.id} className="relative">
                <button
                  onClick={() => {
                    const filtered = filterAssessments(a.badge!.assessments);
                    if (filtered.length > 0) {
                      setPickerAssessments(filtered);
                      setPickerOpen(true);
                    }
                  }}
                  className="absolute -top-2 right-1 z-20 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm active:scale-95 transition-transform"
                >
                  {a.badge.text}
                </button>
                {card}
              </div>
            ) : (
              <div key={a.id}>{card}</div>
            );
          })}
        </div>
      </div>


      {/* ── 活动轮播图 ── */}
      <PromoBanner
        onAssessmentClick={() => {
          const allAssessments = [
            { emoji: "🧭", title: "中场觉醒力测评", sub: "6维度·30题·8分钟", route: "/midlife-awakening", price: "专业版" },
            { emoji: "👑", title: "35+女性竞争力", sub: "25题·7分钟", route: "/assessment/women_competitiveness", price: "专业版" },
            { emoji: "💰", title: "财富卡点测评", sub: "20题·6分钟", route: "/wealth-block", price: "限时¥9.9" },
            { emoji: "💚", title: "情绪健康测评", sub: "PHQ-9+GAD-7·5分钟", route: "/emotion-health", price: "限时¥9.9" },
          ];
          const filtered = filterAssessments(allAssessments);
          if (filtered.length > 0) {
            setPickerAssessments(filtered);
            setPickerOpen(true);
          }
        }}
        navigate={navigate}
        reduceMotion={reduceMotion}
        slides={filteredSlides}
      />
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

      {/* ── 精选用户见证（横向滚动） ── */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-2 px-0.5">
          <div className="w-1 h-3.5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
          <h4 className="text-xs font-bold text-foreground">真实用户体验</h4>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {featuredTestimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={reduceMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
              className="min-w-[260px] max-w-[280px] shrink-0 snap-start rounded-xl bg-card border border-border/40 p-3"
            >
              <span className="inline-block px-1.5 py-0.5 rounded-full bg-muted text-[9px] text-muted-foreground font-medium mb-1.5">
                {t.tag}
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2 line-clamp-3">
                <Quote className="inline w-3 h-3 mr-0.5 opacity-30 -translate-y-px" />
                {t.quote}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-[8px] text-primary-foreground font-bold">{t.name[0]}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{t.name} · {t.identity}</span>
              </div>
            </motion.div>
          ))}
          {/* 查看更多卡片 */}
          <motion.button
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + featuredTestimonials.length * 0.06, duration: 0.3 }}
            onClick={() => {
              setIsExpanded(true);
              setTimeout(() => {
                document.getElementById('full-testimonials')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 350);
            }}
            className="min-w-[100px] shrink-0 snap-start rounded-xl bg-primary/5 border border-primary/20 p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/10 active:scale-95 transition-all"
          >
            <span className="text-lg">💬</span>
            <span className="text-[11px] text-primary font-medium whitespace-nowrap">查看更多</span>
            <span className="text-[9px] text-muted-foreground">{testimonials.length}条</span>
          </motion.button>
        </div>
      </div>

      {/* ── 使用场景引导（直接展示） ── */}
      <div className="px-4 pb-4">
        <div className="space-y-3">
          <div className="px-0.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-pink-500" />
              <h3 className="text-sm font-bold text-foreground">什么时候可以找有劲AI？</h3>
            </div>
            <p className="text-[11px] text-muted-foreground ml-3">任何时刻，任何情绪，它都在</p>
          </div>
          <div className="space-y-2">
            {useCases.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={i}
                  className={`relative p-3.5 rounded-xl ${c.bg} border-l-2 ${c.accent} overflow-hidden`}
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {illustrations[c.illustrationKey] && (
                    <img
                      src={illustrations[c.illustrationKey]}
                      alt=""
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-18 h-18 object-contain opacity-20 pointer-events-none select-none"
                      loading="lazy"
                    />
                  )}
                  <div className="flex items-start gap-3 relative z-10">
                    <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0 mt-0.5 bg-white/60 shadow-sm ${illustrations[c.illustrationKey] ? '' : c.iconBg}`}>
                      {illustrations[c.illustrationKey] ? (
                        <img src={illustrations[c.illustrationKey]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground mb-0.5">{c.title}</h4>
                      <p className="text-[10px] text-foreground/70 leading-relaxed">{c.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 了解更多折叠区（仅完整见证列表） ── */}
      <div className="px-4 pb-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-1.5 py-2 cursor-pointer"
        >
          <span className="text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">还想探索更多？</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <motion.div animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
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
              <div className="pt-3 space-y-5" id="full-testimonials">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
                    <h4 className="text-sm font-bold text-foreground">用户见证</h4>
                    <span className="text-[10px] text-muted-foreground ml-auto">{testimonials.length} 条真实分享</span>
                  </div>
                  <div className="space-y-2.5">
                    {testimonials.map((t, i) => {
                      const gradients = [
                        "from-blue-500/10 to-indigo-500/5",
                        "from-emerald-500/10 to-teal-500/5",
                        "from-purple-500/10 to-violet-500/5",
                        "from-rose-500/10 to-pink-500/5",
                        "from-amber-500/10 to-yellow-500/5",
                        "from-cyan-500/10 to-sky-500/5",
                      ];
                      return (
                        <motion.div
                          key={i}
                          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
                          className={`break-inside-avoid mb-2.5 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} border border-border/30 p-3 shadow-sm`}
                        >
                          <p className="text-[11px] text-foreground/80 leading-relaxed mb-2">
                            <Quote className="inline w-3 h-3 mr-0.5 opacity-30 -translate-y-px" />
                            {t.quote}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                              {illustrations[`avatar_${i}`] ? (
                                <img src={illustrations[`avatar_${i}`]} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                  <span className="text-[8px] text-primary-foreground font-bold">{t.name[0]}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-foreground font-medium">{t.name} · <span className="text-muted-foreground/70">{t.identity}</span></p>
                            </div>
                            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] text-primary font-medium">
                              {t.tag}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

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

      {/* ── 测评选择弹窗 ── */}
      <AssessmentPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        assessments={pickerAssessments}
      />
    </div>
  );
};

export default MiniAppEntry;

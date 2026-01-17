import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, ArrowRight, Clock, Lock, GraduationCap, Eye, Heart, Lightbulb, RefreshCw, Target, ChevronRight, Sparkles, Users, BookOpen, Loader2 } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import { categories as toolCategories } from "@/config/energyStudioTools";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

// 四层支持系统数据
const fourLayers = [
  { 
    level: 1, 
    emoji: '📝', 
    name: '轻记录入口', 
    desc: '6大觉醒维度：情绪/感恩/行动/选择/关系/方向',
    color: 'bg-amber-100 text-amber-700',
    gradient: 'from-amber-400 to-orange-500',
    route: '/awakening-intro'
  },
  { 
    level: 2, 
    emoji: '🪞', 
    name: '智能看见', 
    desc: '5件事：看见状态、告诉正常、指出盲点、新角度、微行动',
    color: 'bg-blue-100 text-blue-700',
    gradient: 'from-blue-400 to-cyan-500',
    route: '/emotion-button-intro'
  },
  { 
    level: 3, 
    emoji: '🤍', 
    name: 'AI教练深入', 
    desc: '当问题反复出现时，专业AI教练陪你深入理清',
    color: 'bg-purple-100 text-purple-700',
    gradient: 'from-purple-400 to-pink-500',
    route: '/coach-space-intro'
  },
  { 
    level: 4, 
    emoji: '🤝', 
    name: '真人支持', 
    desc: '21天训练营 + 真人教练，被陪着走一段',
    color: 'bg-teal-100 text-teal-700',
    gradient: 'from-teal-400 to-emerald-500',
    route: '/camps'
  },
];

// 教练Emoji映射
const coachEmojiMap: Record<string, string> = {
  emotion: '💚',
  parent: '👨‍👩‍👧',
  story: '📖',
  vibrant_life_sage: '❤️',
  communication: '💬',
  wealth_coach_4_questions: '💰',
  gratitude_coach: '🌸',
};

// 教练场景映射
const coachScenarios: Record<string, string[]> = {
  emotion: ['焦虑', '压力', '情绪低落'],
  wealth_coach_4_questions: ['财务焦虑', '卡点突破'],
  parent: ['亲子冲突', '沟通障碍'],
  communication: ['人际关系', '职场沟通'],
  story: ['人生规划', '自我探索'],
  gratitude_coach: ['幸福感提升', '正向心态'],
  vibrant_life_sage: ['日常问题', '综合陪伴'],
};

// 教练渐变映射
const coachGradientMap: Record<string, string> = {
  emotion: 'from-emerald-400 to-teal-500',
  parent: 'from-pink-400 to-rose-500',
  story: 'from-amber-400 to-orange-500',
  vibrant_life_sage: 'from-rose-400 to-pink-500',
  communication: 'from-blue-400 to-indigo-500',
  wealth_coach_4_questions: 'from-amber-400 to-yellow-500',
  gratitude_coach: 'from-pink-300 to-rose-400',
};


// 用户价值
const userValues = [
  { emoji: '🎯', text: '清晰方向' },
  { emoji: '💪', text: '稳定心态' },
  { emoji: '✅', text: '可执行行动' },
  { emoji: '📈', text: '持续成长' },
  { emoji: '🤗', text: '被理解、被陪伴的力量' },
];

// 核心价值（3项）
const platformCoreValues = [
  { 
    num: 1,
    title: '温暖陪伴与真实关系', 
    desc: '提供情绪理解、倾听、反思，帮助你被看见',
    gradient: 'from-rose-400 to-pink-500',
    route: '/vibrant-life-intro'
  },
  { 
    num: 2,
    title: '系统工具与实用方法', 
    desc: '结构化流程：看见 → 理解 → 行动 → 成长',
    gradient: 'from-blue-400 to-indigo-500',
    route: '/transformation-flow'
  },
  { 
    num: 3,
    title: '社群联结与成长共振', 
    desc: '绽放故事、伙伴支持、训练营，让改变不再孤单',
    gradient: 'from-amber-400 to-orange-500',
    route: '/camps'
  },
];

// 教练核心价值
const coachCoreValues = [
  { icon: Clock, title: '24/7 随时陪伴', description: '不分时间地点', gradient: 'from-blue-400 to-cyan-500', route: '/coach-space-intro' },
  { icon: Lock, title: '隐私安全', description: '加密保护对话', gradient: 'from-emerald-400 to-teal-500', route: '/introduction' },
  { icon: GraduationCap, title: '专业陪伴', description: '心理学框架', gradient: 'from-violet-400 to-purple-500', route: '/vibrant-life-intro' },
  { icon: BookOpen, title: 'AI分析报告', description: '日报/周报/档案', gradient: 'from-amber-400 to-orange-500', route: '/coach-space-intro' },
];

// 生活馆关键功能
const studioKeyFeatures = [
  { emoji: '🔮', name: '觉醒入口', desc: '6维深度觉察训练', route: '/awakening' },
  { emoji: '💰', name: '财富卡点测评', desc: 'AI财富心理测评', route: '/wealth-block' },
  { emoji: '📚', name: '学习课程', desc: '情绪/财富课程库', route: '/courses' },
  { emoji: '🏕️', name: '训练营', desc: '21天系统训练', route: '/camps' },
];

// 合伙人类型
const partnerTypes = [
  { 
    emoji: '💪', 
    name: '有劲合伙人', 
    desc: '体验包分发模式',
    price: '¥999起',
    features: ['预购体验包', '分发建立关系', '持续佣金20%-50%'],
    route: '/partner/youjin-intro',
    gradient: 'from-orange-400 to-amber-500'
  },
  { 
    emoji: '👑', 
    name: '绽放合伙人', 
    desc: '直推分成模式',
    price: '¥19,800',
    features: ['直推30%佣金', '二级10%佣金', '永久收益'],
    route: '/partner-intro',
    gradient: 'from-purple-400 to-pink-500'
  },
];

// 快捷入口 - 全站16+介绍页完整覆盖
const quickLinks = [
  { category: '教练相关', links: [
    { name: '教练空间介绍', route: '/coach-space-intro' },
    { name: '生活教练', route: '/vibrant-life-intro' },
    { name: '情绪教练', route: '/emotion-button-intro' },
    { name: '亲子教练', route: '/parent-coach-intro' },
    { name: '亲子双轨模式', route: '/parent-teen-intro' },
    { name: '财富教练', route: '/wealth-coach-intro' },
    { name: '沟通教练', route: '/communication-intro' },
    { name: '故事教练', route: '/story-coach-intro' },
  ]},
  { category: '工具相关', links: [
    { name: '生活馆介绍', route: '/energy-studio-intro' },
    { name: '觉醒系统', route: '/awakening-intro' },
    { name: '感恩日记', route: '/gratitude-journal-intro' },
    { name: '安全打卡', route: '/alive-check-intro' },
    { name: '四层支持', route: '/transformation-flow' },
  ]},
  { category: '训练营', links: [
    { name: '训练营列表', route: '/camps' },
    { name: '财富训练营', route: '/wealth-camp-intro' },
  ]},
  { category: '商业相关', links: [
    { name: '有劲合伙人', route: '/partner/youjin-intro' },
    { name: '绽放合伙人', route: '/partner-intro' },
    { name: '推广指南', route: '/partner/promo-guide' },
  ]},
];

// 优化后的动画变体 - 使用更轻量的动画以提升移动端性能
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25
    }
  }
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2
    }
  }
};

const slideVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25
    }
  }
};

// 骨架屏组件
const PlatformIntroSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-[env(safe-area-inset-bottom)]">
    {/* Header Skeleton */}
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-4 h-14">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
    </header>

    <div className="px-4 pt-4 pb-4">
      {/* Core Definition Skeleton */}
      <Skeleton className="h-20 rounded-xl mb-4" />
      
      {/* User Values Skeleton */}
      <Skeleton className="h-24 rounded-xl mb-4" />
      
      {/* Mission & Vision Skeleton */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      
      {/* Core Values Skeleton */}
      <div className="flex gap-2 mb-4 overflow-hidden">
        <Skeleton className="w-[150px] h-32 rounded-xl flex-shrink-0" />
        <Skeleton className="w-[150px] h-32 rounded-xl flex-shrink-0" />
        <Skeleton className="w-[150px] h-32 rounded-xl flex-shrink-0" />
      </div>
      
      {/* CTA Skeleton */}
      <Skeleton className="h-11 rounded-lg" />
    </div>

    <div className="mx-4 h-px bg-slate-100" />

    {/* Four Layers Skeleton */}
    <div className="px-4 py-4">
      <Skeleton className="w-32 h-5 mb-3" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

const PlatformIntro = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading, refetch } = useActiveCoachTemplates();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // 页面加载完成后设置状态
  React.useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 下拉刷新处理
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const {
    containerRef: pullContainerRef,
    pullDistance,
    pullProgress,
    isRefreshing,
    pullStyle
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 60,
    maxPull: 100
  });

  // 合并 ref
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (pullContainerRef) {
      (pullContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [pullContainerRef]);

  // 显示骨架屏
  if (!isPageLoaded) {
    return <PlatformIntroSkeleton />;
  }

  return (
    <div 
      ref={setRefs}
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-[env(safe-area-inset-bottom)] overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="platformIntro" />
      
      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-14 left-0 right-0 flex items-center justify-center pointer-events-none z-20"
          style={{ 
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            transition: isRefreshing ? 'height 0.3s ease-out' : 'none'
          }}
        >
          <div 
            className={`flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 shadow-lg transition-all duration-200 ${
              pullDistance >= 60 ? 'scale-110 bg-primary/10 border-primary/30' : ''
            }`}
            style={{
              opacity: Math.min(pullProgress * 1.5, 1),
              transform: `rotate(${pullProgress * 180}deg)`
            }}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <RefreshCw className={`w-4 h-4 transition-colors ${
                pullDistance >= 60 ? 'text-primary' : 'text-slate-400'
              }`} />
            )}
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-slate-800">平台介绍</h1>
          <IntroShareDialog config={introShareConfigs.platformIntro} />
        </div>
      </header>

      {/* 内容区域 - 添加 transform 优化 */}
      <div style={pullStyle} className="will-change-transform">
        {/* 第一章｜什么是有劲AI？ */}
        <section className="relative px-4 pt-4 pb-4 overflow-hidden">
          {/* 背景装饰 - 使用 GPU 加速 */}
          <div 
            className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 will-change-transform" 
            style={{ transform: 'translate3d(50%, -50%, 0)' }}
          />
          <div 
            className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-warm/20 to-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 will-change-transform" 
            style={{ transform: 'translate3d(-50%, 50%, 0)' }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative"
          >
            {/* 核心定义 - 突出视觉 */}
            <Card className="p-3 sm:p-4 border border-primary/10 shadow-md bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5 mb-4 transform-gpu">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-warm flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-2xl sm:text-3xl">🌟</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">有劲AI是一位</p>
                  <p className="text-primary font-bold text-base sm:text-lg">懂你、陪你、帮你成长的生活教练</p>
                </div>
              </div>
            </Card>
            
            
            {/* 用户价值 - 紧凑两行居中 */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="p-3 sm:p-4 border border-slate-100 shadow-sm mb-4 bg-gradient-to-br from-slate-50 to-white transform-gpu">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3 text-center">在生活里获得：</p>
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {userValues.map((value, index) => (
                    <motion.span 
                      key={index} 
                      variants={scaleVariants}
                      className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-primary/10 text-slate-700 rounded-full text-[11px] sm:text-xs font-medium shadow-sm border border-primary/5 transform-gpu"
                    >
                      {value.emoji} {value.text}
                    </motion.span>
                  ))}
                </div>
              </Card>
            </motion.div>
            
            {/* 使命与愿景 - 增强视觉 */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
              <Card 
                className="p-3 sm:p-4 border border-rose-200 shadow-md bg-gradient-to-br from-rose-50 via-pink-50 to-white hover:shadow-lg transition-shadow cursor-pointer transform-gpu active:scale-[0.98]"
                onClick={() => navigate('/introduction')}
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-sm">
                    <span className="text-base sm:text-lg">🎯</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-rose-600">使命 Mission</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  让好的行为变得简单，让更好的自己成为必然
                </p>
              </Card>
              <Card 
                className="p-3 sm:p-4 border border-blue-200 shadow-md bg-gradient-to-br from-blue-50 via-indigo-50 to-white hover:shadow-lg transition-shadow cursor-pointer transform-gpu active:scale-[0.98]"
                onClick={() => navigate('/introduction')}
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                    <span className="text-base sm:text-lg">🔭</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-600">愿景 Vision</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  让 AI 成为每一个人的生活教练，让成长可见、可感、可持续
                </p>
              </Card>
            </div>
            
            {/* 核心价值（3项）- 真正横向滚动 */}
            <motion.div 
              className="mb-4 sm:mb-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  核心价值
                </p>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  左右滑动 <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
                <div className="flex gap-2 sm:gap-3" style={{ width: 'max-content' }}>
                  {platformCoreValues.map((value, index) => (
                    <motion.div
                      key={value.num}
                      variants={scaleVariants}
                      custom={index}
                    >
                      <Card 
                        className={`w-[145px] xs:w-[165px] flex-shrink-0 p-3 sm:p-4 border-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] bg-white cursor-pointer transform-gpu ${value.num === 1 ? 'border-rose-200' : value.num === 2 ? 'border-blue-200' : 'border-amber-200'}`}
                        onClick={() => navigate(value.route)}
                      >
                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-2 sm:mb-3 shadow-md`}>
                          <span className="text-white text-sm sm:text-base font-bold">{value.num}</span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 mb-1 sm:mb-1.5">{value.title}</h4>
                        <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">{value.desc}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 mt-1.5 sm:mt-2" />
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* CTA */}
            <Button 
              onClick={() => navigate('/coach/vibrant_life_sage')}
              size="lg"
              className="w-full min-h-[44px] bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-shadow text-sm sm:text-base transform-gpu active:scale-[0.98]"
            >
              立即体验 <ArrowRight className="w-5 h-5 ml-1.5" />
            </Button>
          </motion.div>
        </section>

        {/* 分隔线 */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 四层支持系统 */}
        <section className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-lg sm:text-xl">🏗️</span> 四层支持系统
            </h3>
          </motion.div>
          
          <motion.div 
            className="space-y-2 sm:space-y-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {fourLayers.map((layer) => (
              <motion.div
                key={layer.level}
                variants={slideVariants}
              >
                <Card 
                  className="p-3 sm:p-4 border border-slate-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer transform-gpu active:scale-[0.98]"
                  onClick={() => navigate(layer.route)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${layer.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-xl sm:text-2xl">{layer.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                        <span className={`px-1.5 sm:px-2 py-0.5 ${layer.color} rounded-md text-[10px] sm:text-xs font-bold`}>L{layer.level}</span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800">{layer.name}</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{layer.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 flex-shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.25 }}
          >
            <Button 
              variant="outline" 
              className="w-full mt-3 sm:mt-4 min-h-[44px] text-primary border-primary/30 hover:bg-primary/5 transform-gpu active:scale-[0.98]"
              onClick={() => navigate('/transformation-flow')}
            >
              了解四层支持详情 <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </section>

        {/* 分隔线 */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 教练空间 */}
        <section className="px-4 py-4 bg-gradient-to-b from-slate-50/80 to-white">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-lg sm:text-xl">🤖</span> 教练空间
            </h3>
          </motion.div>
          
          {/* 核心价值 */}
          <motion.div 
            className="grid grid-cols-2 xs:grid-cols-4 gap-2 mb-3 sm:mb-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {coachCoreValues.map((value) => (
              <motion.div
                key={value.title}
                variants={scaleVariants}
              >
                <Card 
                  className="p-2 text-center border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-h-[72px] transform-gpu active:scale-[0.97]"
                  onClick={() => navigate(value.route)}
                >
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br ${value.gradient} flex items-center justify-center`}>
                    <value.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h4 className="text-[10px] font-semibold text-slate-700 leading-tight">{value.title}</h4>
                  <p className="text-[9px] text-slate-500">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          
          {/* 教练列表 */}
          <div className="grid grid-cols-2 gap-2">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))
            ) : (
              templates?.slice(0, 6).map((coach, index) => {
                const emoji = coachEmojiMap[coach.coach_key] || '🤖';
                const scenarios = coachScenarios[coach.coach_key] || [];
                const gradient = coachGradientMap[coach.coach_key] || 'from-slate-400 to-slate-500';
                
                return (
                  <motion.div
                    key={coach.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                  >
                    <Card 
                      className="p-3 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer transform-gpu active:scale-[0.97]"
                      onClick={() => coach.page_route && navigate(coach.page_route)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-lg">{emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-slate-800 truncate">{coach.title}</h4>
                          {scenarios.length > 0 && (
                            <p className="text-[10px] text-slate-500 truncate">{scenarios.join(' · ')}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full mt-2 sm:mt-3 min-h-[44px] text-primary transform-gpu active:scale-[0.98]"
            onClick={() => navigate('/coach-space')}
          >
            进入教练空间 <ChevronRight className="w-4 h-4" />
          </Button>
        </section>

        {/* 分隔线 */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 有劲生活馆 */}
        <section className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-lg sm:text-xl">🏛️</span> 有劲生活馆
            </h3>
          </motion.div>
          
          {/* 三大工具分类 */}
          <motion.div 
            className="grid grid-cols-3 gap-2 mb-3 sm:mb-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {toolCategories.map((category) => (
              <motion.div
                key={category.id}
                variants={scaleVariants}
              >
                <Card 
                  className={`p-2 text-center border-0 shadow-sm bg-gradient-to-br ${category.tabGradient} text-white cursor-pointer transition-transform min-h-[56px] transform-gpu active:scale-[0.95]`}
                  onClick={() => navigate('/energy-studio')}
                >
                  <span className="text-lg sm:text-xl block mb-0.5">{category.emoji}</span>
                  <h4 className="text-[10px] font-semibold">{category.name}</h4>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          {/* 关键功能入口 */}
          <motion.div 
            className="grid grid-cols-2 gap-2"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {studioKeyFeatures.map((feature) => (
              <motion.div
                key={feature.name}
                variants={itemVariants}
              >
                <Card 
                  className="p-2.5 sm:p-3 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer min-h-[56px] transform-gpu active:scale-[0.97]"
                  onClick={() => navigate(feature.route)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{feature.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-slate-800">{feature.name}</h4>
                      <p className="text-[10px] text-slate-500">{feature.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.25 }}
          >
            <Button 
              variant="ghost" 
              className="w-full mt-2 sm:mt-3 min-h-[44px] text-primary transform-gpu active:scale-[0.98]"
              onClick={() => navigate('/energy-studio')}
            >
              进入有劲生活馆 <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </section>

        {/* 分隔线 */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 合伙人体系 */}
        <section className="px-4 py-4 bg-gradient-to-b from-slate-50/80 to-white">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1.5 sm:mb-2 flex items-center gap-2">
              <span className="text-lg sm:text-xl">🤝</span> 合伙人体系
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">
              分享的不是商品，而是被帮助到的体验
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 gap-2 sm:gap-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {partnerTypes.map((partner) => (
              <motion.div
                key={partner.name}
                variants={itemVariants}
              >
                <Card 
                  className="p-2.5 sm:p-3 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full min-h-[140px] transform-gpu active:scale-[0.97]"
                  onClick={() => navigate(partner.route)}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${partner.gradient} flex items-center justify-center mb-2`}>
                    <span className="text-xl sm:text-2xl">{partner.emoji}</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 mb-0.5">{partner.name}</h4>
                  <p className="text-[10px] text-slate-500 mb-1">{partner.desc}</p>
                  <p className="text-[11px] sm:text-xs font-semibold text-primary mb-1.5 sm:mb-2">{partner.price}</p>
                  <div className="space-y-0.5">
                    {partner.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-600">
                        <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          {/* 价值闭环 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.25 }}
          >
            <Card className="mt-3 sm:mt-4 p-2.5 sm:p-3 border-0 shadow-sm bg-gradient-to-r from-primary/5 via-accent/5 to-warm/5 transform-gpu">
              <p className="text-[9px] sm:text-[10px] text-center text-slate-600">
                <span className="font-medium">价值闭环：</span> 用户体验 → 感受改变 → 成为会员 → 参加训练营 → 成为合伙人 → 持续被动收入
              </p>
            </Card>
          </motion.div>
        </section>

        {/* 分隔线 */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 快捷入口导航 */}
        <section className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-lg sm:text-xl">🔗</span> 更多了解
            </h3>
          </motion.div>
          
          <motion.div 
            className="space-y-2.5 sm:space-y-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {quickLinks.map((group, groupIndex) => (
              <motion.div 
                key={group.category}
                variants={itemVariants}
                custom={groupIndex}
              >
                <p className="text-[11px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2">{group.category}</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {group.links.map((link, linkIndex) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: groupIndex * 0.05 + linkIndex * 0.02, duration: 0.15 }}
                    >
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/10 transition-colors text-[11px] sm:text-xs px-2 sm:px-2.5 py-1.5 min-h-[32px] transform-gpu active:scale-[0.95]"
                        onClick={() => navigate(link.route)}
                      >
                        {link.name}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 py-6 pb-[max(env(safe-area-inset-bottom),24px)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Card className="p-4 sm:p-6 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5 border-0 shadow-sm transform-gpu">
              <span className="text-2xl sm:text-3xl mb-2 sm:mb-3 block">🚀</span>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5 sm:mb-2">
                准备好开始你的成长之旅了吗？
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
                每一次对话，都是一次自我觉察的机会
              </p>
              
              <Button 
                onClick={() => navigate('/coach/vibrant_life_sage')}
                size="lg"
                className="w-full min-h-[48px] bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base py-4 sm:py-6 transform-gpu active:scale-[0.98]"
              >
                🚀 开始体验有劲AI <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default PlatformIntro;

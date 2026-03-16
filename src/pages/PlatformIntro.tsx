import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, ArrowRight, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

// 四层支持系统数据
const fourLayers = [
  { 
    level: 1, emoji: '📝', name: '轻记录入口', 
    desc: '6大觉醒维度：情绪/感恩/行动/选择/关系/方向',
    color: 'bg-amber-100 text-amber-700',
    gradient: 'from-amber-400 to-orange-500',
    route: '/awakening-intro'
  },
  { 
    level: 2, emoji: '🪞', name: '智能看见', 
    desc: '5件事：看见状态、告诉正常、指出盲点、新角度、微行动',
    color: 'bg-blue-100 text-blue-700',
    gradient: 'from-blue-400 to-cyan-500',
    route: '/emotion-button-intro'
  },
  { 
    level: 3, emoji: '🤍', name: 'AI教练深入', 
    desc: '当问题反复出现时，专业AI教练陪你深入理清',
    color: 'bg-purple-100 text-purple-700',
    gradient: 'from-purple-400 to-pink-500',
    route: '/coach-space-intro'
  },
  { 
    level: 4, emoji: '🤝', name: '真人支持', 
    desc: '21天训练营 + 真人教练，被陪着走一段',
    color: 'bg-teal-100 text-teal-700',
    gradient: 'from-teal-400 to-emerald-500',
    route: '/camps'
  },
];

// 痛点共鸣
const painPoints = [
  { emoji: '😤', text: '情绪反复失控' },
  { emoji: '😰', text: '总觉得累说不清' },
  { emoji: '🔄', text: '道理都懂做不到' },
  { emoji: '🌫️', text: '迷茫没有方向' },
];

// 用户价值
const userValues = [
  { emoji: '🎯', text: '清晰方向' },
  { emoji: '💪', text: '稳定心态' },
  { emoji: '✅', text: '行动力提升' },
  { emoji: '🤗', text: '被理解陪伴' },
];

// 快捷入口
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
    { name: '每日安全守护', route: '/alive-check-intro' },
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
};

const slideVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } }
};

// 骨架屏
const PlatformIntroSkeleton = () => (
  <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-[env(safe-area-inset-bottom)]" style={{ WebkitOverflowScrolling: 'touch' }}>
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-4 h-14">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
    </header>
    <div className="px-4 pt-4 pb-4">
      <Skeleton className="h-20 rounded-xl mb-4" />
      <Skeleton className="h-24 rounded-xl mb-4" />
      <Skeleton className="h-11 rounded-lg mb-6" />
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    // no-op, kept for pull-to-refresh UX
  }, []);

  const {
    containerRef: pullContainerRef,
    pullDistance,
    pullProgress,
    isRefreshing,
    pullStyle
  } = usePullToRefresh({ onRefresh: handleRefresh, threshold: 60, maxPull: 100 });

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (pullContainerRef) {
      (pullContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [pullContainerRef]);

  if (!isPageLoaded) return <PlatformIntroSkeleton />;

  return (
    <div 
      ref={setRefs}
      className="h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-[env(safe-area-inset-bottom)] overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="platformIntro" />
      
      {/* Pull to Refresh */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-14 left-0 right-0 flex items-center justify-center pointer-events-none z-20"
          style={{ height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`, transition: isRefreshing ? 'height 0.3s ease-out' : 'none' }}
        >
          <div 
            className={`flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 shadow-lg transition-all duration-200 ${pullDistance >= 60 ? 'scale-110 bg-primary/10 border-primary/30' : ''}`}
            style={{ opacity: Math.min(pullProgress * 1.5, 1), transform: `rotate(${pullProgress * 180}deg)` }}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <RefreshCw className={`w-4 h-4 transition-colors ${pullDistance >= 60 ? 'text-primary' : 'text-slate-400'}`} />
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

      <div style={pullStyle} className="will-change-transform">
        {/* Hero 区 */}
        <section className="relative px-4 pt-8 pb-6 sm:pt-10 sm:pb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/15 to-accent/15 rounded-full blur-3xl will-change-transform" style={{ transform: 'translate3d(30%, -40%, 0)' }} />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-warm/15 to-primary/15 rounded-full blur-3xl will-change-transform" style={{ transform: 'translate3d(-30%, 40%, 0)' }} />
          
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative text-center"
          >
            <span className="text-4xl sm:text-5xl mb-3 block">🌟</span>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 leading-tight">
              懂你、陪你、帮你成长的
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block mt-1">生活教练</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">基于领导力的生活教练系统</p>

            {/* 痛点 */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {painPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/5 border border-destructive/10 transform-gpu"
                >
                  <span className="text-base">{point.emoji}</span>
                  <span className="text-xs text-muted-foreground text-left">{point.text}</span>
                </motion.div>
              ))}
            </div>

            {/* 改变 */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {userValues.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10 transform-gpu"
                >
                  <span className="text-base">{value.emoji}</span>
                  <span className="text-xs font-medium text-foreground text-left">{value.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <Button 
              onClick={() => navigate('/coach/vibrant_life_sage')}
              size="lg"
              className="w-full min-h-[48px] bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-shadow text-sm sm:text-base transform-gpu active:scale-[0.98]"
            >
              立即体验 <ArrowRight className="w-5 h-5 ml-1.5" />
            </Button>
          </motion.div>
        </section>

        {/* 四层支持系统 */}
        <section className="px-4 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-sm sm:text-base font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
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
              <motion.div key={layer.level} variants={slideVariants}>
                <Card 
                  className="p-3 sm:p-4 border border-border/50 shadow-md hover:shadow-lg transition-shadow cursor-pointer transform-gpu active:scale-[0.98]"
                  onClick={() => navigate(layer.route)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${layer.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-xl sm:text-2xl">{layer.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                        <span className={`px-1.5 sm:px-2 py-0.5 ${layer.color} rounded-md text-[10px] sm:text-xs font-bold`}>L{layer.level}</span>
                        <h4 className="font-bold text-xs sm:text-sm text-foreground">{layer.name}</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{layer.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50 flex-shrink-0" />
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

        {/* 快捷入口导航 */}
        <section className="px-4 py-6 sm:py-8 pb-[max(env(safe-area-inset-bottom),24px)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-sm sm:text-base font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
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
              <motion.div key={group.category} variants={itemVariants} custom={groupIndex}>
                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{group.category}</p>
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
      </div>
    </div>
  );
};

export default PlatformIntro;

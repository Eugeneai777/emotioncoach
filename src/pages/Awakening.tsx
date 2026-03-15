import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isWeChatMiniProgram } from "@/utils/platform";
import { motion } from "framer-motion";
import { ArrowLeft, Share2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { awakeningDimensions, AwakeningDimension } from "@/config/awakeningConfig";
import AwakeningEntryCard from "@/components/awakening/AwakeningEntryCard";
import AwakeningDrawer from "@/components/awakening/AwakeningDrawer";

import AwakeningHeroCard from "@/components/awakening/AwakeningHeroCard";
import AwakeningPainPointCard from "@/components/awakening/AwakeningPainPointCard";

import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";

// 错误边界：防止子组件崩溃导致白屏
class AwakeningErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Awakening] ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <p className="text-lg font-medium text-foreground">页面加载出错</p>
            <p className="text-sm text-muted-foreground">请刷新页面重试</p>
            <Button onClick={() => window.location.reload()}>刷新页面</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 安全渲染 OG Meta
const SafeOGMeta: React.FC = () => {
  try {
    return <DynamicOGMeta pageKey="awakening" />;
  } catch {
    return null;
  }
};

const Awakening: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedDimension, setSelectedDimension] = useState<AwakeningDimension | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 分类维度
  const challengeDimensions = awakeningDimensions.filter(d => d.category === 'challenge');
  const blessingDimensions = awakeningDimensions.filter(d => d.category === 'blessing');

  // 小程序入口页：把 mp_openid / mp_unionid 缓存下来，供后续页面（如产品中心）支付复用
  useEffect(() => {
    if (!isWeChatMiniProgram()) return;

    const mpOpenId = searchParams.get('mp_openid') || undefined;
    const mpUnionId = searchParams.get('mp_unionid') || undefined;

    if (mpOpenId) {
      sessionStorage.setItem('wechat_mp_openid', mpOpenId);
      console.log('[Awakening] Cached mp_openid for MiniProgram');
    }
    if (mpUnionId) {
      sessionStorage.setItem('wechat_mp_unionid', mpUnionId);
      console.log('[Awakening] Cached mp_unionid for MiniProgram');
    }
  }, [searchParams]);

  const handleEntryClick = (dimension: AwakeningDimension) => {
    setSelectedDimension(dimension);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDimension(null);
  };

  return (
    <AwakeningErrorBoundary>
      <SafeOGMeta />

      <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-muted/30" style={{ WebkitOverflowScrolling: 'touch' as any }}>
        {/* Header - 更紧凑 */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/coach/wealth_coach_4_questions')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-semibold">觉察日记</h1>
            <IntroShareDialog
              config={introShareConfigs.awakening}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share2 className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </header>

        {/* Main Content - 更紧凑间距 */}
        <main className="max-w-lg mx-auto px-3 py-3 pb-24 space-y-3">
          {/* Hero区：核心标语 */}
          <AwakeningHeroCard />

          {/* 痛点共鸣卡片 */}
          <AwakeningPainPointCard />

          {/* 分类入口卡片 */}
          <div className="space-y-2.5">
            {/* 困境记录 */}
            <div className="space-y-1.5">
              <motion.div
                initial={{ opacity: 0.01, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                className="flex items-center gap-1.5 motion-fallback"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-destructive/30 to-transparent" />
                <span className="text-[11px] font-medium text-destructive/80 flex items-center gap-0.5">
                  <span>🔥</span> 困境 → 破局关键点
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-destructive/30 to-transparent" />
              </motion.div>
              <div className="grid grid-cols-3 gap-1.5">
                {challengeDimensions.map((dimension, index) => (
                  <AwakeningEntryCard
                    key={dimension.id}
                    dimension={dimension}
                    onClick={() => handleEntryClick(dimension)}
                    index={index}
                    compact
                  />
                ))}
              </div>
            </div>

            {/* 顺境记录 */}
            <div className="space-y-1.5">
              <motion.div
                initial={{ opacity: 0.01, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                className="flex items-center gap-1.5 motion-fallback"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <span className="text-[11px] font-medium text-primary/80 flex items-center gap-0.5">
                  <span>✨</span> 顺境 → 滋养与锚定
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              </motion.div>
              <div className="grid grid-cols-3 gap-1.5">
                {blessingDimensions.map((dimension, index) => (
                  <AwakeningEntryCard
                    key={dimension.id}
                    dimension={dimension}
                    onClick={() => handleEntryClick(dimension)}
                    index={index + 3}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 底部金句 */}
          <motion.div
            initial={{ opacity: 0.01 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ transform: 'translateZ(0)', willChange: 'opacity' }}
            className="text-center text-[10px] text-muted-foreground pt-1 motion-fallback"
          >
            <p>把平凡日常积累成个人成长的复利资产</p>
            <p className="mt-0.5">将碎片化时间冶炼成金 ✨</p>
          </motion.div>
        </main>

        {/* 底部凸起导航 */}
        <AwakeningBottomNav />

        {/* 输入抽屉 */}
        <AwakeningDrawer dimension={selectedDimension} isOpen={isDrawerOpen} onClose={handleDrawerClose} />
      </div>
    </AwakeningErrorBoundary>
  );
};

export default Awakening;

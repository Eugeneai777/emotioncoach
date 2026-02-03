import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isWeChatMiniProgram } from "@/utils/platform";
import { motion } from "framer-motion";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { awakeningDimensions, AwakeningDimension } from "@/config/awakeningConfig";
import AwakeningEntryCard from "@/components/awakening/AwakeningEntryCard";
import AwakeningDrawer from "@/components/awakening/AwakeningDrawer";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import AwakeningHeroCard from "@/components/awakening/AwakeningHeroCard";
import AwakeningPainPointCard from "@/components/awakening/AwakeningPainPointCard";

import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";

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
    <>
      <DynamicOGMeta pageKey="awakening" />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate('/coach/wealth_coach_4_questions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">觉察日记</h1>
            <IntroShareDialog
              config={introShareConfigs.awakening}
              trigger={
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              }
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
          {/* Hero区：核心标语 */}
          <AwakeningHeroCard />

          {/* 痛点共鸣卡片 */}
          <AwakeningPainPointCard />

          {/* 分类说明 */}
          <div className="space-y-3">
            {/* 困境记录 */}
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0.01, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                className="flex items-center gap-2"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-destructive/30 to-transparent" />
                <span className="text-sm font-medium text-destructive/80 flex items-center gap-1">
                  <span>🔥</span> 困境 → 破局关键点
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-destructive/30 to-transparent" />
              </motion.div>
              <div className="grid grid-cols-3 gap-2">
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
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0.01, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                className="flex items-center gap-2"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <span className="text-sm font-medium text-primary/80 flex items-center gap-1">
                  <span>✨</span> 顺境 → 滋养与锚定
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              </motion.div>
              <div className="grid grid-cols-3 gap-2">
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
            className="text-center text-xs text-muted-foreground pt-2"
          >
            <p>把平凡日常积累成个人成长的复利资产</p>
            <p className="mt-1">将碎片化时间冶炼成金 ✨</p>
          </motion.div>
        </main>

        {/* 底部凸起导航 */}
        <AwakeningBottomNav />

        {/* 输入抽屉 */}
        <AwakeningDrawer dimension={selectedDimension} isOpen={isDrawerOpen} onClose={handleDrawerClose} />
      </div>
    </>
  );
};

export default Awakening;

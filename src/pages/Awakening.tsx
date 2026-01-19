import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isWeChatMiniProgram } from "@/utils/platform";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Info, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { awakeningDimensions, AwakeningDimension } from "@/config/awakeningConfig";
import AwakeningEntryCard from "@/components/awakening/AwakeningEntryCard";
import AwakeningDrawer from "@/components/awakening/AwakeningDrawer";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
const Awakening: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedDimension, setSelectedDimension] = useState<AwakeningDimension | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
  return <>
      <DynamicOGMeta pageKey="awakening" />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate('/coach/wealth_coach_4_questions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">觉察入口</h1>
            <Button variant="ghost" size="icon" onClick={() => navigate('/awakening-journal')}>
              <BookOpen className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-6 pb-28 space-y-6">
          {/* 标题区 */}
          <motion.div 
            initial={{ opacity: 0.01, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="text-center space-y-2"
          >
            
            <p className="text-sm text-muted-foreground">
              每天1次轻记录 → 我帮你看见盲点与模式 → 给你一个最小行动
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/awakening-intro')}
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Info className="w-4 h-4 mr-1" />
                六大入口
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/transformation-flow')}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Layers className="w-4 h-4 mr-1" />
                四层支持
              </Button>
            </div>
          </motion.div>

          {/* 6宫格入口 */}
          <div className="grid grid-cols-2 gap-4">
            {awakeningDimensions.map((dimension, index) => <AwakeningEntryCard key={dimension.id} dimension={dimension} onClick={() => handleEntryClick(dimension)} index={index} />)}
          </div>

        </main>

        {/* 底部凸起导航 */}
        <AwakeningBottomNav />

        {/* 输入抽屉 */}
        <AwakeningDrawer dimension={selectedDimension} isOpen={isDrawerOpen} onClose={handleDrawerClose} />
      </div>
    </>;
};
export default Awakening;
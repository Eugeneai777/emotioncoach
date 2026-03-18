import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import logoImage from "@/assets/youjin-ai-logo.png";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { hasActiveSession, getActiveSession } from "@/hooks/useVoiceSessionLock";
import { preheatTokenEndpoint, prewarmMicrophoneStream } from "@/utils/RealtimeAudio";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";

const POINTS_PER_MINUTE = 8;
const MEMBER_365_PACKAGE = {
  key: 'member365',
  name: '365会员',
  price: 365,
  quota: 1000
};

const AwakeningBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);

  // 预热 Edge Function 和麦克风
  const handlePreheat = useCallback(async () => {
    if (!user) return;
    Promise.all([
      preheatTokenEndpoint('vibrant-life-realtime-token'),
      prewarmMicrophoneStream()
    ]).catch(console.warn);
  }, [user]);

  // 点击语音教练按钮
  const handleVoiceClick = async () => {
    // 检查全局语音会话锁
    if (hasActiveSession()) {
      const session = getActiveSession();
      toast({
        title: "语音通话进行中",
        description: `已有语音会话在进行 (${session.component})，请先结束当前通话`,
      });
      return;
    }

    if (!user) {
      setShowPurchaseDialog(true);
      return;
    }

    // 检查余额
    setIsCheckingQuota(true);
    try {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('remaining_quota')
        .eq('user_id', user.id)
        .single();

      if (!account || account.remaining_quota < POINTS_PER_MINUTE) {
        toast({
          title: "点数不足",
          description: `语音通话需要 ${POINTS_PER_MINUTE} 点/分钟，当前余额 ${account?.remaining_quota || 0} 点`,
        });
        setShowPayDialog(true);
        setIsCheckingQuota(false);
        return;
      }

      setIsCheckingQuota(false);
      setShowVoiceChat(true);
    } catch (error) {
      console.error('Check quota error:', error);
      setIsCheckingQuota(false);
      toast({
        title: "检查余额失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        {/* 背景条 */}
        <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-8">
            {/* 左侧 - 我的 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/my-page')}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors motion-fallback"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">我的</span>
            </motion.button>

            {/* 中间占位 */}
            <div className="w-16" />

            {/* 右侧留白保持对称 */}
            <div className="w-10" />
          </div>
        </div>

        {/* 凸起中心按钮 - 语音教练入口 */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7 flex flex-col items-center">
          {/* 光晕效果 */}
          <motion.div
            className="absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/40 to-orange-500/40 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* 主按钮 */}
          <motion.button
            onClick={handleVoiceClick}
            onMouseEnter={handlePreheat}
            onTouchStart={handlePreheat}
            disabled={isCheckingQuota}
            className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden
                       border-0 shadow-lg shadow-orange-500/30 disabled:opacity-70"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ y: [0, -3, 0] }}
            transition={{ y: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
          >
            <img src={logoImage} alt="有劲AI" className="w-[115%] h-[115%] object-cover" />
          </motion.button>
          <span className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">开始对话</span>
        </div>
      </nav>

      {/* 语音通话界面 */}
      {showVoiceChat && (
        <CoachVoiceChat
          onClose={() => setShowVoiceChat(false)}
          coachEmoji="❤️"
          coachTitle="有劲AI生活教练"
          primaryColor="rose"
          tokenEndpoint="vibrant-life-realtime-token"
          userId={user?.id || ""}
          mode="general"
          featureKey="realtime_voice"
          voiceType={getSavedVoiceType()}
        />
      )}

      {/* 额度不足时弹出365续费 */}
      <UnifiedPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={MEMBER_365_PACKAGE}
        onSuccess={() => {
          toast({
            title: "续费成功！",
            description: "现在可以开始语音对话了 🎉",
          });
          setShowPayDialog(false);
          setShowVoiceChat(true);
        }}
      />

      {/* 未登录时弹出购买引导 */}
      <PurchaseOnboardingDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        triggerFeature="有劲AI语音教练"
        onSuccess={() => {
          setShowPurchaseDialog(false);
          setShowVoiceChat(true);
        }}
      />
    </>
  );
};

export default AwakeningBottomNav;

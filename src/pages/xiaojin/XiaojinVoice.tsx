import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useXiaojinQuota } from "@/hooks/useXiaojinQuota";
import { useAuth } from "@/hooks/useAuth";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";

export default function XiaojinVoice() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { deduct, canAfford, refresh, isGuest } = useXiaojinQuota();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const billingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initRef = useRef(false);

  // 登录态决定计费路径：
  // - 游客：保留本地 100 点 + 前端 setInterval 自扣
  // - 登录用户：交给 CoachVoiceChat 内置 useVoiceBilling，自动按 8 点/分钟扣 user_accounts
  useEffect(() => {
    if (authLoading || initRef.current) return;
    initRef.current = true;

    if (!isGuest) {
      // 登录用户：直接放行进入 CoachVoiceChat，由其内置预检与扣点逻辑接管
      setAllowed(true);
      return;
    }

    // 游客分支：保留原 100 点本地试用逻辑
    if (!canAfford(8)) {
      setShowUpgrade(true);
      return;
    }
    if (deduct(8)) {
      setAllowed(true);
      billingTimerRef.current = setInterval(() => {
        if (!deduct(8)) {
          if (billingTimerRef.current) clearInterval(billingTimerRef.current);
          setShowUpgrade(true);
          navigate("/xiaojin");
        }
      }, 60000);
    } else {
      setShowUpgrade(true);
    }

    return () => {
      if (billingTimerRef.current) clearInterval(billingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isGuest]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">加载中...</div>;
  }

  if (!allowed) {
    return (
      <PurchaseOnboardingDialog
        open={showUpgrade}
        onOpenChange={(open) => {
          setShowUpgrade(open);
          if (!open) navigate("/xiaojin");
        }}
        triggerFeature="语音通话需要至少 8 点"
        onSuccess={() => {
          setShowUpgrade(false);
          navigate("/xiaojin");
        }}
      />
    );
  }

  return (
    <>
      <CoachVoiceChat
        onClose={() => {
          if (billingTimerRef.current) clearInterval(billingTimerRef.current);
          refresh();
          navigate("/xiaojin");
        }}
        coachEmoji="✨"
        coachTitle="小劲"
        primaryColor="orange"
        tokenEndpoint="vibrant-life-realtime-token"
        mode="teen"
        featureKey="realtime_voice_teen"
        skipBilling={isGuest}
      />

      {isGuest && (
        <PurchaseOnboardingDialog
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          triggerFeature="免费体验点数已用完"
          onSuccess={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}

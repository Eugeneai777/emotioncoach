import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useXiaojinQuota } from "@/hooks/useXiaojinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";

export default function XiaojinVoice() {
  const navigate = useNavigate();
  const { remaining, deduct, canAfford, refresh } = useXiaojinQuota();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const billingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 进入前检查点数 + 预扣第一分钟
  useEffect(() => {
    if (!canAfford(8)) {
      setShowUpgrade(true);
      return;
    }
    // 预扣第一分钟
    if (deduct(8)) {
      setAllowed(true);
      // 每60秒扣一次
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
  }, []);

  if (!allowed) {
    return (
      <PurchaseOnboardingDialog
        open={showUpgrade}
        onOpenChange={(open) => {
          setShowUpgrade(open);
          if (!open) navigate("/xiaojin");
        }}
        defaultPackage="member365"
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
        skipBilling={true}
      />

      <PurchaseOnboardingDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        defaultPackage="member365"
        triggerFeature="免费体验点数已用完"
        onSuccess={() => setShowUpgrade(false)}
      />
    </>
  );
}

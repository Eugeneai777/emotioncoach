import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useXiaojinQuota } from "@/hooks/useXiaojinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";

export default function XiaojinVoice() {
  const navigate = useNavigate();
  const { remaining, deduct, canAfford, refresh } = useXiaojinQuota();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const billingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minuteRef = useRef(0);

  // 进入前检查点数
  useEffect(() => {
    if (!canAfford(8)) {
      setBlocked(true);
      setShowUpgrade(true);
    }
  }, [canAfford]);

  // 通话中每分钟扣8点
  const startBilling = useCallback(() => {
    // 预扣第一分钟
    if (!deduct(8)) {
      setShowUpgrade(true);
      navigate("/xiaojin");
      return;
    }
    minuteRef.current = 1;

    billingTimerRef.current = setInterval(() => {
      if (!deduct(8)) {
        // 点数不足，停止计费
        if (billingTimerRef.current) clearInterval(billingTimerRef.current);
        setShowUpgrade(true);
        navigate("/xiaojin");
        return;
      }
      minuteRef.current += 1;
    }, 60000);
  }, [deduct, navigate]);

  const stopBilling = useCallback(() => {
    if (billingTimerRef.current) {
      clearInterval(billingTimerRef.current);
      billingTimerRef.current = null;
    }
    refresh();
  }, [refresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (billingTimerRef.current) clearInterval(billingTimerRef.current);
    };
  }, []);

  if (blocked) {
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
          setBlocked(false);
        }}
      />
    );
  }

  return (
    <>
      <CoachVoiceChat
        onClose={() => {
          stopBilling();
          navigate("/xiaojin");
        }}
        onConnected={startBilling}
        onDisconnected={stopBilling}
        coachEmoji="✨"
        coachTitle="小劲"
        primaryColor="orange"
        tokenEndpoint="vibrant-life-realtime-token"
        mode="teen"
        featureKey="realtime_voice_teen"
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

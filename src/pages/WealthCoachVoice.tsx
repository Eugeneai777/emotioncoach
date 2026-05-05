import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { PostCallAdvisorDialog } from "@/components/wealth-block/PostCallAdvisorDialog";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { useAuth } from "@/hooks/useAuth";

interface LocationState {
  fromAssessment?: boolean;
  autoStartVoice?: boolean;
  assessmentData?: Record<string, any>;
  reactionPattern?: string;
  dominantPoor?: string;
}

const WealthCoachVoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const locationState = location.state as LocationState | null;
  const [showPostCallDialog, setShowPostCallDialog] = useState(false);

  // 未登录时重定向（等 loading 结束再判断）
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // loading 或无用户时，不阻塞渲染 CoachVoiceChat
  // CoachVoiceChat 内部有完整的 auth 检查和处理
  // 只在确认无用户时返回空
  if (!loading && !user) return null;

  const isFromAssessment = locationState?.fromAssessment;

  const handleClose = () => {
    if (isFromAssessment && locationState?.reactionPattern && locationState?.dominantPoor) {
      setShowPostCallDialog(true);
    } else {
      navigate(-1);
    }
  };

  const handlePostCallClose = () => {
    setShowPostCallDialog(false);
    navigate(-1);
  };

  return (
    <>
      <DynamicOGMeta pageKey="wealthCoachVoice" />
      <CoachVoiceChat
        onClose={handleClose}
        coachEmoji="💎"
        coachTitle="财富觉醒教练"
        primaryColor="rose"
        tokenEndpoint={isFromAssessment ? "wealth-assessment-realtime-token" : undefined}
        userId={user?.id}
        mode="general"
        featureKey="realtime_voice_wealth_assessment"
        extraBody={isFromAssessment && locationState?.assessmentData ? { assessmentData: locationState.assessmentData } : undefined}
        maxDurationOverride={isFromAssessment ? null : undefined}
        skipBilling={isFromAssessment ? true : undefined}
      />

      {locationState?.reactionPattern && locationState?.dominantPoor && (
        <PostCallAdvisorDialog
          open={showPostCallDialog}
          onOpenChange={(open) => {
            if (!open) handlePostCallClose();
            else setShowPostCallDialog(open);
          }}
          reactionPattern={locationState.reactionPattern}
          dominantPoor={locationState.dominantPoor}
        />
      )}
    </>
  );
};

export default WealthCoachVoice;

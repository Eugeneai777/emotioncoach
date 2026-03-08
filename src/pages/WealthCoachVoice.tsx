import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { PostCallAdvisorDialog } from "@/components/wealth-block/PostCallAdvisorDialog";
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
  const { user } = useAuth();
  const locationState = location.state as LocationState | null;
  const [showPostCallDialog, setShowPostCallDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  const isFromAssessment = locationState?.fromAssessment;

  const handleClose = () => {
    // 如果是从测评页跳转来的，通话结束后显示顾问推荐弹窗
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
      <CoachVoiceChat
        onClose={handleClose}
        coachEmoji="💎"
        coachTitle="财富觉醒教练"
        primaryColor="amber"
        tokenEndpoint={isFromAssessment ? "wealth-assessment-realtime-token" : undefined}
        userId={user.id}
        mode="general"
        featureKey="realtime_voice_wealth_assessment"
        extraBody={isFromAssessment && locationState?.assessmentData ? { assessmentData: locationState.assessmentData } : undefined}
        maxDurationOverride={isFromAssessment ? null : undefined}
        skipBilling={isFromAssessment ? true : undefined}
      />

      {/* 测评后通话结束 - 顾问推荐弹窗 */}
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

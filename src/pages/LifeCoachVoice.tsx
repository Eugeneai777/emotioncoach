import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";

const LifeCoachVoice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/life-coach-voice", { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <CoachVoiceChat
      onClose={() => navigate(-1)}
      coachEmoji="❤️"
      coachTitle="有劲AI生活教练"
      primaryColor="rose"
      tokenEndpoint="vibrant-life-realtime-token"
      userId={user.id}
      mode="general"
      featureKey="realtime_voice"
      voiceType={getSavedVoiceType()}
    />
  );
};

export default LifeCoachVoice;

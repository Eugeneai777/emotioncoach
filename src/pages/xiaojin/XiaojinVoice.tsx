import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";

export default function XiaojinVoice() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/xiaojin/voice", { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <CoachVoiceChat
      onClose={() => navigate("/xiaojin")}
      coachEmoji="✨"
      coachTitle="小劲"
      primaryColor="orange"
      tokenEndpoint="vibrant-life-realtime-token"
      userId={user.id}
      mode="teen"
      featureKey="realtime_voice_teen"
    />
  );
}

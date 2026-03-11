import { useNavigate } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";

export default function XiaojinVoice() {
  const navigate = useNavigate();

  return (
    <CoachVoiceChat
      onClose={() => navigate("/xiaojin")}
      coachEmoji="✨"
      coachTitle="小劲"
      primaryColor="orange"
      tokenEndpoint="vibrant-life-realtime-token"
      mode="teen"
      featureKey="realtime_voice_teen"
    />
  );
}

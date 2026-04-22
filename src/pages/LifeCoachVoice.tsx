import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";
import {
  preheatTokenEndpoint,
  prefetchToken,
  prewarmMicrophoneStream,
} from "@/utils/RealtimeAudio";

const LifeCoachVoice = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth?redirect=/life-coach-voice", { replace: true });
    }
  }, [user, loading, navigate]);

  // 🚀 进入页面立即并行预热：Edge Function + Token + 麦克风流
  // 用户点击「接通」时可直接复用，节省 1-2 秒
  useEffect(() => {
    if (loading || !user) return;

    const endpoint = "vibrant-life-realtime-token";

    // 并行触发，互不阻塞；失败仅打 warn，不影响后续正常连接
    void preheatTokenEndpoint(endpoint);
    void prefetchToken(endpoint, "general");
    void prewarmMicrophoneStream();
  }, [loading, user]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 animate-pulse" />
        <p className="mt-4 text-white/60 text-sm">正在准备…</p>
      </div>
    );
  }

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
      pttMode
    />
  );
};

export default LifeCoachVoice;

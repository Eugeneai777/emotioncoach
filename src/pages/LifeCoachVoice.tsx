import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";
import {
  preheatTokenEndpoint,
  prefetchToken,
  prewarmMicrophoneStream,
} from "@/utils/RealtimeAudio";

// topic → edge function SCENARIO_CONFIGS 中已注册的中文 key
// 必须与 supabase/functions/vibrant-life-realtime-token/index.ts 的 SCENARIO_CONFIGS 完全一致
const TOPIC_TO_SCENARIO_KEY: Record<string, string> = {
  anxiety: "深夜焦虑",
  career: "职场迷茫",
  relationship: "关系困扰",
  wealth: "财富卡点",
  sleep: "睡不着觉",
  meltdown: "情绪崩溃",
  exam: "考试焦虑",
  social: "社交困扰",
};

const LifeCoachVoice = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") || undefined;

  // ✅ 用 useMemo 稳定引用，避免每次渲染产生新字符串触发 CoachVoiceChat 重连
  const scenarioKey = useMemo(
    () => (topic ? TOPIC_TO_SCENARIO_KEY[topic] : undefined),
    [topic]
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth?redirect=/life-coach-voice", { replace: true });
    }
  }, [user, loading, navigate]);

  // 🚀 进入页面立即并行预热：Edge Function + Token + 麦克风流
  useEffect(() => {
    if (loading || !user) return;

    const endpoint = "vibrant-life-realtime-token";
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
      scenario={scenarioKey}
    />
  );
};

export default LifeCoachVoice;

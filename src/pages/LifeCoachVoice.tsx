import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";

const TOPIC_SCENARIO_MAP: Record<string, string> = {
  anxiety: "深夜焦虑：用户此刻可能正被焦虑感困扰，请用温柔放慢的语速开场，先邀请对方深呼吸一次，再问发生了什么。",
  career: "职场迷茫：用户在为工作选择或职业方向纠结，请先共情'选择背后的恐惧与渴望'，再邀请对方说出最近最纠结的一件事。",
  relationship: "关系困扰：用户可能刚经历关系中的委屈或冲突，请先表达'这里是安全的，可以说任何感受'，再邀请对方讲讲发生了什么。",
  wealth: "财富卡点：用户在金钱与财富信念上感到卡住，请用好奇而不评判的语气，先问'最近和钱有关的事里，最让你不舒服的是哪一刻'。",
};
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
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") || undefined;
  const topicScenario = topic ? TOPIC_SCENARIO_MAP[topic] : undefined;

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
      scenario={topicScenario}
    />
  );
};

export default LifeCoachVoice;

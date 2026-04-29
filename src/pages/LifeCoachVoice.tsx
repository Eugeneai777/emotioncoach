import { Suspense, lazy, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";
import { toast } from "@/hooks/use-toast";

const CoachVoiceChat = lazy(() => import("@/components/coach/CoachVoiceChat").then((m) => ({ default: m.CoachVoiceChat })));

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

// 已知 topic 白名单（与 MiniAppEntry useCases 必须一致）
const KNOWN_TOPICS = Object.keys(TOPIC_TO_SCENARIO_KEY);

const LifeCoachVoice = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") || undefined;

  // ✅ 运行时校验：未知 topic 或映射缺失时给出明确提示，回退到通用模式
  const scenarioKey = useMemo(() => {
    if (!topic) return undefined;
    if (!KNOWN_TOPICS.includes(topic)) {
      console.warn(`[LifeCoachVoice] 未知 topic="${topic}"，回退到通用教练模式`);
      toast({
        title: "未识别的场景",
        description: `场景"${topic}"暂未配置，已切换到通用模式`,
        variant: "destructive",
      });
      return undefined;
    }
    const key = TOPIC_TO_SCENARIO_KEY[topic];
    if (!key) {
      console.error(`[LifeCoachVoice] topic="${topic}" 缺少 SCENARIO_KEY 映射`);
      toast({
        title: "场景配置缺失",
        description: "已切换到通用模式，请联系支持反馈",
        variant: "destructive",
      });
      return undefined;
    }
    console.log(`[LifeCoachVoice] topic="${topic}" → scenario="${key}"`);
    return key;
  }, [topic]);

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
    void import("@/utils/RealtimeAudio").then(({ preheatTokenEndpoint, prefetchToken, prewarmMicrophoneStream }) => {
      void preheatTokenEndpoint(endpoint);
      void prefetchToken(endpoint, "general");
      void prewarmMicrophoneStream();
    });
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
    <Suspense fallback={
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 animate-pulse" />
        <p className="mt-4 text-white/60 text-sm">正在准备语音教练…</p>
      </div>
    }>
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
    </Suspense>
  );
};

export default LifeCoachVoice;

import { useState } from "react";
import { Mic, Crown } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { AssessmentResult, patternInfo, fourPoorInfo, emotionBlockInfo, beliefBlockInfo } from "./wealthBlockData";
import { AIInsightData } from "./AIInsightCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AssessmentVoiceCoachProps {
  result: AssessmentResult;
  aiInsight: AIInsightData | null;
  healthScore: number;
}

const FREE_SESSION_LIMIT = 2;
const COACH_KEY = '财富觉醒教练';

const MEMBER_365_PACKAGE = {
  key: 'member365',
  name: '365会员',
  price: 365,
  quota: 1000
};

export function AssessmentVoiceCoach({ result, aiInsight, healthScore }: AssessmentVoiceCoachProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);

  // 查询已使用次数
  const { data: sessionCount = 0 } = useQuery({
    queryKey: ['wealth-voice-sessions', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('voice_chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('coach_key', COACH_KEY);
      return count || 0;
    },
    enabled: !!user,
  });

  // 查询是否为 365 会员
  const { data: isMember365 = false } = useQuery({
    queryKey: ['is-member365', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_key', 'member365')
        .eq('status', 'paid')
        .limit(1);
      return (data && data.length > 0) || false;
    },
    enabled: !!user,
  });

  if (!user) return null;

  const isLimitReached = sessionCount >= FREE_SESSION_LIMIT && !isMember365;
  const hasFreeRemaining = sessionCount < FREE_SESSION_LIMIT;

  // 构建传递给 edge function 的测评数据
  const assessmentData = {
    healthScore,
    patternName: patternInfo[result.reactionPattern]?.name || '未知',
    dominantPoor: fourPoorInfo[result.dominantPoor]?.name || '未知',
    dominantEmotion: emotionBlockInfo[result.dominantEmotionBlock]?.name || '未知',
    dominantBelief: beliefBlockInfo[result.dominantBeliefBlock]?.name || '未知',
    behaviorScore: result.behaviorScore,
    emotionScore: result.emotionScore,
    beliefScore: result.beliefScore,
    rootCauseAnalysis: aiInsight?.rootCauseAnalysis || '',
    mirrorStatement: aiInsight?.mirrorStatement || '',
    coreStuckPoint: aiInsight?.coreStuckPoint || '',
  };

  const handleClick = () => {
    if (isLimitReached) {
      setShowPayDialog(true);
      return;
    }
    setShowVoiceChat(true);
  };

  // 按钮文字逻辑
  const buttonLabel = isLimitReached
    ? '升级解锁'
    : hasFreeRemaining
      ? '教练解说（免费）'
      : '教练解说';

  const ButtonIcon = isLimitReached ? Crown : Mic;

  return (
    <>
      <button
        onClick={handleClick}
        className="flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg text-xs sm:text-sm font-medium
                   bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md
                   active:scale-[0.97] transition-all duration-200"
      >
        <ButtonIcon className="w-4 h-4" />
        {buttonLabel}
      </button>

      {showVoiceChat && (
        <CoachVoiceChat
          onClose={() => setShowVoiceChat(false)}
          coachEmoji="💎"
          coachTitle="财富觉醒教练"
          primaryColor="amber"
          tokenEndpoint="wealth-assessment-realtime-token"
          mode="general"
          featureKey="realtime_voice_wealth_assessment"
          extraBody={{ assessmentData }}
        />
      )}

      <UnifiedPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={MEMBER_365_PACKAGE}
        onSuccess={() => {
          setShowPayDialog(false);
          toast({ title: "🎉 升级成功", description: "现在可以无限次对话了" });
        }}
      />
    </>
  );
}

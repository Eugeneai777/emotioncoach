import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const remainingSessions = Math.max(0, FREE_SESSION_LIMIT - sessionCount);
  const isLimitReached = sessionCount >= FREE_SESSION_LIMIT && !isMember365;

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

  return (
    <>
      {/* 底部居中圆形浮动按钮 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center pointer-events-auto"
        >
          {/* 圆形按钮 */}
          <button
            onClick={handleClick}
            className="relative group focus:outline-none touch-manipulation"
            aria-label="教练解说"
          >
            {/* 外圈呼吸光晕 */}
            <div className={`absolute inset-[-16px] rounded-full animate-pulse opacity-30 ${
              isLimitReached
                ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400'
                : 'bg-gradient-to-r from-amber-400 to-rose-400'
            }`} />
            <div className={`absolute inset-[-8px] rounded-full animate-ping opacity-20 ${
              isLimitReached
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                : 'bg-gradient-to-r from-amber-500 to-rose-500'
            }`} style={{ animationDuration: '2s' }} />

            {/* 主按钮 */}
            <div className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-200 ${
              isLimitReached
                ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-purple-500/40'
                : 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-orange-500/40'
            }`}>
              {isLimitReached ? (
                <Crown className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </div>
          </button>

          {/* 按钮下方文字 */}
          <p className="mt-2 text-sm font-semibold text-foreground">
            {isLimitReached ? '升级继续对话' : '教练解说（免费）'}
          </p>

          {/* 状态提示 */}
          <p className="text-xs text-muted-foreground mt-0.5">
            {isMember365 ? (
              '🎖️ 365会员 · 无限对话'
            ) : isLimitReached ? (
              '升级解锁无限对话'
            ) : (
              `💎 还剩 ${remainingSessions}/${FREE_SESSION_LIMIT} 次免费体验`
            )}
          </p>
        </motion.div>
      </div>

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

import { useState } from "react";
import { Mic, Crown, FileText, Target, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { AssessmentResult, patternInfo, fourPoorInfo, emotionBlockInfo, beliefBlockInfo } from "./wealthBlockData";
import { AIInsightData } from "./AIInsightCard";
import { PostCallAdvisorDialog } from "./PostCallAdvisorDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AssessmentVoiceCoachProps {
  result: AssessmentResult | null;
  aiInsight: AIInsightData | null;
  healthScore: number;
  disabled?: boolean;
}

const FREE_SESSION_LIMIT = 5;
const COACH_KEY = '财富觉醒教练';

const MEMBER_365_PACKAGE = {
  key: 'member365',
  name: '365会员',
  price: 365,
  quota: 1000
};

export function AssessmentVoiceCoach({ result, aiInsight, healthScore, disabled = false }: AssessmentVoiceCoachProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showPostCallDialog, setShowPostCallDialog] = useState(false);

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
  const assessmentData = result ? {
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
  } : null;

  const handleClick = () => {
    if (disabled) return;
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
      ? 'AI教练解说（免费）'
      : 'AI教练解说';

  const ButtonIcon = isLimitReached ? Crown : Mic;

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full
                     shadow-xl active:scale-[0.93] transition-all duration-200 z-10
                     ${disabled 
                       ? "bg-muted text-muted-foreground cursor-not-allowed" 
                       : "bg-gradient-to-br from-red-500 to-rose-600 text-white"}`}
        >
          {!disabled && (
            <>
              <span className="absolute -inset-1.5 rounded-full bg-red-400 opacity-40 animate-ping" />
              <span className="absolute -inset-3 rounded-full bg-red-400/20 animate-pulse" />
            </>
          )}
          <ButtonIcon className="w-6 h-6 relative z-10" />
          <span className="relative z-10 text-[10px] font-bold leading-tight mt-0.5">
            {disabled ? 'AI教练解说' : isLimitReached ? '升级解锁' : 'AI教练解说'}
          </span>
          {hasFreeRemaining && !disabled && (
            <span className="relative z-10 mt-0.5 px-1.5 py-0.5 bg-green-500 text-white text-[8px] font-bold rounded-full leading-none">
              免费
            </span>
          )}
        </button>


        {/* 价值标签 */}
        {!disabled && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {[
              { icon: FileText, label: '深度解读报告' },
              { icon: Target, label: '个性化建议' },
              { icon: MessageCircle, label: '实时语音互动' },
            ].map((item, i) => (
              <motion.span
                key={item.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.35 }}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-medium"
              >
                <item.icon className="w-3 h-3" />
                {item.label}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {showVoiceChat && (
        <CoachVoiceChat
          onClose={() => {
            setShowVoiceChat(false);
            setShowPostCallDialog(true);
          }}
          coachEmoji="💎"
          coachTitle="财富觉醒教练"
          primaryColor="amber"
          tokenEndpoint="wealth-assessment-realtime-token"
          mode="general"
          featureKey="realtime_voice_wealth_assessment"
          extraBody={{ assessmentData }}
          maxDurationOverride={null}
          skipBilling={true}
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

      {result && (
        <PostCallAdvisorDialog
          open={showPostCallDialog}
          onOpenChange={setShowPostCallDialog}
          reactionPattern={result.reactionPattern}
          dominantPoor={result.dominantPoor}
        />
      )}
    </>
  );
}

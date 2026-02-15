import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { AssessmentResult, patternInfo, fourPoorInfo, emotionBlockInfo, beliefBlockInfo, calculateHealthScore } from "./wealthBlockData";
import { AIInsightData } from "./AIInsightCard";

interface AssessmentVoiceCoachProps {
  result: AssessmentResult;
  aiInsight: AIInsightData | null;
  healthScore: number;
}

export function AssessmentVoiceCoach({ result, aiInsight, healthScore }: AssessmentVoiceCoachProps) {
  const { user } = useAuth();
  const [showVoiceChat, setShowVoiceChat] = useState(false);

  if (!user) return null;

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

  return (
    <>
      {/* 吸底固定按钮 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={() => setShowVoiceChat(true)}
            className="w-full h-14 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white rounded-2xl shadow-lg shadow-orange-500/25 text-base font-semibold gap-3"
            size="lg"
          >
            <div className="p-1.5 bg-white/20 rounded-full">
              <Mic className="w-5 h-5" />
            </div>
            和 AI 教练聊聊你的测评
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-1.5">
            💎 劲老师将基于你的测评数据，为你做专属解读
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
    </>
  );
}

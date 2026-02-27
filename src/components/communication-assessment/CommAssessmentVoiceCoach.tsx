import { useState } from "react";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { type CommAssessmentResult } from "./communicationAssessmentData";

interface CommAssessmentVoiceCoachProps {
  result: CommAssessmentResult;
  disabled?: boolean;
}

export function CommAssessmentVoiceCoach({ result, disabled = false }: CommAssessmentVoiceCoachProps) {
  const { user } = useAuth();
  const [showVoiceChat, setShowVoiceChat] = useState(false);

  if (!user) return null;

  const assessmentData = {
    primaryPattern: result.primaryPattern,
    secondaryPattern: result.secondaryPattern,
    perspective: result.perspective,
    totalScore: result.totalScore,
    maxTotalScore: result.maxTotalScore,
    dimensionScores: result.dimensionScores,
  };

  const handleClick = () => {
    if (disabled) return;
    setShowVoiceChat(true);
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`relative flex flex-col items-center justify-center w-20 h-20 rounded-full
                     shadow-[0_4px_20px_rgba(14,165,233,0.3)] active:scale-[0.93] transition-all duration-200 z-10
                     ${disabled 
                       ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none" 
                       : "bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-500 text-white"}`}
        >
          {!disabled && (
            <>
              <span className="absolute -inset-1 rounded-full bg-sky-400/30 animate-pulse" />
              <span className="absolute -inset-2.5 rounded-full bg-sky-300/15 animate-pulse [animation-delay:0.5s]" />
            </>
          )}
          <Mic className="w-5 h-5 relative z-10" />
          <span className="relative z-10 text-[9px] font-bold leading-tight mt-0.5 tracking-wide">
            亲子教练
          </span>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 mt-0.5 px-1.5 py-[1px] bg-emerald-400 text-white text-[7px] font-bold rounded-full leading-none tracking-wider shadow-sm"
          >
            免费
          </motion.span>
        </button>
      </div>

      {showVoiceChat && (
        <CoachVoiceChat
          onClose={() => setShowVoiceChat(false)}
          coachEmoji="🌉"
          coachTitle="亲子沟通教练"
          primaryColor="sky"
          tokenEndpoint="comm-assessment-realtime-token"
          mode="parent_teen"
          featureKey="realtime_voice_comm_assessment"
          extraBody={{ assessmentData }}
          maxDurationOverride={null}
          skipBilling={true}
        />
      )}
    </>
  );
}

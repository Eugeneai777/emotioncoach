import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import PageHeader from "@/components/PageHeader";
import { AssessmentCoachChat } from "@/components/emotion-health/AssessmentCoachChat";
import { type PatternType, type BlockedDimension } from "@/components/emotion-health/emotionHealthData";

export default function AssessmentCoachPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as {
    pattern?: PatternType;
    blockedDimension?: BlockedDimension;
    fromAssessment?: string;
    sessionId?: string;
    personalityType?: string;
    dimensions?: any[];
    aiAnalysis?: any;
  } | null;

  const pattern = state?.pattern || 'exhaustion';
  const blockedDimension = state?.blockedDimension;
  const resumeSessionId = state?.sessionId;
  const fromAssessment = state?.fromAssessment;
  const isMidlife = fromAssessment === 'midlife_awakening';

  const pageTitle = isMidlife ? 'AI 觉醒教练' : 'AI情绪教练';

  const handleComplete = (action: string) => {
    if (action === 'camp') {
      navigate('/camps');
    } else if (action === 'membership') {
      navigate('/packages');
    } else if (action === 'coach') {
      navigate('/coach-space', {
        state: {
          fromAssessment: fromAssessment || 'emotion_health',
          pattern: pattern
        }
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Helmet>
        <title>{pageTitle} - 有劲AI</title>
        <meta name="description" content={isMidlife ? "根据你的中场觉醒力测评结果，开启专属的AI觉醒教练对话" : "根据你的情绪状态，开启专属的AI情绪教练对话"} />
      </Helmet>
      
      <PageHeader title={pageTitle} showBack />

      <main className="flex-1 overflow-hidden">
        <AssessmentCoachChat
          pattern={pattern}
          blockedDimension={blockedDimension}
          onComplete={handleComplete}
          resumeSessionId={resumeSessionId}
          fromAssessment={fromAssessment}
          midlifeData={isMidlife ? {
            personalityType: state?.personalityType,
            dimensions: state?.dimensions,
            aiAnalysis: state?.aiAnalysis,
          } : undefined}
        />
      </main>
    </div>
  );
}

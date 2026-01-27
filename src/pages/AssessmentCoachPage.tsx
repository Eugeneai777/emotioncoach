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
  } | null;

  const pattern = state?.pattern || 'exhaustion';
  const blockedDimension = state?.blockedDimension;

  const handleComplete = (action: string) => {
    if (action === 'camp') {
      navigate('/camps');
    } else if (action === 'membership') {
      navigate('/packages');
    } else if (action === 'coach') {
      navigate('/coach-space', {
        state: {
          fromAssessment: 'emotion_health',
          pattern: pattern
        }
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Helmet>
        <title>AI情绪健康教练 - 有劲AI</title>
        <meta name="description" content="根据你的情绪状态，开启专属的AI情绪健康教练对话" />
      </Helmet>
      
      <PageHeader title="AI情绪健康教练" showBack />

      <main className="flex-1 overflow-hidden">
        <AssessmentCoachChat
          pattern={pattern}
          blockedDimension={blockedDimension}
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}
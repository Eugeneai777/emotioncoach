import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParentAbilityStartScreen } from "@/components/parent-ability-assessment/ParentAbilityStartScreen";
import { ParentAbilityQuestions, type FollowUpAnswer } from "@/components/parent-ability-assessment/ParentAbilityQuestions";
import { ParentAbilityResult } from "@/components/parent-ability-assessment/ParentAbilityResult";
import { ParentAbilityHistory, type AssessmentRecord } from "@/components/parent-ability-assessment/ParentAbilityHistory";

type Phase = 'start' | 'questions' | 'result' | 'history' | 'view-record';

const ParentAbilityAssessment = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('start');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [viewingRecord, setViewingRecord] = useState<AssessmentRecord | null>(null);

  const handleComplete = (ans: Record<number, number>, followUps: FollowUpAnswer[]) => {
    setAnswers(ans);
    setFollowUpAnswers(followUps);
    setPhase('result');
  };

  const handleRestart = () => {
    setAnswers({});
    setFollowUpAnswers([]);
    setPhase('start');
  };

  const handleViewRecord = (record: AssessmentRecord) => {
    setViewingRecord(record);
    setAnswers(record.answers || {});
    setFollowUpAnswers(record.follow_up_answers || []);
    setPhase('view-record');
  };

  if (phase === 'start') {
    return (
      <ParentAbilityStartScreen
        onStart={() => setPhase('questions')}
        onBack={() => navigate(-1)}
        onHistory={() => setPhase('history')}
      />
    );
  }

  if (phase === 'questions') {
    return (
      <ParentAbilityQuestions
        onComplete={handleComplete}
        onBack={() => setPhase('start')}
      />
    );
  }

  if (phase === 'history') {
    return (
      <ParentAbilityHistory
        onViewReport={handleViewRecord}
        onBack={() => setPhase('start')}
        onRetake={() => setPhase('questions')}
      />
    );
  }

  if (phase === 'view-record' && viewingRecord) {
    return (
      <ParentAbilityResult
        answers={answers}
        followUpAnswers={followUpAnswers}
        onRestart={handleRestart}
        savedRecord={{
          ai_insight: viewingRecord.ai_insight,
          total_score: viewingRecord.total_score,
          total_max: viewingRecord.total_max,
        }}
      />
    );
  }

  return (
    <ParentAbilityResult
      answers={answers}
      followUpAnswers={followUpAnswers}
      onRestart={handleRestart}
    />
  );
};

export default ParentAbilityAssessment;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParentAbilityStartScreen } from "@/components/parent-ability-assessment/ParentAbilityStartScreen";
import { ParentAbilityQuestions, type FollowUpAnswer } from "@/components/parent-ability-assessment/ParentAbilityQuestions";
import { ParentAbilityResult } from "@/components/parent-ability-assessment/ParentAbilityResult";

type Phase = 'start' | 'questions' | 'result';

const ParentAbilityAssessment = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('start');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);

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

  if (phase === 'start') {
    return (
      <ParentAbilityStartScreen
        onStart={() => setPhase('questions')}
        onBack={() => navigate(-1)}
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

  return (
    <ParentAbilityResult
      answers={answers}
      followUpAnswers={followUpAnswers}
      onRestart={handleRestart}
    />
  );
};

export default ParentAbilityAssessment;

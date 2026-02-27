import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommAssessmentStartScreen } from "@/components/communication-assessment/CommAssessmentStartScreen";
import { CommAssessmentQuestions } from "@/components/communication-assessment/CommAssessmentQuestions";
import { CommAssessmentResult } from "@/components/communication-assessment/CommAssessmentResult";
import {
  calculateResult,
  type Perspective,
  type CommAssessmentResult as ResultType,
} from "@/components/communication-assessment/communicationAssessmentData";

type Phase = 'start' | 'questions' | 'result';

export default function CommunicationAssessment() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('start');
  const [perspective, setPerspective] = useState<Perspective>('parent');
  const [result, setResult] = useState<ResultType | null>(null);

  const handleStart = (p: Perspective) => {
    setPerspective(p);
    setPhase('questions');
  };

  const handleComplete = (answers: Record<number, number>) => {
    const r = calculateResult(answers, perspective);
    setResult(r);
    setPhase('result');
  };

  const handleBack = () => {
    if (phase === 'questions') setPhase('start');
    else if (phase === 'result') setPhase('start');
    else navigate(-1);
  };

  const handleStartCoach = () => {
    navigate('/parent-coach');
  };

  if (phase === 'questions') {
    return (
      <CommAssessmentQuestions
        perspective={perspective}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }

  if (phase === 'result' && result) {
    return (
      <CommAssessmentResult
        result={result}
        onBack={handleBack}
        onStartCoach={handleStartCoach}
      />
    );
  }

  return (
    <CommAssessmentStartScreen
      onStart={handleStart}
      onBack={() => navigate(-1)}
    />
  );
}

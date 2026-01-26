import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import PageHeader from "@/components/PageHeader";
import {
  EmotionHealthStartScreen,
  EmotionHealthQuestions,
  EmotionHealthResult,
  calculateEmotionHealthResult,
  type EmotionHealthResultType
} from "@/components/emotion-health";

type PageStep = 'start' | 'questions' | 'result';

const STORAGE_KEY = 'emotion_health_progress';

export default function EmotionHealthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<PageStep>('start');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<EmotionHealthResultType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 恢复进度
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { answers: savedAnswers, step: savedStep } = JSON.parse(saved);
        if (savedAnswers && Object.keys(savedAnswers).length > 0) {
          setAnswers(savedAnswers);
          if (savedStep === 'questions') {
            setStep('questions');
          }
        }
      } catch (e) {
        console.error('Failed to restore progress:', e);
      }
    }
  }, []);

  // 保存进度
  useEffect(() => {
    if (step === 'questions' && Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step }));
    }
  }, [answers, step]);

  const handleStart = () => {
    if (!user) {
      toast.error("请先登录");
      navigate('/auth');
      return;
    }
    setStep('questions');
  };

  const handleAnswerChange = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    const calculatedResult = calculateEmotionHealthResult(answers);
    setResult(calculatedResult);
    
    // 保存到数据库
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('emotion_health_assessments')
        .insert({
          user_id: user.id,
          energy_index: calculatedResult.energyIndex,
          anxiety_index: calculatedResult.anxietyIndex,
          stress_index: calculatedResult.stressIndex,
          exhaustion_score: calculatedResult.exhaustionScore,
          tension_score: calculatedResult.tensionScore,
          suppression_score: calculatedResult.suppressionScore,
          avoidance_score: calculatedResult.avoidanceScore,
          primary_pattern: calculatedResult.primaryPattern,
          secondary_pattern: calculatedResult.secondaryPattern,
          blocked_dimension: calculatedResult.blockedDimension,
          recommended_path: calculatedResult.recommendedPath,
          answers: answers,
          is_paid: true, // 暂时设为已支付，后续可加付费墙
        });

      if (error) throw error;
      
      // 清除本地进度
      localStorage.removeItem(STORAGE_KEY);
      setStep('result');
    } catch (error) {
      console.error('Failed to save assessment:', error);
      toast.error("保存结果失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step === 'questions') {
      setStep('start');
    } else {
      navigate(-1);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    setStep('start');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>情绪健康测评 - 有劲AI</title>
        <meta name="description" content="基于心理学专业量表，帮助你深入了解当前的情绪状态与反应模式" />
      </Helmet>
      
      <PageHeader 
        title={step === 'result' ? "测评结果" : "情绪健康测评"} 
        showBack={step !== 'start'}
      />

      <main className="container max-w-2xl mx-auto px-4 py-4">
        {step === 'start' && (
          <EmotionHealthStartScreen onStart={handleStart} />
        )}
        
        {step === 'questions' && (
          <EmotionHealthQuestions
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )}
        
        {step === 'result' && result && (
          <EmotionHealthResult
            result={result}
            onRetake={handleRetake}
          />
        )}

        {isSaving && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">正在生成报告...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useParentIntake } from "@/hooks/useParentIntake";
import { IntakeQuestionCard } from "@/components/parent-intake/IntakeQuestionCard";
import { IntakeOnboardingFlow } from "@/components/parent-intake/IntakeOnboardingFlow";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const INTAKE_QUESTIONS = [
  {
    id: "q1_problems",
    question: "您的孩子目前正在经历哪些困扰？",
    subtitle: "可以选择多个",
    type: "multi" as const,
    options: [
      { value: "depression", label: "情绪低落、不开心", emoji: "😢" },
      { value: "school_refusal", label: "不愿上学、逃避学校", emoji: "🏫" },
      { value: "screen_addiction", label: "沉迷手机/游戏", emoji: "📱" },
      { value: "rebellion", label: "叛逆、不服管教", emoji: "😤" },
      { value: "low_confidence", label: "自卑、不自信", emoji: "😔" },
      { value: "learning_anxiety", label: "学习焦虑、压力大", emoji: "📚" },
      { value: "social_conflict", label: "人际关系困难", emoji: "👥" },
      { value: "emotional_explosion", label: "情绪失控、易怒", emoji: "💥" },
    ],
  },
  {
    id: "q2_duration",
    question: "这些困扰持续了多长时间？",
    subtitle: "选择最符合的选项",
    type: "single" as const,
    options: [
      { value: "less_1m", label: "不到1个月", emoji: "📅" },
      { value: "1_3m", label: "1-3个月", emoji: "🗓️" },
      { value: "3_6m", label: "3-6个月", emoji: "📆" },
      { value: "6m_1y", label: "6个月-1年", emoji: "🗓️" },
      { value: "more_1y", label: "超过1年", emoji: "📖" },
    ],
  },
  {
    id: "q3_response",
    question: "当孩子出现这些问题时，您通常如何应对？",
    subtitle: "选择最常见的方式",
    type: "single" as const,
    options: [
      { value: "lecture", label: "讲道理、说教", emoji: "💬" },
      { value: "punish", label: "批评、惩罚", emoji: "⚡" },
      { value: "ignore", label: "无奈、放任", emoji: "😔" },
      { value: "anxious", label: "焦虑、担心", emoji: "😰" },
      { value: "seek_help", label: "寻求专业帮助", emoji: "🆘" },
      { value: "communicate", label: "尝试沟通理解", emoji: "💕" },
    ],
  },
  {
    id: "q4_feeling",
    question: "面对孩子的困扰，您最强烈的感受是什么？",
    subtitle: "选择1-2个最符合的",
    type: "multi" as const,
    maxSelect: 2,
    options: [
      { value: "helpless", label: "无助、不知所措", emoji: "😶" },
      { value: "guilty", label: "愧疚、自责", emoji: "💔" },
      { value: "angry", label: "生气、愤怒", emoji: "😠" },
      { value: "worried", label: "担忧、焦虑", emoji: "😟" },
      { value: "sad", label: "难过、心疼", emoji: "😢" },
      { value: "tired", label: "疲惫、心累", emoji: "😩" },
    ],
  },
  {
    id: "q5_expectation",
    question: "您最希望从这次对话中获得什么？",
    subtitle: "选择最期待的",
    type: "single" as const,
    options: [
      { value: "understand", label: "理解孩子的内心世界", emoji: "💭" },
      { value: "method", label: "具体的沟通方法", emoji: "🛠️" },
      { value: "emotion", label: "缓解自己的情绪", emoji: "🌿" },
      { value: "connection", label: "修复亲子关系", emoji: "💕" },
      { value: "guidance", label: "专业的引导建议", emoji: "🎯" },
    ],
  },
];

const ParentIntake = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { saveProfile, isLoading, existingProfile } = useParentIntake();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [showStartCampDialog, setShowStartCampDialog] = useState(false);
  const [identifiedTypes, setIdentifiedTypes] = useState<{
    primary: string;
    secondary: string | null;
  } | null>(null);

  // 查询训练营模板
  const { data: campTemplate } = useQuery({
    queryKey: ['camp-template', 'parent_emotion_21'],
    queryFn: async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('camp_type', 'parent_emotion_21')
        .single();
      return data;
    }
  });

  // Check if user already has profile
  useEffect(() => {
    if (existingProfile) {
      navigate("/parent-coach");
    }
  }, [existingProfile, navigate]);

  // 游客模式：允许浏览问卷，提交时检查登录状态

  const currentQuestion = INTAKE_QUESTIONS[currentStep];
  const isLastQuestion = currentStep === INTAKE_QUESTIONS.length - 1;
  const progress = ((currentStep + 1) / INTAKE_QUESTIONS.length) * 100;

  const handleAnswer = (questionId: string, values: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: values }));
  };

  const canProceed = () => {
    const answer = answers[currentQuestion?.id];
    return answer && answer.length > 0;
  };

  const identifyProblemTypes = () => {
    const q1Answers = answers["q1_problems"] || [];
    
    // Priority scoring based on selection order and frequency
    const typeScores: Record<string, number> = {};
    
    q1Answers.forEach((type, index) => {
      typeScores[type] = (typeScores[type] || 0) + (q1Answers.length - index);
    });

    // Adjust based on duration (longer = more severe)
    const duration = answers["q2_duration"]?.[0];
    const durationMultiplier = {
      "less_1m": 0.8,
      "1_3m": 1.0,
      "3_6m": 1.2,
      "6m_1y": 1.4,
      "more_1y": 1.6,
    }[duration] || 1.0;

    Object.keys(typeScores).forEach((type) => {
      typeScores[type] *= durationMultiplier;
    });

    // Sort by score
    const sortedTypes = Object.entries(typeScores)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    return {
      primary: sortedTypes[0] || "depression",
      secondary: sortedTypes[1] || null,
    };
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      const types = identifyProblemTypes();
      setIdentifiedTypes(types);
      
      // Save to database
      await saveProfile({
        primary_problem_type: types.primary,
        secondary_problem_types: types.secondary ? [types.secondary] : null,
        intake_answers: answers,
      });
      
      setShowResult(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate(-1);
    }
  };

  const handleStartCamp = () => {
    setShowStartCampDialog(true);
  };

  const handleStartChat = () => {
    navigate("/parent-coach");
  };

  const handleCampSuccess = () => {
    navigate("/parent-coach");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>亲子教练 · 入驻问卷 | 有劲</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
          <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold text-foreground">亲子教练 · 入驻问卷</h1>
              {!showResult && (
                <p className="text-xs text-muted-foreground">
                  {currentStep + 1} / {INTAKE_QUESTIONS.length}
                </p>
              )}
            </div>
            {!showResult && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <Sparkles className="h-3 w-3" />
                <span>个性化定制</span>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          {!showResult && (
            <div className="h-1 bg-orange-100">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </header>

        {/* Content */}
        <main className="container max-w-lg mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {showResult && identifiedTypes ? (
              <IntakeOnboardingFlow
                key="result"
                primaryType={identifiedTypes.primary}
                secondaryType={identifiedTypes.secondary}
                onStartCamp={handleStartCamp}
                onStartChat={handleStartChat}
              />
            ) : (
              <IntakeQuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                selectedValues={answers[currentQuestion.id] || []}
                onAnswer={(values) => handleAnswer(currentQuestion.id, values)}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        {!showResult && (
          <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-orange-100 p-4">
            <div className="container max-w-lg mx-auto">
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                {isLoading ? (
                  "分析中..."
                ) : isLastQuestion ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    完成并查看结果
                  </>
                ) : (
                  <>
                    下一步
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </footer>
        )}

        {/* Start Camp Dialog */}
        {campTemplate && (
          <StartCampDialog
            open={showStartCampDialog}
            onOpenChange={setShowStartCampDialog}
            campTemplate={campTemplate}
            onSuccess={handleCampSuccess}
          />
        )}
      </div>
    </>
  );
};

export default ParentIntake;

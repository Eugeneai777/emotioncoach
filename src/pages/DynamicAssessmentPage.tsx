import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAssessmentTemplate, useSaveAssessmentResult } from "@/hooks/usePartnerAssessments";
import { useAuth } from "@/hooks/useAuth";
import { useDynamicAssessmentPurchase } from "@/hooks/useDynamicAssessmentPurchase";
import { useDynamicAssessmentHistory, useDeleteDynamicAssessmentRecord } from "@/hooks/useDynamicAssessmentHistory";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DynamicAssessmentIntro } from "@/components/dynamic-assessment/DynamicAssessmentIntro";
import { DynamicAssessmentQuestions } from "@/components/dynamic-assessment/DynamicAssessmentQuestions";
import { DynamicAssessmentResult } from "@/components/dynamic-assessment/DynamicAssessmentResult";
import { DynamicAssessmentHistory } from "@/components/dynamic-assessment/DynamicAssessmentHistory";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";

type Phase = "intro" | "questions" | "result" | "history";

export default function DynamicAssessmentPage() {
  const { assessmentKey } = useParams<{ assessmentKey: string }>();
  const { data: template, isLoading } = useAssessmentTemplate(assessmentKey || "");
  const { user } = useAuth();
  const saveResult = useSaveAssessmentResult();

  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<any>(null);
  const [pendingAnswers, setPendingAnswers] = useState<Record<number, number>>({});
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Cast template to access new fields
  const tpl = template as any;
  const requireAuth = tpl?.require_auth ?? true;
  const requirePayment = tpl?.require_payment ?? false;
  const packageKey = tpl?.package_key;

  const { data: purchaseRecord, refetch: refetchPurchase } = useDynamicAssessmentPurchase(
    requirePayment ? packageKey : undefined
  );
  const hasPurchased = !requirePayment || !!purchaseRecord;

  const { data: historyRecords = [], isLoading: historyLoading } = useDynamicAssessmentHistory(
    template?.id
  );
  const deleteRecord = useDeleteDynamicAssessmentRecord();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">测评不存在或已下线</p>
      </div>
    );
  }

  const questions = template.questions || [];
  const dimensions = template.dimensions || [];
  const patterns = template.result_patterns || [];

  const calculateAndShowResult = (answers: Record<number, number>) => {
    // Calculate dimension scores
    const dimScores: Record<string, { score: number; maxScore: number; label: string; emoji: string }> = {};
    dimensions.forEach((d: any) => {
      dimScores[d.key] = { score: 0, maxScore: d.maxScore || 0, label: d.label, emoji: d.emoji };
    });

    questions.forEach((q: any, i: number) => {
      const ans = answers[i];
      if (ans !== undefined && dimScores[q.dimension]) {
        dimScores[q.dimension].score += ans;
      }
    });

    const totalScore = Object.values(dimScores).reduce((s, d) => s + d.score, 0);
    const maxScore = Object.values(dimScores).reduce((s, d) => s + d.maxScore, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    let matchedPattern = patterns[0];
    for (const p of patterns) {
      if (p.scoreRange && percentage >= p.scoreRange.min && percentage <= p.scoreRange.max) {
        matchedPattern = p;
        break;
      }
    }

    const dimensionScoresArray = Object.values(dimScores);
    const resultData = {
      totalScore,
      maxScore,
      percentage,
      dimensionScores: dimensionScoresArray,
      primaryPattern: matchedPattern,
    };

    setResult(resultData);
    setPhase("result");

    // Save result
    if (user) {
      saveResult.mutate({
        user_id: user.id,
        template_id: template.id,
        answers,
        dimension_scores: dimensionScoresArray,
        total_score: totalScore,
        primary_pattern: matchedPattern?.label || "",
      });
    }

    // Generate AI insight
    generateInsight(dimensionScoresArray, matchedPattern, totalScore, maxScore);
  };

  const handleQuestionsComplete = useCallback((answers: Record<number, number>) => {
    setPendingAnswers(answers);

    // Check auth requirement
    if (requireAuth && !user) {
      toast.info("请先登录后查看结果");
      // Redirect to auth page with return URL
      const returnUrl = window.location.pathname;
      window.location.href = `/auth?returnUrl=${encodeURIComponent(returnUrl)}`;
      return;
    }

    // Check payment requirement
    if (requirePayment && !hasPurchased) {
      // Still calculate to show basic result, but trigger pay dialog
      calculateAndShowResult(answers);
      setShowPayDialog(true);
      return;
    }

    calculateAndShowResult(answers);
  }, [requireAuth, user, requirePayment, hasPurchased, template, questions, dimensions, patterns]);

  const generateInsight = async (dimScores: any[], pattern: any, totalScore: number, maxScore: number) => {
    setLoadingInsight(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-partner-assessment-insight", {
        body: {
          dimensionScores: dimScores,
          primaryPattern: pattern?.label,
          totalScore,
          maxScore,
          aiInsightPrompt: template.ai_insight_prompt,
          title: template.title,
        },
      });
      if (error) throw error;
      setAiInsight(data.insight);
    } catch (e) {
      console.error("Insight error:", e);
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleRetake = useCallback(() => {
    setResult(null);
    setAiInsight(null);
    setPendingAnswers({});
    setPhase("questions");
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setShowPayDialog(false);
    refetchPurchase();
    toast.success("支付成功，已解锁完整报告");
  }, [refetchPurchase]);

  const handleDeleteRecord = useCallback((id: string) => {
    deleteRecord.mutate(id, {
      onSuccess: () => toast.success("记录已删除"),
      onError: () => toast.error("删除失败"),
    });
  }, [deleteRecord]);

  // === INTRO ===
  if (phase === "intro") {
    return (
      <DynamicAssessmentIntro
        template={template}
        onStart={() => setPhase("questions")}
        onShowHistory={() => setPhase("history")}
        hasHistory={historyRecords.length > 0}
      />
    );
  }

  // === QUESTIONS ===
  if (phase === "questions") {
    return (
      <DynamicAssessmentQuestions
        questions={questions}
        onComplete={handleQuestionsComplete}
        onExit={() => setPhase("intro")}
      />
    );
  }

  // === HISTORY ===
  if (phase === "history") {
    return (
      <DynamicAssessmentHistory
        records={historyRecords}
        isLoading={historyLoading}
        templateEmoji={template.emoji}
        onDelete={handleDeleteRecord}
        onBack={() => setPhase(result ? "result" : "intro")}
      />
    );
  }

  // === RESULT ===
  if (phase === "result" && result) {
    return (
      <>
        <DynamicAssessmentResult
          result={result}
          template={{
            emoji: template.emoji,
            title: template.title,
            qr_image_url: tpl?.qr_image_url,
            qr_title: tpl?.qr_title,
            coach_prompt: tpl?.coach_prompt,
            assessment_key: template.assessment_key,
          }}
          aiInsight={aiInsight}
          loadingInsight={loadingInsight}
          onRetake={handleRetake}
          onShowHistory={() => setPhase("history")}
          hasHistory={historyRecords.length > 0}
        />

        {/* Pay dialog for premium content */}
        {requirePayment && packageKey && (
          <AssessmentPayDialog
            open={showPayDialog}
            onOpenChange={setShowPayDialog}
            onSuccess={handlePaymentSuccess}
            userId={user?.id}
            hasPurchased={hasPurchased}
            packageKey={packageKey}
            packageName={template.title}
          />
        )}
      </>
    );
  }

  return null;
}

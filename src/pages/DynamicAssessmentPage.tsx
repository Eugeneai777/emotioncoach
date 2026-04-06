import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAssessmentTemplate, useSaveAssessmentResult } from "@/hooks/usePartnerAssessments";
import { useAuth } from "@/hooks/useAuth";
import { useDynamicAssessmentPurchase } from "@/hooks/useDynamicAssessmentPurchase";
import { usePackageByKey } from "@/hooks/usePackages";
import { useDynamicAssessmentHistory, useDeleteDynamicAssessmentRecord } from "@/hooks/useDynamicAssessmentHistory";
import { supabase } from "@/integrations/supabase/client";
import { calculateScore, type ScoringResult } from "@/lib/scoring-engine";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { AssessmentPromoShareDialog } from "@/components/dynamic-assessment/AssessmentPromoShareDialog";

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
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Cast template to access extended fields
  const tpl = template as any;
  const requireAuth = tpl?.require_auth ?? true;
  const requirePayment = tpl?.require_payment ?? false;
  const packageKey = tpl?.package_key;
  const scoringType = tpl?.scoring_type || "additive";

  const { data: purchaseRecord, refetch: refetchPurchase } = useDynamicAssessmentPurchase(
    requirePayment ? packageKey : undefined
  );
  const hasPurchased = !requirePayment || !!purchaseRecord;
  const { data: packageData } = usePackageByKey(requirePayment ? packageKey : '');
  const price = packageData?.price;

  const { data: historyRecords = [], isLoading: historyLoading } = useDynamicAssessmentHistory(
    template?.id
  );
  const deleteRecord = useDeleteDynamicAssessmentRecord();

  const questions = template?.questions || [];
  const dimensions = template?.dimensions || [];
  const patterns = template?.result_patterns || [];

  const generateInsight = async (scoringResult: ScoringResult) => {
    if (!template) return;
    setLoadingInsight(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-partner-assessment-insight", {
        body: {
          dimensionScores: scoringResult.dimensionScores,
          primaryPattern: scoringResult.primaryPattern?.label,
          totalScore: scoringResult.totalScore,
          maxScore: scoringResult.maxScore,
          aiInsightPrompt: template.ai_insight_prompt,
          title: template.title,
          meta: scoringResult.meta,
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

  const calculateAndShowResult = (answers: Record<number, number>) => {
    if (!template) return;
    const scoringResult = calculateScore(scoringType, answers, questions, dimensions, patterns);
    setResult(scoringResult);
    setPhase("result");

    if (user) {
      saveResult.mutate({
        user_id: user.id,
        template_id: template.id,
        answers,
        dimension_scores: scoringResult.dimensionScores,
        total_score: scoringResult.totalScore,
        primary_pattern: scoringResult.primaryPattern?.label || "",
      });
    }

    generateInsight(scoringResult);
  };

  const handleQuestionsComplete = (answers: Record<number, number>) => {
    if (requireAuth && !user) {
      toast.info("请先登录后查看结果");
      const returnUrl = window.location.pathname;
      window.location.href = `/auth?returnUrl=${encodeURIComponent(returnUrl)}`;
      return;
    }

    if (requirePayment && !hasPurchased) {
      calculateAndShowResult(answers);
      setShowPayDialog(true);
      return;
    }

    calculateAndShowResult(answers);
  };

  const handleRetake = () => {
    setResult(null);
    setAiInsight(null);
    setPhase("questions");
  };

  const handlePaymentSuccess = () => {
    setShowPayDialog(false);
    refetchPurchase();
    toast.success("支付成功，已解锁完整报告");
  };

  const handleDeleteRecord = (id: string) => {
    deleteRecord.mutate(id, {
      onSuccess: () => toast.success("记录已删除"),
      onError: () => toast.error("删除失败"),
    });
  };

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

  // === INTRO ===
  if (phase === "intro") {
    return (
      <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
        <PageHeader
          title={template.title}
          showBack={true}
          rightActions={
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9" onClick={() => setShowShareDialog(true)}>
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          }
        />
        <main className="container max-w-2xl mx-auto px-4 py-4">
          <DynamicAssessmentIntro
            template={template}
            onStart={() => setPhase("questions")}
            onShowHistory={() => setPhase("history")}
            hasHistory={historyRecords.length > 0}
            requirePayment={requirePayment}
            hasPurchased={hasPurchased}
            price={price}
            onPayClick={() => setShowPayDialog(true)}
          />
        </main>
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
        <AssessmentPromoShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          assessmentKey={assessmentKey || ''}
          config={{
            emoji: template.emoji,
            title: template.title,
            subtitle: template.subtitle || '',
            sharePath: `/assessment/${assessmentKey}`,
          }}
        />
      </div>
    );
  }

  // === QUESTIONS ===
  if (phase === "questions") {
    return (
      <DynamicAssessmentQuestions
        questions={questions}
        scoreOptions={tpl?.score_options}
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
            coach_type: tpl?.coach_type,
            assessment_key: template.assessment_key,
          }}
          scoringType={scoringType}
          recommendedCampTypes={tpl?.recommended_camp_types}
          aiInsight={aiInsight}
          loadingInsight={loadingInsight}
          onRetake={handleRetake}
          onShowHistory={() => setPhase("history")}
          hasHistory={historyRecords.length > 0}
        />

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

import { Suspense, lazy, useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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

import { DynamicAssessmentIntro } from "@/components/dynamic-assessment/DynamicAssessmentIntro";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { DynamicAssessmentQuestions } from "@/components/dynamic-assessment/DynamicAssessmentQuestions";
import { DynamicAssessmentResult } from "@/components/dynamic-assessment/DynamicAssessmentResult";
const AssessmentPromoShareDialog = lazy(() => import("@/components/dynamic-assessment/AssessmentPromoShareDialog").then((m) => ({ default: m.AssessmentPromoShareDialog })));
const DynamicAssessmentHistory = lazy(() => import("@/components/dynamic-assessment/DynamicAssessmentHistory").then((m) => ({ default: m.DynamicAssessmentHistory })));
const AssessmentPayDialog = lazy(() => import("@/components/wealth-block/AssessmentPayDialog").then((m) => ({ default: m.AssessmentPayDialog })));

type Phase = "intro" | "questions" | "result" | "history";

export default function DynamicAssessmentPage() {
  const { assessmentKey } = useParams<{ assessmentKey: string }>();
  const [searchParams] = useSearchParams();
  const urlRecordId = searchParams.get('recordId');
  const autoSavePdf = searchParams.get('autoSave') === 'pdf';
  const { data: template, isLoading } = useAssessmentTemplate(assessmentKey || "");
  const { user } = useAuth();
  const saveResult = useSaveAssessmentResult();

  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState<boolean>(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isLiteMode] = useState(false);

  // Cast template to access extended fields
  const tpl = template as any;
  const _requireAuth = tpl?.require_auth ?? true;
  const requirePayment = tpl?.require_payment ?? false;
  const packageKey = tpl?.package_key;
  const scoringType = (() => {
    // 优先从 scoring_logic JSON 中读取
    try {
      const sl = tpl?.scoring_logic;
      const fromJson = typeof sl === 'string' ? JSON.parse(sl)?.scoring_type : sl?.scoring_type;
      if (fromJson) return fromJson;
    } catch {}
    // 兜底用列值
    return tpl?.scoring_type || 'additive';
  })();

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

  const allQuestions = template?.questions || [];
  const dimensions = template?.dimensions || [];
  const patterns = template?.result_patterns || [];

  // SBTI: randomly select 2 questions per dimension (+ 1 DRUNK_TRIGGER) = 31 total
  const questions = useMemo(() => {
    if (scoringType !== 'sbti' || allQuestions.length <= 31) return allQuestions;

    const grouped: Record<string, any[]> = {};
    const drunkQ: any[] = [];
    allQuestions.forEach((q: any) => {
      const dim = q.dimension || q.factor;
      if (dim === 'DRUNK_TRIGGER') {
        drunkQ.push(q);
      } else {
        if (!grouped[dim]) grouped[dim] = [];
        grouped[dim].push(q);
      }
    });

    const selected: any[] = [];
    // Pick 2 random questions per dimension
    Object.values(grouped).forEach((qs) => {
      const shuffled = [...qs].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, 2));
    });
    // Add DRUNK_TRIGGER
    if (drunkQ.length > 0) selected.push(drunkQ[0]);
    // Shuffle final order
    return selected.sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoringType, allQuestions.length, phase]);

  const [savedResultId, setSavedResultId] = useState<string | null>(null);

  const generateInsight = async (
    scoringResult: ScoringResult,
    resultId?: string | null,
  ) => {
    if (!template) return;
    setLoadingInsight(true);
    setInsightError(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-partner-assessment-insight", {
        body: {
          dimensionScores: scoringResult.dimensionScores,
          primaryPattern: scoringResult.primaryPattern?.label,
          totalScore: scoringResult.totalScore,
          maxScore: scoringResult.maxScore,
          aiInsightPrompt: (template as any).ai_insight_prompt,
          title: template.title,
          meta: scoringResult.meta,
          userId: user?.id,
          resultId: resultId || savedResultId || undefined,
          assessmentKey: template.assessment_key,
        },
      });
      if (error) throw error;
      if (!data?.insight) throw new Error("empty insight");
      setAiInsight(data.insight);
    } catch (e) {
      console.error("Insight error:", e);
      setInsightError(true);
    } finally {
      setLoadingInsight(false);
    }
  };

  const regenerateInsight = () => {
    if (result) generateInsight(result, savedResultId);
  };

  const calculateAndShowResult = async (answers: Record<number, number>) => {
    if (!template) return;
    const scoringResult = calculateScore(scoringType, answers, questions, dimensions, patterns);
    setResult(scoringResult);
    setPhase("result");

    let newResultId: string | null = null;
    if (user) {
      try {
        const saved: any = await saveResult.mutateAsync({
          user_id: user.id,
          template_id: template.id,
          answers,
          dimension_scores: scoringResult.dimensionScores,
          total_score: scoringResult.totalScore,
          primary_pattern: scoringResult.primaryPattern?.label || "",
        });
        if (saved?.id) {
          newResultId = saved.id;
          setSavedResultId(saved.id);
        }
      } catch (e) {
        console.error("Save assessment result failed:", e);
      }
    }

    // Now safe to generate — resultId is ready, edge function will persist
    generateInsight(scoringResult, newResultId);
  };

  const handleQuestionsComplete = (answers: Record<number, number>) => {
    // Login gate is now at Intro start button, so user should be authenticated here
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
    setInsightError(false);
    setSavedResultId(null);
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

  const handleViewHistoryRecord = (record: any) => {
    if (!template) return;
    const storedAnswers = record.answers || {};
    const scoringResult = calculateScore(scoringType, storedAnswers, allQuestions, dimensions, patterns);
    setResult(scoringResult);
    setAiInsight(record.ai_insight || null);
    setInsightError(false);
    setSavedResultId(record.id);
    setPhase("result");

    // Auto-backfill missing insight for historical records
    if (!record.ai_insight) {
      generateInsight(scoringResult, record.id);
    }
  };

  // 浏览器外跳落地：?recordId=xxx → 直接打开该条历史记录的结果页
  useEffect(() => {
    if (!urlRecordId || !template || phase !== 'intro' || historyLoading) return;
    const rec = historyRecords.find((r: any) => r.id === urlRecordId);
    if (rec) handleViewHistoryRecord(rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRecordId, template?.id, historyLoading, historyRecords.length]);

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

  // 链接分享卡片（OG meta + 微信 JSSDK）映射：测评 key -> og_configurations.page_key
  const OG_PAGE_KEY_MAP: Record<string, string> = {
    male_midlife_vitality: 'maleMidlifeVitalityAssessment',
  };
  const ogPageKey = template?.assessment_key ? OG_PAGE_KEY_MAP[template.assessment_key] : undefined;

  // === INTRO ===
  if (phase === "intro") {
    return (
      <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
        {ogPageKey && <DynamicOGMeta pageKey={ogPageKey} />}
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
            requireAuth={_requireAuth}
            requirePayment={requirePayment}
            hasPurchased={hasPurchased}
            price={price}
            onPayClick={() => setShowPayDialog(true)}
            lastRecord={historyRecords[0] as any}
            historyCount={historyRecords.length}
          />
        </main>
        {requirePayment && packageKey && showPayDialog && (
          <Suspense fallback={null}>
          <AssessmentPayDialog
            open={showPayDialog}
            onOpenChange={setShowPayDialog}
            onSuccess={handlePaymentSuccess}
            userId={user?.id}
            hasPurchased={hasPurchased}
            packageKey={packageKey}
            packageName={template.title}
          />
          </Suspense>
        )}
        {showShareDialog && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}
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
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      {ogPageKey && <DynamicOGMeta pageKey={ogPageKey} />}
      <DynamicAssessmentHistory
        records={historyRecords}
        isLoading={historyLoading}
        templateEmoji={template.emoji}
        scoringType={scoringType}
        assessmentKey={template.assessment_key}
        onDelete={handleDeleteRecord}
        onBack={() => setPhase(result ? "result" : "intro")}
        onViewRecord={handleViewHistoryRecord}
      />
      </Suspense>
    );
  }

  // === RESULT ===
  if (phase === "result" && result) {
    return (
      <>
        {ogPageKey && <DynamicOGMeta pageKey={ogPageKey} />}
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
          insightError={insightError}
          onRegenerateInsight={regenerateInsight}
          onRetake={handleRetake}
          onShowHistory={() => setPhase("history")}
          hasHistory={historyRecords.length > 0}
          recordId={savedResultId}
          autoSavePdf={autoSavePdf}
          isLiteMode={isLiteMode}
          onLoginToUnlock={() => {
            const returnUrl = window.location.pathname;
            window.location.href = `/auth?returnUrl=${encodeURIComponent(returnUrl)}`;
          }}
        />

        {requirePayment && packageKey && showPayDialog && (
          <Suspense fallback={null}>
          <AssessmentPayDialog
            open={showPayDialog}
            onOpenChange={setShowPayDialog}
            onSuccess={handlePaymentSuccess}
            userId={user?.id}
            hasPurchased={hasPurchased}
            packageKey={packageKey}
            packageName={template.title}
          />
          </Suspense>
        )}
      </>
    );
  }

  return null;
}

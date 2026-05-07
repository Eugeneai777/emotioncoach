import { Suspense, lazy, useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";

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
  const navigate = useNavigate();
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

  // Cast template to access extended fields
  const tpl = template as any;
  const _requireAuth = tpl?.require_auth ?? true;
  // Lite mode: 未登录用户在指定测评下进入"半成品报告"模式,引导登录解锁
  const LITE_MODE_KEYS: string[] = [];
  const isLiteMode = !user && (
    (template?.assessment_key && LITE_MODE_KEYS.includes(template.assessment_key)) ||
    (tpl?.scoring_type === 'sbti' || tpl?.scoring_logic?.scoring_type === 'sbti')
  );
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

  // 重新测评 nonce: 自增触发 questions useMemo 重洗(必须在 useMemo 之前声明)
  const [retakeNonce, setRetakeNonce] = useState(0);

  // SBTI: randomly select 2 questions per dimension (+ 1 DRUNK_TRIGGER) = 31 total
  // male_midlife_vitality: 全量 20 题, Fisher-Yates 随机顺序(不抽题, 保留维度完整性)
  const questions = useMemo(() => {
    // 男人有劲: 全量打乱顺序, 每次重测 (retakeNonce 变化) 重新洗牌
    if (template?.assessment_key === 'male_midlife_vitality' && allQuestions.length > 0) {
      const arr = [...allQuestions];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

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
  }, [scoringType, allQuestions.length, phase, template?.assessment_key, retakeNonce]);

  const [savedResultId, setSavedResultId] = useState<string | null>(null);

  const generateInsight = async (
    scoringResult: ScoringResult,
    resultId?: string | null,
  ) => {
    if (!template) return;
    // Lite 模式(未登录): 不生成 AI 洞察, 防止"保存完整报告"绕过登录导出完整内容
    if (isLiteMode) return;
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

  const liteCacheKey = template?.assessment_key
    ? `lite_assessment_answers_${template.assessment_key}`
    : null;
  const LITE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时过期

  const clearLiteCache = () => {
    if (!liteCacheKey) return;
    try { localStorage.removeItem(liteCacheKey); } catch {}
    try { sessionStorage.removeItem(liteCacheKey); } catch {}
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
        // 登录用户成功保存后,清除 lite 缓存(localStorage + sessionStorage 双清)
        clearLiteCache();
      } catch (e) {
        console.error("Save assessment result failed:", e);
      }
    }

    // Now safe to generate — resultId is ready, edge function will persist
    generateInsight(scoringResult, newResultId);
  };

  const requireAuthOrStart = () => {
    if (_requireAuth && !user) {
      const returnUrl = window.location.pathname + window.location.search;
      toast.info("请先登录后开始测评");
      try { setPostAuthRedirect(returnUrl); } catch {}
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setPhase("questions");
  };

  const handleQuestionsComplete = (answers: Record<number, number>) => {
    // 强制登录的测评：未登录不允许出结果，直接拦回登录
    if (_requireAuth && !user) {
      const returnUrl = window.location.pathname + window.location.search;
      toast.info("请先登录后查看测评结果");
      try { setPostAuthRedirect(returnUrl); } catch {}
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Lite 模式: 未登录时把答案 + 时间戳缓存到 localStorage(24h 过期),登录回跳后自动恢复
    if (!user && isLiteMode && liteCacheKey) {
      try {
        const payload = JSON.stringify({ answers, savedAt: Date.now() });
        localStorage.setItem(liteCacheKey, payload);
      } catch {}
    }

    if (requirePayment && !hasPurchased) {
      calculateAndShowResult(answers);
      setShowPayDialog(true);
      return;
    }

    calculateAndShowResult(answers);
  };

  // 登录回跳后,若 localStorage 有未过期的 lite 答案,自动恢复结果并写入数据库
  // 仅 Lite 模式测评适用，避免误恢复非 Lite 测评的旧缓存
  useEffect(() => {
    if (!user || !liteCacheKey || !isLiteMode || result || !template || questions.length === 0) return;
    try {
      // 优先 localStorage(跨标签/跨会话有效),回退 sessionStorage(兼容旧数据)
      const raw = localStorage.getItem(liteCacheKey) || sessionStorage.getItem(liteCacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // 兼容两种格式: 旧版直接是 answers 对象,新版是 { answers, savedAt }
      const cachedAnswers = parsed?.answers && typeof parsed.answers === 'object'
        ? parsed.answers
        : parsed;
      const savedAt: number | undefined = parsed?.savedAt;

      // 过期检查: 超过 24h 直接清除
      if (savedAt && Date.now() - savedAt > LITE_CACHE_TTL_MS) {
        clearLiteCache();
        return;
      }

      if (cachedAnswers && typeof cachedAnswers === 'object') {
        clearLiteCache();
        calculateAndShowResult(cachedAnswers);
      }
    } catch (e) {
      console.warn('[Lite resume] failed:', e);
      clearLiteCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, liteCacheKey, template?.id, questions.length, isLiteMode]);

  const handleRetake = () => {
    setResult(null);
    setAiInsight(null);
    setInsightError(false);
    setSavedResultId(null);
    setRetakeNonce((n) => n + 1); // 触发题目顺序重洗
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
    // 优先使用数据库已保存的分数/维度/主导类型，避免随机题序导致的二次计算偏差
    const hasStoredScores =
      record.dimension_scores &&
      typeof record.dimension_scores === 'object' &&
      record.total_score !== undefined &&
      record.total_score !== null;

    let scoringResult: ScoringResult;
    if (hasStoredScores) {
      const dims = (template.dimensions || []) as any[];
      const storedRaw = record.dimension_scores as any;
      const isArray = Array.isArray(storedRaw);
      const byKey: Record<string, any> = isArray
        ? Object.fromEntries(storedRaw.map((d: any) => [d.key, d]))
        : (storedRaw || {});

      const dimensionScores = dims.map((d: any) => {
        const item = byKey[d.key];
        if (isArray) {
          return {
            key: d.key,
            label: item?.label ?? d.label,
            emoji: item?.emoji ?? d.emoji,
            maxScore: Number(item?.maxScore ?? d.maxScore ?? 0),
            score: Number(item?.score ?? 0),
          };
        }
        // 兜底：旧版对象格式 { key: number }
        return {
          key: d.key,
          label: d.label,
          emoji: d.emoji,
          maxScore: Number(d.maxScore || 0),
          score: Number(item ?? 0),
        };
      });

      const maxScore = dimensionScores.reduce((s, d) => s + (d.maxScore || 0), 0)
        || (template as any).max_score || 0;
      const total = Number(record.total_score) || 0;
      const patterns = (template.result_patterns || []) as any[];
      const matched =
        patterns.find((p: any) => p.label === record.primary_pattern) ||
        { label: record.primary_pattern, emoji: template.emoji };
      scoringResult = {
        totalScore: total,
        maxScore,
        percentage: maxScore > 0 ? (total / maxScore) * 100 : 0,
        dimensionScores: dimensionScores as any,
        primaryPattern: matched,
      };
    } else {
      scoringResult = calculateScore(scoringType, storedAnswers, allQuestions, dimensions, patterns);
    }

    setResult(scoringResult);
    setAiInsight(record.ai_insight || null);
    setInsightError(false);
    setSavedResultId(record.id);
    setPhase("result");

    // Auto-backfill missing insight for historical records (仅本人，避免管理员代查时调用接口)
    if (!record.ai_insight && user && record.user_id === user.id) {
      generateInsight(scoringResult, record.id);
    }
  };

  // 浏览器外跳落地：?recordId=xxx → 直接打开该条历史记录的结果页
  // 管理员模式：?recordId=xxx&adminPdf=1 → 直查数据库（受 RLS 保护）
  const adminPdf = searchParams.get('adminPdf') === '1';
  const subjectUserId = searchParams.get('subjectUserId');
  const subjectName = searchParams.get('subjectName');
  const subjectAvatar = searchParams.get('subjectAvatar');
  const subjectProfile = subjectUserId
    ? { userId: subjectUserId, displayName: subjectName || undefined, avatarUrl: subjectAvatar || undefined }
    : undefined;

  useEffect(() => {
    if (!urlRecordId || !template || phase !== 'intro' || historyLoading) return;
    const rec = historyRecords.find((r: any) => r.id === urlRecordId);
    if (rec) {
      handleViewHistoryRecord(rec);
      return;
    }
    if (adminPdf) {
      (async () => {
        const { data, error } = await supabase
          .from('partner_assessment_results')
          .select('*')
          .eq('id', urlRecordId)
          .maybeSingle();
        if (error || !data) {
          toast.error('未找到该测评记录或无权访问');
          return;
        }
        toast.message(`管理员视图：正在查看 ${subjectName || '他人'} 的报告`);
        handleViewHistoryRecord(data as any);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRecordId, template?.id, historyLoading, historyRecords.length, adminPdf]);

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
            onStart={requireAuthOrStart}
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
          autoSavePdf={autoSavePdf && (!urlRecordId || savedResultId === urlRecordId)}
          subjectProfile={subjectProfile}
          isLiteMode={isLiteMode}
          onLoginToUnlock={() => {
            // 商业漏斗关键节点：写双重锚（URL + localStorage）保证微信 OAuth roundtrip 后仍能回到结果页
            const returnUrl = window.location.pathname + window.location.search;
            try { localStorage.setItem('auth_redirect', returnUrl); } catch {}
            // 环境感知：微信内置浏览器走 wechat-auth，其他环境走 /auth 并默认聚焦"登录"
            const isWeChat = /micromessenger/i.test(navigator.userAgent);
            if (isWeChat) {
              navigate(`/wechat-auth?mode=login&redirect=${encodeURIComponent(returnUrl)}`);
            } else {
              navigate(`/auth?default_login=true&redirect=${encodeURIComponent(returnUrl)}`);
            }
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

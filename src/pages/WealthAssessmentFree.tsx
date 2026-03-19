import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { WealthBlockQuestions } from "@/components/wealth-block/WealthBlockQuestions";
import { WealthBlockResult } from "@/components/wealth-block/WealthBlockResult";
import { AssessmentResult, FollowUpAnswer } from "@/components/wealth-block/wealthBlockData";
import { DeepFollowUpAnswer } from "@/components/wealth-block/DeepFollowUpDialog";
import { useFooterHeight } from "@/hooks/useFooterHeight";
import { useAuth } from "@/hooks/useAuth";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { toast } from "sonner";

// ─── sessionStorage keys for state recovery ───
const SS_KEY_RESULT = 'wealth_free_assessment_result';
const SS_KEY_FOLLOWUP = 'wealth_free_followup_insights';
const SS_KEY_DEEP = 'wealth_free_deep_followup';
const SS_KEY_PAY_RESUME = 'wealth_free_camp_pay_resume';

function saveResultToSession(
  result: AssessmentResult,
  followUp: FollowUpAnswer[],
  deep: DeepFollowUpAnswer[]
) {
  try {
    sessionStorage.setItem(SS_KEY_RESULT, JSON.stringify(result));
    sessionStorage.setItem(SS_KEY_FOLLOWUP, JSON.stringify(followUp));
    sessionStorage.setItem(SS_KEY_DEEP, JSON.stringify(deep));
  } catch (e) {
    console.warn('[WealthFree] Failed to save state to sessionStorage:', e);
  }
}

function loadResultFromSession(): {
  result: AssessmentResult;
  followUp: FollowUpAnswer[];
  deep: DeepFollowUpAnswer[];
} | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY_RESULT);
    if (!raw) return null;
    const result = JSON.parse(raw) as AssessmentResult;
    const followUp = JSON.parse(sessionStorage.getItem(SS_KEY_FOLLOWUP) || '[]') as FollowUpAnswer[];
    const deep = JSON.parse(sessionStorage.getItem(SS_KEY_DEEP) || '[]') as DeepFollowUpAnswer[];
    return { result, followUp, deep };
  } catch (e) {
    console.warn('[WealthFree] Failed to load state from sessionStorage:', e);
    return null;
  }
}

function clearResultSession() {
  sessionStorage.removeItem(SS_KEY_RESULT);
  sessionStorage.removeItem(SS_KEY_FOLLOWUP);
  sessionStorage.removeItem(SS_KEY_DEEP);
  sessionStorage.removeItem(SS_KEY_PAY_RESUME);
}

function FreeFooter() {
  const { footerRef } = useFooterHeight();
  return (
    <div
      ref={footerRef}
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t py-3 px-4"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <p className="text-muted-foreground text-xs text-center">
        北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
      </p>
    </div>
  );
}

type PageState = "questions" | "result";

export default function WealthAssessmentFreePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>("questions");
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [followUpInsights, setFollowUpInsights] = useState<FollowUpAnswer[]>([]);
  const [deepFollowUpAnswers, setDeepFollowUpAnswers] = useState<DeepFollowUpAnswer[]>([]);
  const [autoOpenPay, setAutoOpenPay] = useState(false);

  // 防止重复处理恢复逻辑
  const resumeHandledRef = useRef(false);

  // ─── 页面加载时：从 sessionStorage 恢复结果状态（仅执行一次） ───
  useEffect(() => {
    if (resumeHandledRef.current) return;
    resumeHandledRef.current = true;

    const cached = loadResultFromSession();
    if (!cached) return;

    console.log('[WealthFree] Restoring assessment result from sessionStorage');
    setCurrentResult(cached.result);
    setFollowUpInsights(cached.followUp);
    setDeepFollowUpAnswers(cached.deep);
    setPageState("result");
  }, []);

  // ─── 支付恢复：登录回跳 / 微信 OAuth 回跳后自动弹出支付 ───
  const payResumeHandledRef = useRef(false);
  useEffect(() => {
    if (payResumeHandledRef.current) return;

    const url = new URL(window.location.href);
    const isPayResume =
      sessionStorage.getItem(SS_KEY_PAY_RESUME) === '1' ||
      url.searchParams.get('payment_resume') === '1';

    if (!isPayResume) return;

    payResumeHandledRef.current = true;
    console.log('[WealthFree] Payment resume detected, will auto-trigger pay dialog');

    // 缓存 openId 以供支付弹窗使用
    const paymentOpenId = url.searchParams.get('payment_openid');
    if (paymentOpenId) {
      sessionStorage.setItem('wechat_payment_openid', paymentOpenId);
    }

    // 清理 URL 参数，使用 replaceState 避免触发 React 重渲染
    url.searchParams.delete('payment_resume');
    url.searchParams.delete('payment_openid');
    url.searchParams.delete('payment_token_hash');
    url.searchParams.delete('payment_auth_error');
    url.searchParams.delete('is_new_user');
    window.history.replaceState({}, '', url.toString());

    // 清除 sessionStorage 标记
    sessionStorage.removeItem(SS_KEY_PAY_RESUME);
    sessionStorage.removeItem('pay_auth_in_progress');

    setAutoOpenPay(true);
  }, []);

  // 完成测评回调 — 直接展示结果，无需付费
  const handleComplete = useCallback((
    result: AssessmentResult,
    answers: Record<number, number>,
    insights?: FollowUpAnswer[],
    deepAnswers?: DeepFollowUpAnswer[]
  ) => {
    const fi = insights || [];
    const da = deepAnswers || [];
    setCurrentResult(result);
    setCurrentAnswers(answers);
    setFollowUpInsights(fi);
    setDeepFollowUpAnswers(da);
    setPageState("result");
    // 缓存结果到 sessionStorage，供登录/授权回跳后恢复
    saveResultToSession(result, fi, da);
  }, []);

  // 重新测评
  const handleRetake = useCallback(() => {
    setCurrentResult(null);
    setCurrentAnswers({});
    setFollowUpInsights([]);
    setDeepFollowUpAnswers([]);
    setPageState("questions");
    // 清除缓存
    clearResultSession();
  }, []);

  // 退出测评
  const handleExit = useCallback(() => {
    setPageState("questions");
  }, []);

  // 购买前检查登录状态
  const handleAuthRequired = useCallback((): boolean => {
    if (user) return true;
    toast.info("请先登录后再购买训练营");
    // 标记支付恢复，登录后自动回到结果页
    sessionStorage.setItem(SS_KEY_PAY_RESUME, '1');
    const currentPath = window.location.pathname + window.location.search;
    setPostAuthRedirect(currentPath);
    // 同时通过 ?redirect= 传递，确保 Auth 页面在所有场景下都能正确回跳
    navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    return false;
  }, [user, navigate]);

  return (
    <div
      className="h-screen overflow-y-auto overscroll-contain bg-background"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <DynamicOGMeta pageKey="wealthAssessmentLite" />

      {pageState === "questions" && (
        <WealthBlockQuestions
          onComplete={handleComplete}
          onExit={handleExit}
          skipStartScreen={true}
          showFooterInfo={false}
        />
      )}

      {pageState === "result" && currentResult && (
        <WealthBlockResult
          result={currentResult}
          followUpInsights={followUpInsights}
          deepFollowUpAnswers={deepFollowUpAnswers}
          onRetake={handleRetake}
          onAuthRequired={handleAuthRequired}
          autoOpenPay={autoOpenPay}
        />
      )}
      {/* 公司信息和ICP备案 — 参考 LiteFooter 样式 */}
      <FreeFooter />
    </div>
  );
}

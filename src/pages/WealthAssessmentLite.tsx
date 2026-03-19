import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAssessmentPurchase } from "@/hooks/useAssessmentPurchase";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { LiteIntroCard } from "@/components/wealth-block/LiteIntroCard";
import { LiteFooter } from "@/components/wealth-block/LiteFooter";
import { WealthBlockQuestions } from "@/components/wealth-block/WealthBlockQuestions";
import { WealthBlockResult } from "@/components/wealth-block/WealthBlockResult";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { AssessmentResult, FollowUpAnswer } from "@/components/wealth-block/wealthBlockData";
import { DeepFollowUpAnswer } from "@/components/wealth-block/DeepFollowUpDialog";
import { BloomInviteCodeEntry } from "@/components/wealth-block/BloomInviteCodeEntry";

// ─── sessionStorage keys for state recovery ───
const SS_KEY_RESULT = 'wealth_lite_assessment_result';
const SS_KEY_FOLLOWUP = 'wealth_lite_followup_insights';
const SS_KEY_DEEP = 'wealth_lite_deep_followup';

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
    console.warn('[WealthLite] Failed to save state to sessionStorage:', e);
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
    console.warn('[WealthLite] Failed to load state from sessionStorage:', e);
    return null;
  }
}

function clearResultSession() {
  sessionStorage.removeItem(SS_KEY_RESULT);
  sessionStorage.removeItem(SS_KEY_FOLLOWUP);
  sessionStorage.removeItem(SS_KEY_DEEP);
}

type PageState = "questions" | "result";

export default function WealthAssessmentLitePage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("questions");
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [followUpInsights, setFollowUpInsights] = useState<FollowUpAnswer[]>([]);
  const [deepFollowUpAnswers, setDeepFollowUpAnswers] = useState<DeepFollowUpAnswer[]>([]);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showCampPayDialog, setShowCampPayDialog] = useState(false);
  
  const { user } = useAuth();
  const { data: purchaseRecord, refetch: refetchPurchase, isLoading: isPurchaseLoading } = useAssessmentPurchase();
  const hasPurchased = !!purchaseRecord;
  const payResumeHandledRef = useRef(false);
  const resumeHandledRef = useRef(false);

  // ─── 页面加载时：从 sessionStorage 恢复结果状态 ───
  useEffect(() => {
    if (resumeHandledRef.current) return;
    resumeHandledRef.current = true;

    const cached = loadResultFromSession();
    if (!cached) return;

    console.log('[WealthLite] Restoring assessment result from sessionStorage');
    setCurrentResult(cached.result);
    setFollowUpInsights(cached.followUp);
    setDeepFollowUpAnswers(cached.deep);
    setPageState("result");
  }, []);

  // 微信 OAuth 回调 / 登录后恢复支付弹窗（等待购买状态查询完成后再决定）
  useEffect(() => {
    // 避免重复处理
    if (payResumeHandledRef.current) return;
    // 等购买状态查询完成
    if (isPurchaseLoading) return;

    const url = new URL(window.location.href);
    const shouldResumeAssessment = url.searchParams.get('assessment_pay_resume') === '1';
    const shouldResumeCamp = url.searchParams.get('payment_resume') === '1';
    const shouldResumeCampAuth = url.searchParams.get('camp_pay_resume') === '1';
    const paymentOpenId = url.searchParams.get('payment_openid');
    const payFlow = url.searchParams.get('pay_flow');

    if (!shouldResumeAssessment && !shouldResumeCamp && !shouldResumeCampAuth) return;

    // 标记已处理
    payResumeHandledRef.current = true;

    // 判断是训练营支付还是测评支付
    const isCampPurchase = shouldResumeCampAuth || payFlow === 'camp_purchase' || 
      (() => {
        try {
          const cached = sessionStorage.getItem('pending_payment_package');
          if (cached) {
            const pkg = JSON.parse(cached);
            return pkg.key?.startsWith('camp-');
          }
        } catch {}
        return false;
      })();

    console.log('[WealthAssessmentLite] Resuming payment after WeChat OAuth, openId:', paymentOpenId ? 'present' : 'missing', 'hasPurchased:', hasPurchased, 'isCampPurchase:', isCampPurchase);

    // 缓存 openId 以供支付弹窗使用
    if (paymentOpenId) {
      sessionStorage.setItem('wechat_payment_openid', paymentOpenId);
    }

    // 清理 URL 参数，避免重复触发
    url.searchParams.delete('assessment_pay_resume');
    url.searchParams.delete('payment_resume');
    url.searchParams.delete('payment_openid');
    url.searchParams.delete('payment_token_hash');
    url.searchParams.delete('payment_auth_error');
    url.searchParams.delete('is_new_user');
    url.searchParams.delete('pay_flow');
    url.searchParams.delete('camp_pay_resume');
    window.history.replaceState({}, '', url.toString());

    // 清除授权进行中标记
    sessionStorage.removeItem('pay_auth_in_progress');

    if (isCampPurchase) {
      // 训练营支付恢复：直接打开训练营支付弹窗（不需要测评结果数据）
      if (hasPurchased) {
        console.log('[WealthAssessmentLite] Already purchased camp, skipping');
        return;
      }
      setTimeout(() => {
        setShowCampPayDialog(true);
      }, 500);
      return;
    }

    // 测评支付恢复
    if (hasPurchased) {
      console.log('[WealthAssessmentLite] Already purchased, skipping payment dialog');
      return;
    }

    // 未购买：延迟打开测评支付弹窗
    setTimeout(() => {
      setShowPayDialog(true);
    }, 500);
  }, [isPurchaseLoading, hasPurchased]);
  
  // 完成测评回调
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
    // 缓存结果到 sessionStorage，供登录/授权回跳后恢复
    saveResultToSession(result, fi, da);
    
    if (hasPurchased) {
      setPageState("result");
    } else if (user) {
      // 已登录但未购买：显示付费弹窗
      setShowPayDialog(true);
    } else {
      // 未登录：先展示结果页，购买时再要求登录
      setPageState("result");
    }
  }, [hasPurchased]);
  
  // 支付成功回调
  const handlePaymentSuccess = useCallback((userId: string) => {
    console.log("[WealthAssessmentLite] Payment success for user:", userId);
    setShowPayDialog(false);
    refetchPurchase();
    setPageState("result");
  }, [refetchPurchase]);

  // 训练营支付成功回调
  const handleCampPaySuccess = useCallback(() => {
    console.log("[WealthAssessmentLite] Camp payment success");
    setShowCampPayDialog(false);
    toast.success("购买成功！");
    refetchPurchase();
    // 跳转到训练营介绍页
    navigate('/camp-intro/wealth_block_7');
  }, [refetchPurchase, navigate]);

  // 重新测评
  const handleRetake = useCallback(() => {
    setCurrentResult(null);
    setCurrentAnswers({});
    setFollowUpInsights([]);
    setDeepFollowUpAnswers([]);
    setPageState("questions");
    clearResultSession();
  }, []);

  // 退出测评 - 重新开始答题
  const handleExit = useCallback(() => {
    setPageState("questions");
  }, []);
  // 购买/解锁前检查登录状态（支持区分测评购买和训练营购买）
  const requireAuth = useCallback((forCamp?: boolean): boolean => {
    if (user) return true;
    toast.info("请先登录后再购买");
    const redirectUrl = new URL(window.location.href);
    if (forCamp) {
      redirectUrl.searchParams.set('camp_pay_resume', '1');
    }
    const currentPath = redirectUrl.pathname + redirectUrl.search;
    setPostAuthRedirect(currentPath);
    navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    return false;
  }, [user, navigate]);

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-background"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <DynamicOGMeta pageKey="wealthAssessmentLite" />
      
      {/* 测评页 */}
      {pageState === "questions" && (
        <div>
          {/* 绽放邀请码入口 - 未购买时在测评页顶部显示 */}
          {!hasPurchased && user && (
            <div className="px-4 pt-3">
              <BloomInviteCodeEntry
                variant="card"
                onSuccess={() => {
                  refetchPurchase();
                }}
              />
            </div>
          )}
          <WealthBlockQuestions 
            onComplete={handleComplete} 
            onExit={handleExit}
            skipStartScreen={true}
            showFooterInfo={!hasPurchased}
          />
        </div>
      )}
      
      {/* 结果页 */}
      {pageState === "result" && currentResult && (
        <WealthBlockResult 
          result={currentResult} 
          followUpInsights={followUpInsights}
          deepFollowUpAnswers={deepFollowUpAnswers}
          onRetake={handleRetake}
          onAuthRequired={requireAuth}
        />
      )}

      {/* 固定底部付费按钮 - 未购买时显示 */}
      {pageState === "result" && !hasPurchased && (
        <div
          className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t px-4 py-3 flex items-center justify-between gap-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-600">¥9.9</span>
            <span className="px-1.5 py-0.5 bg-red-500 rounded text-[10px] text-white font-medium animate-pulse">限时</span>
            <span className="text-xs text-muted-foreground">解锁完整分析报告</span>
          </div>
          <Button
            onClick={() => { if (requireAuth()) setShowPayDialog(true); }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-5 h-10 rounded-full shadow-md"
          >
            立即解锁
          </Button>
        </div>
      )}
      
      {/* 测评付费弹窗 */}
      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={handlePaymentSuccess}
        userId={user?.id}
        hasPurchased={hasPurchased}
        packageKey="wealth_block_assessment"
        packageName="财富卡点测评"
      />

      {/* 训练营付费弹窗 - OAuth 回调后恢复用 */}
      <UnifiedPayDialog
        open={showCampPayDialog}
        onOpenChange={setShowCampPayDialog}
        packageInfo={{
          key: 'camp-wealth_block_7',
          name: '财富觉醒训练营',
          price: 299,
        }}
        onSuccess={handleCampPaySuccess}
        openId={sessionStorage.getItem('wechat_payment_openid') || undefined}
      />
    </div>
  );
}
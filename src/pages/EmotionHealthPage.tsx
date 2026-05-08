import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import PageHeader from "@/components/PageHeader";
import { AssessmentPromoShareDialog } from "@/components/dynamic-assessment/AssessmentPromoShareDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, Share2, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { useEmotionHealthPurchase } from "@/hooks/useEmotionHealthPurchase";
import { usePackageByKey } from "@/hooks/usePackages";

import {
  EmotionHealthStartScreen,
  EmotionHealthQuestions,
  EmotionHealthResult,
  EmotionHealthShareDialog,
  EmotionHealthHistory,
  calculateEmotionHealthResult,
  type EmotionHealthResultType
} from "@/components/emotion-health";
import type { EmotionHealthHistoryRecord } from "@/hooks/useEmotionHealthHistory";
import { Lock } from "lucide-react";

function ResultLoginGate({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-rose-950/30 dark:via-background dark:to-purple-950/30 p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">你的专属测评报告已生成</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          登录后立即查看完整结果、AI 教练解读与个性化成长建议
        </p>
      </div>
      <Button
        size="lg"
        className="w-full h-12 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
        onClick={onLogin}
      >
        登录 / 注册查看完整报告
      </Button>
      <p className="text-[11px] text-muted-foreground">登录后答题进度自动保留</p>
    </div>
  );
}

type PageStep = 'start' | 'questions' | 'result';
type ActiveTab = 'assessment' | 'history';

const STORAGE_KEY = 'emotion_health_progress';
const PACKAGE_KEY = 'emotion_health_assessment';

export default function EmotionHealthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resumePayHandledRef = useRef(false);
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<PageStep>('start');
  const [activeTab, setActiveTab] = useState<ActiveTab>('assessment');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<EmotionHealthResultType | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // 支付相关状态
  const [showPayDialog, setShowPayDialog] = useState(false);
  
  
  // 购买状态检查（情绪健康测评已改为免费，hasPurchased 永远为 true 以绕过付费门控）
  const { data: purchaseRecord, isLoading: purchaseLoading, refetch: refetchPurchase } = useEmotionHealthPurchase();
  const hasPurchased = true;
  
  // 获取价格
  const { data: packageData } = usePackageByKey(PACKAGE_KEY);
  const price = packageData?.price ?? 9.9;

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  // 支付回调处理
  usePaymentCallback({
    onSuccess: (orderNo) => {
      console.log('[EmotionHealth] Payment callback success, order:', orderNo);
      setShowPayDialog(false);
      refetchPurchase();
      // 支付成功后直接进入测评
      setStep('questions');
    },
    autoRedirect: false,
  });

  // 检测支付恢复参数（仅在首次出现该参数时触发一次，避免用户关闭弹窗后被反复重新拉起）
  useEffect(() => {
    const resumePay = searchParams.get('assessment_pay_resume');
    if (resumePay !== '1') return;
    if (resumePayHandledRef.current) return;
    if (!user || hasPurchased) return;

    resumePayHandledRef.current = true;
    console.log('[EmotionHealth] Resuming payment dialog after auth');
    setShowPayDialog(true);

    // 通过 React Router 移除参数，确保 searchParams 同步更新（避免 history.replaceState 导致的状态不同步）
    const next = new URLSearchParams(searchParams);
    next.delete('assessment_pay_resume');
    setSearchParams(next, { replace: true });
  }, [searchParams, user, hasPurchased, setSearchParams]);

  // 恢复进度
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { answers: savedAnswers, step: savedStep } = JSON.parse(saved);
        if (savedAnswers && Object.keys(savedAnswers).length > 0) {
          setAnswers(savedAnswers);
          if (savedStep === 'questions' && hasPurchased) {
            setStep('questions');
          }
        }
      } catch (e) {
        console.error('Failed to restore progress:', e);
      }
    }
  }, [hasPurchased]);

  // 保存进度
  useEffect(() => {
    if (step === 'questions' && Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step }));
    }
  }, [answers, step]);

  // 跳转登录前写入回跳信息（登录后回到本页）
  const redirectToAuth = useCallback(() => {
    const target = '/emotion-health';
    try {
      localStorage.setItem('auth_redirect', target);
      localStorage.setItem('auth_redirect_ts', String(Date.now()));
    } catch (e) {
      console.warn('[EmotionHealth] Failed to set auth_redirect', e);
    }
    navigate(`/auth?redirect=${encodeURIComponent(target)}`, { state: { from: target } });
  }, [navigate]);

  // 处理支付按钮点击 —— 与产品中心一致：直接打开支付弹窗，
  // openid 的获取与缓存完全交由 WechatPayDialog 内部处理（cached_payment_openid_gzh）
  const handlePayClick = useCallback(() => {
    if (!user) {
      toast.error("请先登录");
      redirectToAuth();
      return;
    }
    setShowPayDialog(true);
  }, [user, redirectToAuth]);

  // 处理开始测评
  const handleStart = useCallback(() => {
    if (!user) {
      toast.error("请先登录");
      redirectToAuth();
      return;
    }

    if (!hasPurchased) {
      handlePayClick();
      return;
    }

    setStep('questions');
  }, [user, hasPurchased, redirectToAuth, handlePayClick]);

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
      const { data: inserted, error } = await supabase
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
          is_paid: true,
          order_id: purchaseRecord?.id || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      setAssessmentId(inserted?.id ?? null);
      
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

  // 查看历史记录结果
  const handleViewHistoryResult = (record: EmotionHealthHistoryRecord) => {
    const resultFromHistory: EmotionHealthResultType = {
      energyIndex: record.energy_index,
      anxietyIndex: record.anxiety_index,
      stressIndex: record.stress_index,
      exhaustionScore: record.exhaustion_score,
      tensionScore: record.tension_score,
      suppressionScore: record.suppression_score,
      avoidanceScore: record.avoidance_score,
      primaryPattern: record.primary_pattern as any,
      secondaryPattern: record.secondary_pattern as any,
      blockedDimension: record.blocked_dimension as any,
      recommendedPath: record.recommended_path || '',
    };
    setResult(resultFromHistory);
    setAnswers(record.answers as Record<number, number>);
    setStep('result');
    setActiveTab('assessment');
  };

  // 支付成功后的处理
  const handlePaymentSuccess = useCallback((newUserId: string) => {
    console.log('[EmotionHealth] Payment success, entering assessment, userId:', newUserId);
    setShowPayDialog(false);
    refetchPurchase();
    setStep('questions');
  }, [refetchPurchase]);

  const isLoading = authLoading || purchaseLoading;

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <Helmet>
        <title>情绪健康测评 - 有劲AI</title>
        <meta name="description" content="基于心理学专业量表，帮助你深入了解当前的情绪状态与反应模式" />
      </Helmet>
      
      <PageHeader 
        title={step === 'result' ? "测评结果" : "情绪健康测评"} 
        showBack={true}
        rightActions={
          <div className="flex items-center gap-1">
            {/* AI教练专区入口按钮 */}
            <Button
              variant="ghost"
              onClick={() => navigate("/coach-space")}
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-full 
                         bg-gradient-to-r from-amber-400 to-orange-400 
                         hover:from-amber-500 hover:to-orange-500 
                         text-white shadow-md hover:shadow-lg 
                         transition-all duration-200 hover:scale-[1.02]
                         flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">AI教练</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            
            {/* 分享按钮 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        }
      />

      <main className="container max-w-2xl mx-auto px-4 py-4">
        {step === 'start' && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="assessment" className="gap-2">
                <FileText className="w-4 h-4" />
                测评
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                历史记录
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assessment">
              <EmotionHealthStartScreen 
                onStart={handleStart}
                onPayClick={handlePayClick}
                hasPurchased={hasPurchased}
                isLoading={isLoading}
                price={price}
              />
            </TabsContent>
            
            <TabsContent value="history">
              <EmotionHealthHistory onViewResult={handleViewHistoryResult} />
            </TabsContent>
          </Tabs>
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
          !user ? (
            <ResultLoginGate onLogin={redirectToAuth} />
          ) : (
            <>
              <EmotionHealthResult
                result={result}
                onShare={handleShare}
                onRetake={handleRetake}
              />
              <EmotionHealthShareDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                result={result}
              />
            </>
          )
        )}

        {/* 非结果页的推广分享弹窗 */}
        {step !== 'result' && (
          <AssessmentPromoShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} assessmentKey="emotion_health" />
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

      {/* 支付弹窗 */}
      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={handlePaymentSuccess}
        userId={user?.id}
        hasPurchased={hasPurchased}
        packageKey="emotion_health_assessment"
        packageName="情绪健康测评"
      />
    </div>
  );
}

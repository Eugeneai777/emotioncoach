import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History } from "lucide-react";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { useEmotionHealthPurchase } from "@/hooks/useEmotionHealthPurchase";
import { usePackageByKey } from "@/hooks/usePackages";
import { isWeChatBrowser } from "@/utils/platform";
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

type PageStep = 'start' | 'questions' | 'result';
type ActiveTab = 'assessment' | 'history';

const STORAGE_KEY = 'emotion_health_progress';
const PACKAGE_KEY = 'emotion_health_assessment';

export default function EmotionHealthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<PageStep>('start');
  const [activeTab, setActiveTab] = useState<ActiveTab>('assessment');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<EmotionHealthResultType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // 支付相关状态
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [isRedirectingForAuth, setIsRedirectingForAuth] = useState(false);
  
  // 购买状态检查
  const { data: purchaseRecord, isLoading: purchaseLoading, refetch: refetchPurchase } = useEmotionHealthPurchase();
  const hasPurchased = !!purchaseRecord;
  
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

  // 检测支付恢复参数
  useEffect(() => {
    const resumePay = searchParams.get('assessment_pay_resume');
    if (resumePay === '1' && user && !hasPurchased && !showPayDialog) {
      console.log('[EmotionHealth] Resuming payment dialog after auth');
      setShowPayDialog(true);
      // 清理 URL 参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('assessment_pay_resume');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, user, hasPurchased, showPayDialog]);

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

  // 触发微信静默授权
  const triggerWeChatSilentAuth = useCallback(async () => {
    setIsRedirectingForAuth(true);
    try {
      const resumeUrl = new URL(window.location.href);
      resumeUrl.searchParams.set('assessment_pay_resume', '1');

      const { data, error } = await supabase.functions.invoke('wechat-pay-auth', {
        body: {
          redirectUri: resumeUrl.toString(),
          flow: 'emotion_health_assessment',
        },
      });

      if (error || !data?.authUrl) {
        console.error('[EmotionHealth] Failed to get silent auth URL:', error || data);
        setIsRedirectingForAuth(false);
        // 授权失败，直接打开支付弹窗（使用扫码支付）
        setShowPayDialog(true);
        return;
      }

      window.location.href = data.authUrl;
    } catch (err) {
      console.error('[EmotionHealth] Silent auth error:', err);
      setIsRedirectingForAuth(false);
      setShowPayDialog(true);
    }
  }, []);

  // 处理支付按钮点击
  const handlePayClick = useCallback(() => {
    if (!user) {
      toast.error("请先登录");
      navigate('/auth', { state: { from: '/emotion-health' } });
      return;
    }

    // 微信环境下，检查是否需要静默授权获取 openId
    if (isWeChatBrowser()) {
      const existingOpenId = sessionStorage.getItem('wechat_openid');
      if (!existingOpenId) {
        triggerWeChatSilentAuth();
        return;
      }
    }

    setShowPayDialog(true);
  }, [user, navigate, triggerWeChatSilentAuth]);

  // 处理开始测评
  const handleStart = useCallback(() => {
    if (!user) {
      toast.error("请先登录");
      navigate('/auth', { state: { from: '/emotion-health' } });
      return;
    }

    if (!hasPurchased) {
      handlePayClick();
      return;
    }

    setStep('questions');
  }, [user, hasPurchased, navigate, handlePayClick]);

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
          is_paid: true,
          order_id: purchaseRecord?.id || null,
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

  const isLoading = authLoading || purchaseLoading || isRedirectingForAuth;

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <Helmet>
        <title>情绪健康测评 - 有劲AI</title>
        <meta name="description" content="基于心理学专业量表，帮助你深入了解当前的情绪状态与反应模式" />
      </Helmet>
      
      <PageHeader 
        title={step === 'result' ? "测评结果" : "情绪健康测评"} 
        showBack={step !== 'start' || activeTab !== 'assessment'}
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
      />
    </div>
  );
}

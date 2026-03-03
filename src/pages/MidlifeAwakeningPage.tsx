import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, Share2, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { usePackageByKey } from "@/hooks/usePackages";
import { isWeChatBrowser } from "@/utils/platform";
import { useQuery } from "@tanstack/react-query";
import {
  MidlifeAwakeningStartScreen,
  MidlifeAwakeningQuestions,
  MidlifeAwakeningResult,
  MidlifeAwakeningShareDialog,
  MidlifeAwakeningHistory,
  calculateMidlifeResult,
  type MidlifeResult,
  type MidlifeHistoryRecord,
} from "@/components/midlife-awakening";

type PageStep = 'start' | 'questions' | 'result';
type ActiveTab = 'assessment' | 'history';

const STORAGE_KEY = 'midlife_awakening_progress';
const PACKAGE_KEY = 'midlife_awakening_assessment';

// 购买状态 hook
function useMidlifeAwakeningPurchase() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['midlife-awakening-purchase', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_key', 'midlife_awakening_assessment')
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export default function MidlifeAwakeningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<PageStep>('start');
  const [activeTab, setActiveTab] = useState<ActiveTab>('assessment');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<MidlifeResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [isRedirectingForAuth, setIsRedirectingForAuth] = useState(false);

  const { data: purchaseRecord, isLoading: purchaseLoading, refetch: refetchPurchase } = useMidlifeAwakeningPurchase();
  const hasPurchased = !!purchaseRecord;
  const { data: packageData } = usePackageByKey(PACKAGE_KEY);
  const price = packageData?.price ?? 9.9;

  usePaymentCallback({
    onSuccess: () => {
      setShowPayDialog(false);
      refetchPurchase();
      setStep('questions');
    },
    autoRedirect: false,
  });

  // 恢复进度
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { answers: savedAnswers, step: savedStep } = JSON.parse(saved);
        if (savedAnswers && Object.keys(savedAnswers).length > 0) {
          setAnswers(savedAnswers);
          if (savedStep === 'questions' && hasPurchased) setStep('questions');
        }
      } catch (e) { console.error('Failed to restore progress:', e); }
    }
  }, [hasPurchased]);

  useEffect(() => {
    if (step === 'questions' && Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step }));
    }
  }, [answers, step]);

  const triggerWeChatSilentAuth = useCallback(async () => {
    setIsRedirectingForAuth(true);
    try {
      const resumeUrl = new URL(window.location.href);
      resumeUrl.searchParams.set('assessment_pay_resume', '1');
      const { data, error } = await supabase.functions.invoke('wechat-pay-auth', {
        body: { redirectUri: resumeUrl.toString(), flow: 'midlife_awakening_assessment' },
      });
      if (error || !data?.authUrl) { setIsRedirectingForAuth(false); setShowPayDialog(true); return; }
      window.location.href = data.authUrl;
    } catch { setIsRedirectingForAuth(false); setShowPayDialog(true); }
  }, []);

  const handlePayClick = useCallback(() => {
    if (!user) { toast.error("请先登录"); navigate('/auth', { state: { from: '/midlife-awakening' } }); return; }
    if (isWeChatBrowser()) {
      const existingOpenId = sessionStorage.getItem('wechat_openid');
      if (!existingOpenId) { triggerWeChatSilentAuth(); return; }
    }
    setShowPayDialog(true);
  }, [user, navigate, triggerWeChatSilentAuth]);

  const handleStart = useCallback(() => {
    if (!user) { toast.error("请先登录"); navigate('/auth', { state: { from: '/midlife-awakening' } }); return; }
    if (!hasPurchased) { handlePayClick(); return; }
    setStep('questions');
  }, [user, hasPurchased, navigate, handlePayClick]);

  const handleComplete = async () => {
    if (!user) { toast.error("请先登录"); return; }
    const calculatedResult = calculateMidlifeResult(answers);
    setResult(calculatedResult);
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('midlife_awakening_assessments')
        .insert({
          user_id: user.id,
          personality_type: calculatedResult.personalityType,
          dimensions: calculatedResult.dimensions as any,
          internal_friction_risk: calculatedResult.internalFrictionRisk,
          action_power: calculatedResult.actionPower,
          mission_clarity: calculatedResult.missionClarity,
          regret_risk: calculatedResult.regretRisk,
          support_warmth: calculatedResult.supportWarmth,
          answers: answers as any,
          is_paid: true,
          order_id: purchaseRecord?.id || null,
        });
      if (error) throw error;
      localStorage.removeItem(STORAGE_KEY);
      setStep('result');
    } catch (error) {
      console.error('Failed to save assessment:', error);
      toast.error("保存结果失败，请重试");
    } finally { setIsSaving(false); }
  };

  const handleBack = () => { step === 'questions' ? setStep('start') : navigate(-1); };
  const handleRetake = () => { setAnswers({}); setResult(null); setStep('start'); localStorage.removeItem(STORAGE_KEY); };

  const handleViewHistoryResult = (record: MidlifeHistoryRecord) => {
    const dims = (record.dimensions as any) || [];
    const r: MidlifeResult = {
      dimensions: dims,
      personalityType: record.personality_type as any,
      internalFrictionRisk: record.internal_friction_risk,
      actionPower: record.action_power,
      missionClarity: record.mission_clarity,
      regretRisk: record.regret_risk,
      supportWarmth: record.support_warmth,
    };
    setResult(r);
    setAnswers((record.answers as Record<number, number>) || {});
    setStep('result');
    setActiveTab('assessment');
  };

  const handlePaymentSuccess = useCallback(() => {
    setShowPayDialog(false);
    refetchPurchase();
    setStep('questions');
  }, [refetchPurchase]);

  const isLoading = authLoading || purchaseLoading || isRedirectingForAuth;

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <Helmet>
        <title>中场觉醒力测评 3.0 - 有劲AI</title>
        <meta name="description" content="6维深度扫描，发现你的中场人格，AI教练1对1觉醒对话" />
      </Helmet>

      <PageHeader
        title={step === 'result' ? "测评结果" : "中场觉醒力测评"}
        showBack={true}
        rightActions={
          <div className="flex items-center gap-1">
            <Button variant="ghost" onClick={() => navigate("/coach-space")}
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">AI教练</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9" onClick={() => setShareDialogOpen(true)}>
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        }
      />

      <main className="container max-w-2xl mx-auto px-4 py-4">
        {step === 'start' && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="assessment" className="gap-2"><FileText className="w-4 h-4" />测评</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" />历史记录</TabsTrigger>
            </TabsList>
            <TabsContent value="assessment">
              <MidlifeAwakeningStartScreen onStart={handleStart} onPayClick={handlePayClick} hasPurchased={hasPurchased} isLoading={isLoading} price={price} />
            </TabsContent>
            <TabsContent value="history">
              <MidlifeAwakeningHistory onViewResult={handleViewHistoryResult} />
            </TabsContent>
          </Tabs>
        )}

        {step === 'questions' && (
          <MidlifeAwakeningQuestions answers={answers} onAnswerChange={(id, v) => setAnswers(prev => ({ ...prev, [id]: v }))} onComplete={handleComplete} onBack={handleBack} />
        )}

        {step === 'result' && result && (
          <>
            <MidlifeAwakeningResult result={result} onShare={() => setShareDialogOpen(true)} onRetake={handleRetake} onViewHistory={() => { setStep('start'); setActiveTab('history'); }} />
            <MidlifeAwakeningShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} result={result} />
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

      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={handlePaymentSuccess}
        userId={user?.id}
        hasPurchased={hasPurchased}
        packageKey="midlife_awakening_assessment"
        packageName="中场觉醒力测评"
      />
    </div>
  );
}

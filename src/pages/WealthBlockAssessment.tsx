import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ClipboardList, History, TrendingUp, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WealthBlockQuestions } from "@/components/wealth-block/WealthBlockQuestions";
import { WealthBlockResult } from "@/components/wealth-block/WealthBlockResult";
import { WealthBlockHistory, HistoryRecord } from "@/components/wealth-block/WealthBlockHistory";
import { WealthBlockTrend } from "@/components/wealth-block/WealthBlockTrend";
import { AssessmentComparison } from "@/components/wealth-block/AssessmentComparison";
import { AssessmentIntroCard } from "@/components/wealth-block/AssessmentIntroCard";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { AssessmentResult, blockInfo, patternInfo, FollowUpAnswer, calculateResult } from "@/components/wealth-block/wealthBlockData";
import { DeepFollowUpAnswer } from "@/components/wealth-block/DeepFollowUpDialog";
import { useWealthCampAnalytics } from "@/hooks/useWealthCampAnalytics";
import WealthInviteCardDialog from "@/components/wealth-camp/WealthInviteCardDialog";

export default function WealthBlockAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "assessment");
  const [showIntro, setShowIntro] = useState(true);
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [currentFollowUpInsights, setCurrentFollowUpInsights] = useState<FollowUpAnswer[] | undefined>(undefined);
  const [currentDeepFollowUpAnswers, setCurrentDeepFollowUpAnswers] = useState<DeepFollowUpAnswer[] | undefined>(undefined);
  const [showResult, setShowResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);
  const [previousAssessmentId, setPreviousAssessmentId] = useState<string | null>(null);
  
  // 支付相关状态
  const [showPayDialog, setShowPayDialog] = useState(false);
  
  // 历史记录
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { trackAssessmentTocamp, trackEvent } = useWealthCampAnalytics();

  // 页面访问埋点 + 加载历史记录
  useEffect(() => {
    // 埋点：测评页面访问
    trackEvent('assessment_page_viewed');
    
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("wealth_block_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistoryRecords(data as HistoryRecord[]);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleComplete = (
    result: AssessmentResult, 
    answers: Record<number, number>, 
    followUpInsights?: FollowUpAnswer[],
    deepFollowUpAnswers?: DeepFollowUpAnswer[]
  ) => {
    setCurrentResult(result);
    setCurrentAnswers(answers);
    setCurrentFollowUpInsights(followUpInsights);
    setCurrentDeepFollowUpAnswers(deepFollowUpAnswers);
    setShowResult(true);
    setIsSaved(false);
    
    // 埋点：测评完成
    trackAssessmentTocamp('assessment_completed', {
      dominant_block: result.dominantBlock,
      dominant_poor: result.dominantPoor,
      health_score: Math.round(
        ((5 - result.behaviorScore) / 4 * 33) +
        ((5 - result.emotionScore) / 4 * 33) +
        ((5 - result.beliefScore) / 4 * 34)
      ),
      has_deep_followup: !!deepFollowUpAnswers && deepFollowUpAnswers.length > 0,
    }).then(() => {
      console.log('✅ Assessment completion tracked');
    }).catch((err) => {
      console.error('❌ Failed to track assessment completion:', err);
    });
  };

  const handleSave = async () => {
    if (!user || !currentResult) {
      toast.error("请先登录后再保存");
      return;
    }

    setIsSaving(true);
    try {
      // Get most recent assessment for linking
      const { data: latestAssessment } = await supabase
        .from("wealth_block_assessments")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const prevId = latestAssessment?.id || null;
      setPreviousAssessmentId(prevId);

      // Calculate version number
      const newVersion = historyRecords.length + 1;

      // Save assessment result with version tracking
      const { data: savedRecord, error } = await supabase
        .from("wealth_block_assessments")
        .insert({
          user_id: user.id,
          answers: currentAnswers,
          behavior_score: currentResult.behaviorScore,
          emotion_score: currentResult.emotionScore,
          belief_score: currentResult.beliefScore,
          mouth_score: currentResult.mouthScore,
          hand_score: currentResult.handScore,
          eye_score: currentResult.eyeScore,
          heart_score: currentResult.heartScore,
          dominant_block: currentResult.dominantBlock,
          dominant_poor: currentResult.dominantPoor,
          reaction_pattern: currentResult.reactionPattern,
          version: newVersion,
          previous_assessment_id: prevId,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSavedAssessmentId(savedRecord?.id || null);

      // Sync user wealth profile for personalized coaching
      try {
        const healthScore = Math.round(
          ((5 - currentResult.behaviorScore) / 4 * 33) +
          ((5 - currentResult.emotionScore) / 4 * 33) +
          ((5 - currentResult.beliefScore) / 4 * 34)
        );

        console.log('🔄 开始同步用户财富画像...', { 
          user_id: user.id, 
          assessment_id: savedRecord?.id,
          health_score: healthScore,
          reaction_pattern: currentResult.reactionPattern 
        });

        const { data: profileData, error: profileError } = await supabase.functions.invoke('sync-wealth-profile', {
          body: {
            user_id: user.id,
            assessment_result: {
              assessment_id: savedRecord?.id,
              health_score: healthScore,
              reaction_pattern: currentResult.reactionPattern,
              dominant_level: currentResult.dominantBlock,
              top_poor: currentResult.dominantPoor,
              top_emotion: currentResult.dominantEmotionBlock || 'anxiety',
              top_belief: currentResult.dominantBeliefBlock || 'lack',
            }
          }
        });
        
        if (profileError) {
          console.error('❌ 用户画像同步失败:', profileError);
        } else {
          console.log('✅ 用户财富画像同步成功:', profileData);
          
          // 更新用户偏好教练为财富教练
          const { error: prefError } = await supabase
            .from('profiles')
            .update({ preferred_coach: 'wealth' })
            .eq('id', user.id);
          
          if (prefError) {
            console.error('❌ 更新用户偏好教练失败:', prefError);
          } else {
            console.log('✅ 用户偏好教练已更新为 wealth');
          }
        }
      } catch (profileError) {
        console.error('❌ 调用 sync-wealth-profile 异常:', profileError);
        // Don't fail the save if profile sync fails
      }
      
      setIsSaved(true);
      toast.success("测评结果已保存");
      loadHistory();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    setCurrentResult(null);
    setCurrentAnswers({});
    setCurrentFollowUpInsights(undefined);
    setCurrentDeepFollowUpAnswers(undefined);
    setShowResult(false);
    setIsSaved(false);
    setSavedAssessmentId(null);
    setPreviousAssessmentId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("wealth_block_assessments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setHistoryRecords(prev => prev.filter(r => r.id !== id));
      toast.success("记录已删除");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("删除失败");
    }
  };

  const handleViewDetail = (record: HistoryRecord) => {
    // 从 answers 重新计算完整结果（包含情绪/信念细分项）
    const answers = record.answers as Record<number, number>;
    if (answers && Object.keys(answers).length > 0) {
      const computed = calculateResult(answers);
      setCurrentResult(computed);
    } else {
      // 兜底：如果没有 answers，使用旧逻辑
      const result: AssessmentResult = {
        behaviorScore: record.behavior_score,
        emotionScore: record.emotion_score,
        beliefScore: record.belief_score,
        mouthScore: record.mouth_score || 0,
        handScore: record.hand_score || 0,
        eyeScore: record.eye_score || 0,
        heartScore: record.heart_score || 0,
        anxietyScore: 0,
        scarcityScore: 0,
        comparisonScore: 0,
        shameScore: 0,
        guiltScore: 0,
        lackScore: 0,
        linearScore: 0,
        stigmaScore: 0,
        unworthyScore: 0,
        relationshipScore: 0,
        dominantBlock: record.dominant_block,
        dominantPoor: record.dominant_poor || 'mouth',
        dominantEmotionBlock: 'anxiety',
        dominantBeliefBlock: 'lack',
        reactionPattern: record.reaction_pattern,
      };
      setCurrentResult(result);
    }
    setShowResult(true);
    setIsSaved(true);
    setActiveTab("assessment");
  };

  // 分享配置
  const shareTitle = "财富卡点测评 - 发现阻碍财富流动的隐藏模式";
  const shareDescription = "3分钟AI深度诊断，找出你行为、情绪、信念层的财富卡点，获取专属突破路径。";
  const shareImage = "https://wechat.eugenewe.net/og-wealth-block.png";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      {/* SEO & 微信分享 Meta Tags */}
      <Helmet>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        <meta name="keywords" content="财富卡点,财富测评,金钱心理,财富信念,有劲AI,财富教练,财富诊断" />
        
        {/* Open Graph / 微信分享 */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://wechat.eugenewe.net/wealth-block" />
        <meta property="og:site_name" content="有劲AI · 财富教练" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
      </Helmet>

      {/* 导航栏 - 融入暖色背景 */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-amber-50/95 via-orange-50/95 to-amber-50/95 backdrop-blur-md border-b border-amber-200/50">
        <div className="container max-w-sm sm:max-w-lg mx-auto px-3 sm:px-4 h-11 sm:h-12 flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => navigate("/energy-studio")}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="flex-1 font-semibold truncate text-sm sm:text-base">财富卡点测评</h1>
          <WealthInviteCardDialog
            defaultTab="assessment"
            trigger={
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            }
          />
        </div>
      </header>

      {/* 主内容 */}
      <main className="container max-w-sm sm:max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4 sm:mb-6 h-9 sm:h-10">
            <TabsTrigger value="assessment" className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">开始</span>测评
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">历史</span>记录
              {historyRecords.length > 0 && (
                <span className="ml-1 text-[10px] sm:text-xs bg-amber-100 text-amber-700 px-1 sm:px-1.5 rounded-full">
                  {historyRecords.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessment" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {showIntro && !showResult ? (
                <AssessmentIntroCard
                  isLoggedIn={!!user}
                  onStart={() => {
                    // 埋点：开始测评
                    trackEvent('assessment_started');
                    setShowIntro(false);
                  }}
                  onLogin={() => navigate("/auth?redirect=/wealth-block")}
                  onPay={() => setShowPayDialog(true)}
                />
              ) : showResult && currentResult ? (
                <div className="space-y-6">
                  {/* Assessment Comparison - show after save if has previous */}
                  {isSaved && savedAssessmentId && previousAssessmentId && (
                    <AssessmentComparison
                      currentAssessmentId={savedAssessmentId}
                      previousAssessmentId={previousAssessmentId}
                    />
                  )}
                  
                  <WealthBlockResult
                    result={currentResult}
                    followUpInsights={currentFollowUpInsights}
                    deepFollowUpAnswers={currentDeepFollowUpAnswers}
                    onRetake={handleRetake}
                    onSave={user ? handleSave : undefined}
                    isSaving={isSaving}
                    isSaved={isSaved}
                  />
                </div>
              ) : (
                <WealthBlockQuestions onComplete={handleComplete} />
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {!user ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="font-semibold mb-2">登录后查看历史记录</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    登录后可以保存测评结果并查看历史趋势
                  </p>
                  <Button onClick={() => navigate("/auth")}>
                    去登录
                  </Button>
                </div>
              ) : (
                <>
                  {/* 趋势分析 */}
                  <WealthBlockTrend records={historyRecords} />
                  
                  {/* 历史记录列表 */}
                  <WealthBlockHistory
                    records={historyRecords}
                    isLoading={isLoadingHistory}
                    onDelete={handleDelete}
                    onViewDetail={handleViewDetail}
                  />
                </>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* 支付对话框 */}
      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={(userId) => {
          // 支付+注册成功，开始测评
          setShowIntro(false);
          setShowPayDialog(false);
        }}
      />
    </div>
  );
}

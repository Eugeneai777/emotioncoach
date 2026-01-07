import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
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
import { AssessmentResult, blockInfo, patternInfo, FollowUpAnswer } from "@/components/wealth-block/wealthBlockData";
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
  const { trackAssessmentTocamp } = useWealthCampAnalytics();

  // 加载历史记录
  useEffect(() => {
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
    // 将历史记录转换为结果格式并展示
    const result: AssessmentResult = {
      behaviorScore: record.behavior_score,
      emotionScore: record.emotion_score,
      beliefScore: record.belief_score,
      mouthScore: record.mouth_score || 0,
      handScore: record.hand_score || 0,
      eyeScore: record.eye_score || 0,
      heartScore: record.heart_score || 0,
      anxietyScore: record.anxiety_score || 0,
      scarcityScore: record.scarcity_score || 0,
      comparisonScore: record.comparison_score || 0,
      shameScore: record.shame_score || 0,
      guiltScore: record.guilt_score || 0,
      lackScore: record.lack_score || 0,
      linearScore: record.linear_score || 0,
      stigmaScore: record.stigma_score || 0,
      unworthyScore: record.unworthy_score || 0,
      relationshipScore: record.relationship_score || 0,
      dominantBlock: record.dominant_block,
      dominantPoor: record.dominant_poor || 'mouth',
      dominantEmotionBlock: record.dominant_emotion_block || 'anxiety',
      dominantBeliefBlock: record.dominant_belief_block || 'lack',
      reactionPattern: record.reaction_pattern,
    };
    setCurrentResult(result);
    setShowResult(true);
    setIsSaved(true);
    setActiveTab("assessment");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background">
      {/* 品牌横幅 */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20">
        <div className="container max-w-lg mx-auto px-4 py-2 flex items-center justify-center gap-2">
          <span className="text-amber-500">💎</span>
          <span className="text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            有劲AI · 财富教练
          </span>
        </div>
      </div>

      {/* 导航栏 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-lg mx-auto px-4 h-12 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate("/energy-studio")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-semibold truncate">财富卡点测评</h1>
          <WealthInviteCardDialog
            defaultTab="assessment"
            trigger={
              <Button variant="ghost" size="icon" className="shrink-0">
                <Share2 className="w-5 h-5" />
              </Button>
            }
          />
        </div>
      </header>

      {/* 主内容 */}
      <main className="container max-w-lg mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="assessment" className="flex-1 gap-2">
              <ClipboardList className="w-4 h-4" />
              开始测评
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-2">
              <History className="w-4 h-4" />
              历史记录
              {historyRecords.length > 0 && (
                <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 rounded-full">
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
                  onStart={() => setShowIntro(false)}
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

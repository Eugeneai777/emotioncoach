import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ClipboardList, History, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WealthBlockQuestions } from "@/components/wealth-block/WealthBlockQuestions";
import { WealthBlockResult } from "@/components/wealth-block/WealthBlockResult";
import { WealthBlockHistory, HistoryRecord } from "@/components/wealth-block/WealthBlockHistory";
import { WealthBlockTrend } from "@/components/wealth-block/WealthBlockTrend";
import { AssessmentResult, blockInfo, patternInfo } from "@/components/wealth-block/wealthBlockData";

export default function WealthBlockAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "assessment");
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // 历史记录
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  const handleComplete = (result: AssessmentResult, answers: Record<number, number>) => {
    setCurrentResult(result);
    setCurrentAnswers(answers);
    setShowResult(true);
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!user || !currentResult) {
      toast.error("请先登录后再保存");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("wealth_block_assessments")
        .insert({
          user_id: user.id,
          answers: currentAnswers,
          behavior_score: currentResult.behaviorScore,
          emotion_score: currentResult.emotionScore,
          belief_score: currentResult.beliefScore,
          dominant_block: currentResult.dominantBlock,
          reaction_pattern: currentResult.reactionPattern,
        });

      if (error) throw error;
      
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
    setShowResult(false);
    setIsSaved(false);
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
      dominantBlock: record.dominant_block,
      reactionPattern: record.reaction_pattern,
    };
    setCurrentResult(result);
    setShowResult(true);
    setIsSaved(true);
    setActiveTab("assessment");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background">
      {/* 头部 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate("/energy-studio")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">财富卡点测评</h1>
          </div>
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
              {showResult && currentResult ? (
                <WealthBlockResult
                  result={currentResult}
                  onRetake={handleRetake}
                  onSave={user ? handleSave : undefined}
                  isSaving={isSaving}
                  isSaved={isSaved}
                />
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
    </div>
  );
}

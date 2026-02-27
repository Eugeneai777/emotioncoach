import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, History, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommAssessmentStartScreen } from "@/components/communication-assessment/CommAssessmentStartScreen";
import { CommAssessmentQuestions } from "@/components/communication-assessment/CommAssessmentQuestions";
import { CommAssessmentResult } from "@/components/communication-assessment/CommAssessmentResult";
import { CommAssessmentHistory, CommHistoryRecord } from "@/components/communication-assessment/CommAssessmentHistory";
import { CommAssessmentTrend } from "@/components/communication-assessment/CommAssessmentTrend";
import { CommAssessmentVoiceCoach } from "@/components/communication-assessment/CommAssessmentVoiceCoach";
import {
  calculateResult,
  type Perspective,
  type CommAssessmentResult as ResultType,
} from "@/components/communication-assessment/communicationAssessmentData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Phase = 'start' | 'questions' | 'result';

export default function CommunicationAssessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("assessment");
  const [phase, setPhase] = useState<Phase>('start');
  const [perspective, setPerspective] = useState<Perspective>('parent');
  const [result, setResult] = useState<ResultType | null>(null);

  // History
  const [historyRecords, setHistoryRecords] = useState<CommHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load history when user changes or tab switches
  useEffect(() => {
    if (user && activeTab === 'history') {
      loadHistory();
    }
  }, [user, activeTab]);

  const loadHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('communication_pattern_assessments')
        .select('id, perspective, primary_pattern, secondary_pattern, listening_score, empathy_score, boundary_score, expression_score, conflict_score, understanding_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setHistoryRecords(data as any as CommHistoryRecord[]);
      }
    } catch (e) {
      console.error('Load history error:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleStart = (p: Perspective) => {
    setPerspective(p);
    setPhase('questions');
  };

  const handleComplete = (answers: Record<number, number>) => {
    const r = calculateResult(answers, perspective);
    setResult(r);
    setPhase('result');
  };

  const handleRetake = () => {
    setResult(null);
    setPhase('start');
    setActiveTab('assessment');
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('communication_pattern_assessments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setHistoryRecords(prev => prev.filter(r => r.id !== id));
      toast.success('记录已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="assessment" className="mt-0">
          <motion.div
            initial={{ opacity: 0.01, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          >
            {phase === 'questions' ? (
              <CommAssessmentQuestions
                perspective={perspective}
                onComplete={handleComplete}
                onBack={() => setPhase('start')}
              />
            ) : phase === 'result' && result ? (
              <CommAssessmentResult
                result={result}
                onBack={() => setPhase('start')}
                onRetake={handleRetake}
              />
            ) : (
              <CommAssessmentStartScreen
                onStart={handleStart}
                onBack={() => navigate(-1)}
              />
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <motion.div
            initial={{ opacity: 0.01, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="p-4 pb-32"
          >
            {!user ? (
              <div className="text-center py-12 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-sky-500" />
                </div>
                <h3 className="font-semibold mb-2">登录后查看历史记录</h3>
                <p className="text-sm text-muted-foreground mb-4">登录后可以保存测评结果并查看历史趋势</p>
                <Button onClick={() => navigate("/auth")}>去登录</Button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <CommAssessmentTrend records={historyRecords} />
                <CommAssessmentHistory
                  records={historyRecords}
                  isLoading={isLoadingHistory}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* 底部固定导航栏 */}
        <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-t border-gray-100 shadow-[0_-2px_20px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
          <div className="container max-w-sm sm:max-w-lg mx-auto px-1 relative">
            <TabsList className="hidden">
              <TabsTrigger value="assessment">测评</TabsTrigger>
              <TabsTrigger value="history">历史</TabsTrigger>
            </TabsList>

            <div className="flex items-end justify-around pt-0.5 pb-1">
              {/* 左 - 重新测评 */}
              <button
                onClick={handleRetake}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 min-w-[72px]
                  ${activeTab === "assessment" && phase !== 'result'
                    ? "text-sky-600" 
                    : "text-gray-400 hover:text-gray-600"}`}
              >
                <RotateCcw className={`w-[18px] h-[18px] transition-all duration-200 ${activeTab === "assessment" && phase !== 'result' ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                <span className={`text-[10px] leading-tight tracking-wide ${activeTab === "assessment" && phase !== 'result' ? "font-bold" : "font-medium"}`}>重新测评</span>
              </button>

              {/* 中 - 语音教练 FAB（仅结果页显示） */}
              {phase === 'result' && result && (
                <div className="relative -top-5 flex flex-col items-center">
                  <CommAssessmentVoiceCoach result={result} />
                </div>
              )}

              {/* 右 - 历史记录 */}
              <button
                onClick={() => setActiveTab("history")}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 min-w-[72px]
                  ${activeTab === "history" 
                    ? "text-sky-600" 
                    : "text-gray-400 hover:text-gray-600"}`}
              >
                <History className={`w-[18px] h-[18px] transition-all duration-200 ${activeTab === "history" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                <span className={`text-[10px] leading-tight tracking-wide ${activeTab === "history" ? "font-bold" : "font-medium"}`}>历史记录</span>
              </button>
            </div>
          </div>
        </div>
      </Tabs>
    </main>
  );
}

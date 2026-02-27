import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CommAssessmentStartScreen } from "@/components/communication-assessment/CommAssessmentStartScreen";
import { CommAssessmentQuestions } from "@/components/communication-assessment/CommAssessmentQuestions";
import { CommAssessmentResult } from "@/components/communication-assessment/CommAssessmentResult";
import { CommAssessmentHistory, type CommHistoryRecord } from "@/components/communication-assessment/CommAssessmentHistory";
import {
  calculateResult,
  dimensions,
  type Perspective,
  type CommAssessmentResult as ResultType,
  type PatternType,
} from "@/components/communication-assessment/communicationAssessmentData";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RotateCcw, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Phase = 'start' | 'questions' | 'result';
type ActiveTab = 'assessment' | 'history';

export default function CommunicationAssessment() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('start');
  const [perspective, setPerspective] = useState<Perspective>('parent');
  const [result, setResult] = useState<ResultType | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('assessment');
  const [historyRecords, setHistoryRecords] = useState<CommHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('communication_pattern_assessments')
        .select('id, perspective, listening_score, empathy_score, boundary_score, expression_score, conflict_score, understanding_score, primary_pattern, secondary_pattern, invite_code, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setHistoryRecords(data as CommHistoryRecord[]);
      }
    } catch (e) {
      console.error('Load history error:', e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleStart = (p: Perspective) => {
    setPerspective(p);
    setPhase('questions');
    setActiveTab('assessment');
  };

  const handleComplete = (answers: Record<number, number>) => {
    const r = calculateResult(answers, perspective);
    setResult(r);
    setPhase('result');
    setIsHistoryView(false);
  };

  const handleBack = () => {
    if (phase === 'questions') setPhase('start');
    else if (phase === 'result') setPhase('start');
    else navigate(-1);
  };

  const handleStartCoach = () => {
    navigate('/parent-coach');
  };

  const handleRetake = () => {
    setResult(null);
    setPhase('start');
    setActiveTab('assessment');
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('communication_pattern_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHistoryRecords(prev => prev.filter(r => r.id !== id));
      toast.success('记录已删除');
    } catch (e) {
      toast.error('删除失败，请重试');
    }
  };

  const handleViewDetail = (record: CommHistoryRecord) => {
    // Reconstruct result from history record
    const dimScores = dimensions.map(d => ({
      key: d.key,
      label: d.label,
      emoji: d.emoji,
      score: (record as any)[`${d.key}_score`] as number,
      maxScore: d.maxScore,
      percentage: Math.round(((record as any)[`${d.key}_score`] as number) / d.maxScore * 100),
    }));

    const totalScore = dimScores.reduce((sum, d) => sum + d.score, 0);

    const reconstructed: ResultType = {
      dimensionScores: dimScores,
      totalScore,
      maxTotalScore: 72,
      primaryPattern: (record.primary_pattern || 'democratic') as PatternType,
      secondaryPattern: record.secondary_pattern as PatternType | null,
      perspective: record.perspective as Perspective,
    };

    setResult(reconstructed);
    setPhase('result');
    setActiveTab('assessment');
    setIsHistoryView(true);
  };

  const handleResultSaved = () => {
    loadHistory();
  };

  // Questions phase - full screen, no bottom nav
  if (phase === 'questions') {
    return (
      <CommAssessmentQuestions
        perspective={perspective}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="flex-1 flex flex-col">
        <TabsContent value="assessment" className="flex-1 m-0">
          {phase === 'result' && result ? (
            <CommAssessmentResult
              result={result}
              onBack={handleBack}
              onStartCoach={handleStartCoach}
              onRetake={handleRetake}
              onSaved={handleResultSaved}
              isHistoryView={isHistoryView}
            />
          ) : (
            <CommAssessmentStartScreen
              onStart={handleStart}
              onBack={() => navigate(-1)}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0">
          <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-sky-50 to-indigo-50 p-4 pb-24">
            <div className="max-w-md mx-auto">
              <h2 className="text-lg font-bold mb-4">📋 测评历史记录</h2>
              <CommAssessmentHistory
                records={historyRecords}
                isLoading={historyLoading}
                onDelete={handleDeleteRecord}
                onViewDetail={handleViewDetail}
              />
            </div>
          </div>
        </TabsContent>

        {/* Bottom navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50">
          <div className="max-w-md mx-auto flex">
            <button
              onClick={handleRetake}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                activeTab === 'assessment' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              <span>重新测评</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                activeTab === 'history' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <History className="w-5 h-5" />
              <span>历史记录</span>
            </button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

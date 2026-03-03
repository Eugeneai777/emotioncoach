import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, ChevronRight, Eye, AlertTriangle, Footprints, Zap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import confetti from "canvas-confetti";
import type { MidlifePersonalityType, MidlifeDimensionScore } from "./midlifeAwakeningData";

export interface MidlifeAIAnalysisData {
  coreInsight: string;
  painPoint: string;
  blindSpot: string;
  breakthrough: string[];
  microAction: string;
  coachInvite: string;
  recommendedActivity: string;
  userTags: string[];
}

interface MidlifeAIAnalysisProps {
  analysis: MidlifeAIAnalysisData | null;
  isLoading: boolean;
  error: string | null;
  personalityType: MidlifePersonalityType;
  dimensions?: MidlifeDimensionScore[];
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Card>
      <Card>
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Card>
    </div>
  );
}

export function MidlifeAIAnalysis({ analysis, isLoading, error, personalityType, dimensions }: MidlifeAIAnalysisProps) {
  const navigate = useNavigate();
  const [microActionDone, setMicroActionDone] = useState(false);

  const handleMicroActionToggle = useCallback(() => {
    const next = !microActionDone;
    setMicroActionDone(next);
    if (next) {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#f97316', '#eab308'],
      });
    }
  }, [microActionDone]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
          <span>AI 正在为你生成深度洞察...</span>
        </div>
        <AnalysisSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>AI 分析暂时不可用：{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const handleStartCoach = () => {
    navigate('/assessment-coach', {
      state: {
        pattern: personalityType,
        blockedDimension: personalityType,
        fromAssessment: 'midlife_awakening',
        personalityType,
        dimensions,
        aiAnalysis: analysis,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* "看见你" 卡片 */}
      <Card className="overflow-hidden border-amber-200 dark:border-amber-800 shadow-[0_0_15px_-3px_hsl(38,92%,50%,0.15)]">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">看见你</h3>
          </div>
          <p className="text-sm leading-relaxed">{analysis.coreInsight}</p>
          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-3 border-l-3 border-amber-400">
            <p className="text-sm font-medium italic">"{analysis.painPoint}"</p>
          </div>
        </div>
      </Card>

      {/* 盲点提醒 */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold">盲点提醒</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.blindSpot}</p>
        </CardContent>
      </Card>

      {/* 突破路径 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">突破路径</h3>
          </div>
          <div className="relative">
            {analysis.breakthrough.map((step, i) => (
              <div key={i} className="flex items-start gap-3 relative">
                {i < analysis.breakthrough.length - 1 && (
                  <div className="absolute left-3 top-7 w-px h-[calc(100%-4px)] border-l-2 border-dashed border-primary/20" />
                )}
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5 z-10">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed pb-3">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 今日微行动 */}
      <Card className={cn("transition-all", microActionDone && "opacity-70")}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={handleMicroActionToggle}
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5 transition-colors",
                microActionDone
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/30 hover:border-primary"
              )}
            >
              {microActionDone && (
                <svg className="w-full h-full text-primary-foreground" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">今日微行动（2分钟）</span>
              </div>
              <p className={cn("text-sm", microActionDone && "line-through")}>{analysis.microAction}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 深聊邀请 */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm leading-relaxed">{analysis.coachInvite}</p>
          <Button
            onClick={handleStartCoach}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            和 AI 觉醒教练深聊
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

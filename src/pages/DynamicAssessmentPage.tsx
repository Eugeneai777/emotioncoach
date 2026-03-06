import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAssessmentTemplate, useSaveAssessmentResult } from "@/hooks/usePartnerAssessments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Phase = "intro" | "questions" | "result";

export default function DynamicAssessmentPage() {
  const { assessmentKey } = useParams<{ assessmentKey: string }>();
  const { data: template, isLoading } = useAssessmentTemplate(assessmentKey || "");
  const { user } = useAuth();
  const saveResult = useSaveAssessmentResult();

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">测评不存在或已下线</p>
      </div>
    );
  }

  const questions = template.questions || [];
  const dimensions = template.dimensions || [];
  const patterns = template.result_patterns || [];

  const handleAnswer = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
    if (questionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQ(questionIndex + 1), 200);
    }
  };

  const calculateResult = () => {
    // Calculate dimension scores
    const dimScores: Record<string, { score: number; maxScore: number; label: string; emoji: string }> = {};
    dimensions.forEach((d: any) => {
      dimScores[d.key] = { score: 0, maxScore: d.maxScore || 0, label: d.label, emoji: d.emoji };
    });

    questions.forEach((q: any, i: number) => {
      const ans = answers[i];
      if (ans !== undefined && dimScores[q.dimension]) {
        dimScores[q.dimension].score += ans;
      }
    });

    const totalScore = Object.values(dimScores).reduce((s, d) => s + d.score, 0);
    const maxScore = Object.values(dimScores).reduce((s, d) => s + d.maxScore, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Find matching pattern
    let matchedPattern = patterns[0];
    for (const p of patterns) {
      if (p.scoreRange && percentage >= p.scoreRange.min && percentage <= p.scoreRange.max) {
        matchedPattern = p;
        break;
      }
    }

    const dimensionScoresArray = Object.values(dimScores);

    const resultData = {
      totalScore,
      maxScore,
      percentage,
      dimensionScores: dimensionScoresArray,
      primaryPattern: matchedPattern,
    };

    setResult(resultData);
    setPhase("result");

    // Save result
    if (user) {
      saveResult.mutate({
        user_id: user.id,
        template_id: template.id,
        answers,
        dimension_scores: dimensionScoresArray,
        total_score: totalScore,
        primary_pattern: matchedPattern?.label || "",
      });
    }

    // Generate AI insight
    generateInsight(dimensionScoresArray, matchedPattern, totalScore, maxScore);
  };

  const generateInsight = async (dimScores: any[], pattern: any, totalScore: number, maxScore: number) => {
    setLoadingInsight(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-partner-assessment-insight", {
        body: {
          dimensionScores: dimScores,
          primaryPattern: pattern?.label,
          totalScore,
          maxScore,
          aiInsightPrompt: template.ai_insight_prompt,
          title: template.title,
        },
      });
      if (error) throw error;
      setAiInsight(data.insight);
    } catch (e) {
      console.error("Insight error:", e);
    } finally {
      setLoadingInsight(false);
    }
  };

  const allAnswered = Object.keys(answers).length === questions.length;
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

  // === INTRO ===
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background">
        <div className={`bg-gradient-to-br ${template.gradient} p-8 text-white text-center`}>
          <div className="text-5xl mb-4">{template.emoji}</div>
          <h1 className="text-2xl font-bold mb-2">{template.title}</h1>
          <p className="text-white/80">{template.subtitle}</p>
        </div>
        <div className="max-w-lg mx-auto p-6 space-y-6">
          <p className="text-muted-foreground text-center">{template.description}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>📝 {template.question_count} 题</span>
            <span>⏱️ 约 {Math.ceil(template.question_count / 5)} 分钟</span>
          </div>
          {dimensions.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {dimensions.map((d: any) => (
                <Badge key={d.key} variant="outline" className="justify-center py-1.5">
                  {d.emoji} {d.label}
                </Badge>
              ))}
            </div>
          )}
          <Button onClick={() => setPhase("questions")} className="w-full gap-2" size="lg">
            开始测评 <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // === QUESTIONS ===
  if (phase === "questions") {
    const q = questions[currentQ];
    if (!q) return null;

    return (
      <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{currentQ + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-lg font-medium leading-relaxed">{q.text}</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {(q.options || []).map((opt: any, oi: number) => (
            <Button
              key={oi}
              variant={answers[currentQ] === opt.score ? "default" : "outline"}
              className="w-full justify-start text-left h-auto py-3 px-4"
              onClick={() => handleAnswer(currentQ, opt.score)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 上一题
          </Button>
          {allAnswered && (
            <Button onClick={calculateResult} className="gap-2">
              查看结果 <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // === RESULT ===
  if (phase === "result" && result) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{result.primaryPattern?.emoji || template.emoji}</div>
          <h2 className="text-xl font-bold mb-1">{result.primaryPattern?.label || "测评结果"}</h2>
          <p className="text-muted-foreground">{result.primaryPattern?.description}</p>
          <div className="mt-3">
            <Badge variant="outline" className="text-lg px-4 py-1">
              {result.totalScore} / {result.maxScore} 分
            </Badge>
          </div>
        </div>

        {/* Dimension Scores */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">维度得分</h3>
            {result.dimensionScores.map((d: any) => (
              <div key={d.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{d.emoji} {d.label}</span>
                  <span className="text-muted-foreground">{d.score}/{d.maxScore}</span>
                </div>
                <Progress value={d.maxScore > 0 ? (d.score / d.maxScore) * 100 : 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Traits */}
        {result.primaryPattern?.traits?.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">你的特征</h3>
              <ul className="space-y-1">
                {result.primaryPattern.traits.map((t: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {result.primaryPattern?.tips?.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">改善建议</h3>
              <ul className="space-y-1">
                {result.primaryPattern.tips.map((t: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">💡</span> {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* AI Insight */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">🤖 AI 个性化建议</h3>
            {loadingInsight ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> 正在生成...
              </div>
            ) : aiInsight ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{aiInsight}</p>
            ) : (
              <p className="text-sm text-muted-foreground">暂无</p>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            setPhase("intro");
            setCurrentQ(0);
            setAnswers({});
            setResult(null);
            setAiInsight(null);
          }}
        >
          <RotateCcw className="w-4 h-4" /> 重新测评
        </Button>
      </div>
    );
  }

  return null;
}

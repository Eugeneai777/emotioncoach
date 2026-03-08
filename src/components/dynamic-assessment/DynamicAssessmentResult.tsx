import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, RotateCcw, History, Mic, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DynamicAssessmentQRCard } from "./DynamicAssessmentQRCard";

interface DimensionScore {
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
}

interface ResultData {
  totalScore: number;
  maxScore: number;
  percentage: number;
  dimensionScores: DimensionScore[];
  primaryPattern: any;
}

interface CampInfo {
  id: string;
  camp_name: string;
  camp_type: string;
  icon: string | null;
  duration_days: number;
  price: number;
}

interface DynamicAssessmentResultProps {
  result: ResultData;
  template: {
    emoji: string;
    title: string;
    qr_image_url?: string | null;
    qr_title?: string | null;
    coach_prompt?: string | null;
    assessment_key: string;
  };
  aiInsight: string | null;
  loadingInsight: boolean;
  onRetake: () => void;
  onShowHistory?: () => void;
  hasHistory?: boolean;
  recommendedCampTypes?: string[];
}

export function DynamicAssessmentResult({
  result,
  template,
  aiInsight,
  loadingInsight,
  onRetake,
  onShowHistory,
  hasHistory,
  recommendedCampTypes,
}: DynamicAssessmentResultProps) {
  const navigate = useNavigate();
  const [recommendedCamps, setRecommendedCamps] = useState<CampInfo[]>([]);

  useEffect(() => {
    if (!recommendedCampTypes?.length) return;
    const fetchCamps = async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('id, camp_name, camp_type, icon, duration_days, price')
        .in('camp_type', recommendedCampTypes)
        .eq('is_active', true);
      if (data) setRecommendedCamps(data);
    };
    fetchCamps();
  }, [recommendedCampTypes]);

  const handleAICoach = () => {
    navigate("/assessment-coach", {
      state: {
        fromAssessment: template.assessment_key,
        assessmentData: {
          title: template.title,
          dimensionScores: result.dimensionScores,
          primaryPattern: result.primaryPattern?.label,
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          aiInsight,
          coachPrompt: template.coach_prompt,
        },
        autoStartVoice: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto pb-24">
      {/* Score Header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">{result.primaryPattern?.emoji || template.emoji}</div>
        <h2 className="text-xl font-bold mb-1">{result.primaryPattern?.label || "测评结果"}</h2>
        {result.primaryPattern?.description && (
          <p className="text-muted-foreground text-sm">{result.primaryPattern.description}</p>
        )}
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
          {result.dimensionScores.map((d) => (
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
      <Card className="mb-4">
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

      {/* AI Coach Button */}
      {template.coach_prompt && (
        <Button
          onClick={handleAICoach}
          className="w-full mb-4 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
        >
          <Mic className="w-4 h-4" /> AI 教练深度解读
        </Button>
      )}

      {/* Recommended Training Camps */}
      {recommendedCamps.length > 0 && (
        <div className="space-y-2 mb-4">
          <h3 className="font-semibold text-sm px-1">🏕️ 推荐训练营</h3>
          {recommendedCamps.map((camp) => (
            <div
              key={camp.id}
              className="bg-card rounded-xl p-4 border border-border/30 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate('/training-camps')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl">{camp.icon || '🏕️'}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{camp.camp_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {camp.duration_days}天系统训练 · {camp.price === 0 ? '免费参加' : `¥${camp.price}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Card */}
      <DynamicAssessmentQRCard
        qrImageUrl={template.qr_image_url}
        qrTitle={template.qr_title}
      />

      {/* Action Buttons */}
      <div className="space-y-3 mt-4">
        {hasHistory && onShowHistory && (
          <Button variant="outline" className="w-full gap-2" onClick={onShowHistory}>
            <History className="w-4 h-4" /> 查看历史记录
          </Button>
        )}
        <Button variant="outline" className="w-full gap-2" onClick={onRetake}>
          <RotateCcw className="w-4 h-4" /> 重新测评
        </Button>
      </div>
    </div>
  );
}

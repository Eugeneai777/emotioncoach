import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, RotateCcw, History, Mic, ArrowRight, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { DynamicAssessmentQRCard } from "./DynamicAssessmentQRCard";
import { DimensionRadarChart } from "./DimensionRadarChart";

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
    coach_type?: string | null;
    assessment_key: string;
  };
  aiInsight: string | null;
  loadingInsight: boolean;
  onRetake: () => void;
  onShowHistory?: () => void;
  hasHistory?: boolean;
  recommendedCampTypes?: string[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

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
  const [coachRoute, setCoachRoute] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  // Fetch coach route
  useEffect(() => {
    if (!template.coach_type) return;
    const fetchRoute = async () => {
      const { data } = await supabase
        .from('coach_templates')
        .select('page_route')
        .eq('coach_key', template.coach_type!)
        .eq('is_active', true)
        .single();
      if (data) setCoachRoute(data.page_route);
    };
    fetchRoute();
  }, [template.coach_type]);

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
    const targetRoute = coachRoute || "/assessment-coach";
    navigate(targetRoute, {
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

  const handleShare = async () => {
    setSharing(true);
    try {
      const shareData = {
        title: `${template.emoji} ${template.title} - 我的测评结果`,
        text: `我在「${template.title}」中获得 ${result.totalScore}/${result.maxScore} 分，类型：${result.primaryPattern?.label || ""}`,
        url: window.location.href,
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        const { toast } = await import("sonner");
        toast.success("已复制分享内容");
      }
    } catch {
      // user cancelled
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto pb-24">
      {/* Score Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-5xl mb-3">{result.primaryPattern?.emoji || template.emoji}</div>
        <h2 className="text-xl font-bold mb-1">{result.primaryPattern?.label || "测评结果"}</h2>
        {result.primaryPattern?.description && (
          <p className="text-muted-foreground text-sm">{result.primaryPattern.description}</p>
        )}
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-1">
            {result.totalScore} / {result.maxScore} 分
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleShare}
            disabled={sharing}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Radar Chart */}
      {result.dimensionScores.length >= 3 && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="mb-4">
            <CardContent className="p-4 pt-2">
              <h3 className="font-semibold text-sm mb-1">能力雷达</h3>
              <DimensionRadarChart dimensionScores={result.dimensionScores} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dimension Scores */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
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
      </motion.div>

      {/* Traits */}
      {result.primaryPattern?.traits?.length > 0 && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
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
        </motion.div>
      )}

      {/* Tips */}
      {result.primaryPattern?.tips?.length > 0 && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
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
        </motion.div>
      )}

      {/* AI Insight */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
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
      </motion.div>

      {/* AI Coach Button */}
      {(template.coach_prompt || template.coach_type) && (
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <Button
            onClick={handleAICoach}
            className="w-full mb-4 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
          >
            <Mic className="w-4 h-4" /> AI 教练深度解读
          </Button>
        </motion.div>
      )}

      {/* Recommended Training Camps */}
      {recommendedCamps.length > 0 && (
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="space-y-2 mb-4">
          <h3 className="font-semibold text-sm px-1">🏕️ 推荐训练营</h3>
          {recommendedCamps.map((camp) => (
            <div
              key={camp.id}
              className="bg-card rounded-xl p-4 border border-border/30 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
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
        </motion.div>
      )}

      {/* QR Card */}
      <DynamicAssessmentQRCard
        qrImageUrl={template.qr_image_url}
        qrTitle={template.qr_title}
      />

      {/* Action Buttons */}
      <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3 mt-4">
        {hasHistory && onShowHistory && (
          <Button variant="outline" className="w-full gap-2" onClick={onShowHistory}>
            <History className="w-4 h-4" /> 查看历史记录
          </Button>
        )}
        <Button variant="outline" className="w-full gap-2" onClick={onRetake}>
          <RotateCcw className="w-4 h-4" /> 重新测评
        </Button>
      </motion.div>
    </div>
  );
}

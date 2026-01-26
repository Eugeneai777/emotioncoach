import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Share2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import { SCL90Result as SCL90ResultType, scl90FactorInfo, SCL90Factor } from "./scl90Data";
import { SCL90SeverityGauge } from "./SCL90SeverityGauge";
import { SCL90FactorRadar } from "./SCL90FactorRadar";
import { SCL90AIAnalysis, SCL90AIInsight } from "./SCL90AIAnalysis";
import { SCL90ShareDialog } from "./SCL90ShareDialog";

interface SCL90ResultProps {
  result: SCL90ResultType;
  answers: Record<number, number>;
  onRetake: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export function SCL90Result({
  result,
  answers,
  onRetake,
  onSave,
  isSaving,
  isSaved,
}: SCL90ResultProps) {
  const { user } = useAuth();
  const [aiInsight, setAiInsight] = useState<SCL90AIInsight | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Auto-save and fetch AI analysis
  useEffect(() => {
    const saveAndAnalyze = async () => {
      if (!user) return;

      // Save to database
      try {
        const { error: saveError } = await supabase
          .from('scl90_assessments')
          .insert({
            user_id: user.id,
            answers,
            somatization_score: result.factorScores.somatization,
            obsessive_score: result.factorScores.obsessive,
            interpersonal_score: result.factorScores.interpersonal,
            depression_score: result.factorScores.depression,
            anxiety_score: result.factorScores.anxiety,
            hostility_score: result.factorScores.hostility,
            phobic_score: result.factorScores.phobic,
            paranoid_score: result.factorScores.paranoid,
            psychoticism_score: result.factorScores.psychoticism,
            other_score: result.factorScores.other,
            total_score: result.totalScore,
            positive_count: result.positiveCount,
            positive_score_avg: result.positiveScoreAvg,
            gsi: result.gsi,
            severity_level: result.severityLevel,
            primary_symptom: result.primarySymptom,
            secondary_symptom: result.secondarySymptom,
          });

        if (saveError) {
          console.error('Save error:', saveError);
        } else {
          setHasSaved(true);
        }
      } catch (err) {
        console.error('Save error:', err);
      }

      // Fetch AI analysis
      setIsLoadingAI(true);
      setAiError(null);

      try {
        const { data, error } = await supabase.functions.invoke('analyze-scl90', {
          body: {
            factorScores: result.factorScores,
            totalScore: result.totalScore,
            positiveCount: result.positiveCount,
            positiveScoreAvg: result.positiveScoreAvg,
            gsi: result.gsi,
            severityLevel: result.severityLevel,
            primarySymptom: result.primarySymptom,
            secondarySymptom: result.secondarySymptom,
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setAiInsight(data);

        // Update AI analysis in database
        if (hasSaved) {
          await supabase
            .from('scl90_assessments')
            .update({ ai_analysis: data })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
        }
      } catch (err) {
        console.error('AI analysis error:', err);
        setAiError("AI分析暂时不可用，您仍可查看基础分析结果");
      } finally {
        setIsLoadingAI(false);
      }
    };

    saveAndAnalyze();
  }, [user, result, answers]);

  // Get high-score factors for highlight
  const highFactors = Object.entries(result.factorScores)
    .filter(([, score]) => score >= 2.0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const primaryInfo = result.primarySymptom 
    ? scl90FactorInfo[result.primarySymptom] 
    : null;

  return (
    <div className="space-y-4 pb-[calc(80px+env(safe-area-inset-bottom))]">
      {/* Severity Gauge */}
      <SCL90SeverityGauge
        gsi={result.gsi}
        totalScore={result.totalScore}
        positiveCount={result.positiveCount}
        positiveScoreAvg={result.positiveScoreAvg}
        severityLevel={result.severityLevel}
      />

      {/* Primary Symptom Highlight */}
      {primaryInfo && (
        <motion.div
          initial={{ opacity: 0.01, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ transform: "translateZ(0)" }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={cn("bg-gradient-to-br p-4 text-white", primaryInfo.color)}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{primaryInfo.emoji}</span>
                <div>
                  <p className="text-white/80 text-xs">主要突出因子</p>
                  <h3 className="text-lg font-bold">{primaryInfo.name}</h3>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-2xl font-bold">
                    {result.factorScores[result.primarySymptom!].toFixed(2)}
                  </span>
                  <p className="text-white/80 text-xs">因子均分</p>
                </div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                {primaryInfo.description}
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* High Score Factors Alert */}
      {highFactors.length > 0 && (
        <motion.div
          initial={{ opacity: 0.01, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ transform: "translateZ(0)" }}
        >
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                  需要关注的维度（≥2.0分）
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {highFactors.map(([key, score]) => {
                  const info = scl90FactorInfo[key as SCL90Factor];
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-full text-sm border border-orange-200 dark:border-orange-700"
                    >
                      <span>{info.emoji}</span>
                      <span className="font-medium">{info.name}</span>
                      <span className="text-orange-600 dark:text-orange-400 font-bold">
                        {(score as number).toFixed(2)}
                      </span>
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Factor Radar Chart */}
      <SCL90FactorRadar
        factorScores={result.factorScores}
        primarySymptom={result.primarySymptom}
        secondarySymptom={result.secondarySymptom}
      />

      {/* Divider */}
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* AI Analysis */}
      <SCL90AIAnalysis
        insight={aiInsight}
        isLoading={isLoadingAI}
        error={aiError}
        severityLevel={result.severityLevel}
      />

      {/* Training Camp Invite (from AI) */}
      {aiInsight?.campInvite && (
        <motion.div
          initial={{ opacity: 0.01, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ transform: "translateZ(0)" }}
        >
          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-lg">{aiInsight.campInvite.headline}</h3>
              </div>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">
                {aiInsight.campInvite.reason}
              </p>
              <div className="space-y-1.5 mb-4">
                {aiInsight.campInvite.expectedBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-white/80">✓</span>
                    <span className="text-white/95">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="secondary" 
                className="w-full h-11 font-medium"
                onClick={() => window.location.href = '/camps'}
              >
                {aiInsight.campInvite.urgency}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onRetake}
          className="flex-1 h-11"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重新测评
        </Button>
        <Button
          variant="outline"
          className="h-11 px-4"
          onClick={() => setShowShareDialog(true)}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Share Dialog */}
      <SCL90ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        result={result}
      />

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        ⚠️ 本测评仅供自我筛查参考，不能替代专业心理诊断
      </p>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, RefreshCw, Loader2, Share2, Shield, Eye, Heart, TrendingUp, CheckCircle2 } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  calculateDimensionScores,
  calculateSubDimensionScores,
  determineResultType,
  resultTypes,
  dimensionMeta,
  subDimensionLabels,
  type DimensionScore,
  type SubDimensionScore,
} from "./parentAbilityData";
import type { FollowUpAnswer } from "./ParentAbilityQuestions";

interface ParentAbilityResultProps {
  answers: Record<number, number>;
  followUpAnswers: FollowUpAnswer[];
  onRestart: () => void;
  /** If provided, we're viewing a saved record (skip saving) */
  savedRecord?: {
    ai_insight: any;
    total_score: number;
    total_max: number;
  } | null;
}

interface AIInsight {
  portrait: string;
  blindSpot: string;
  microAction: string;
  balanceComment: string;
}

function renderAIText(value: any): React.ReactNode {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if (value.title && Array.isArray(value.steps)) {
      return (
        <div>
          <p className="font-medium">{value.title}</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            {value.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      );
    }
    return JSON.stringify(value);
  }
  return String(value ?? '');
}

export function ParentAbilityResult({ answers, followUpAnswers, onRestart, savedRecord }: ParentAbilityResultProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(savedRecord?.ai_insight || null);
  const [loadingAI, setLoadingAI] = useState(!savedRecord?.ai_insight);
  const [saved, setSaved] = useState(!!savedRecord);
  const hasSaved = useRef(!!savedRecord);

  const dimScores = calculateDimensionScores(answers);
  const subDimScores = calculateSubDimensionScores(answers);
  const resultType = determineResultType(dimScores);
  const result = resultTypes[resultType];
  const totalScore = savedRecord?.total_score ?? dimScores.reduce((s, d) => s + d.score, 0);
  const totalMax = savedRecord?.total_max ?? dimScores.reduce((s, d) => s + d.maxScore, 0);
  const totalPercentage = Math.round((totalScore / totalMax) * 100);

  const radarData = dimScores.map(d => ({
    dimension: d.label,
    score: d.percentage,
    fullMark: 100,
  }));

  // Save to DB
  const saveResult = async (insight: AIInsight | null) => {
    if (!user || hasSaved.current) return;
    hasSaved.current = true;
    try {
      const stability = dimScores.find(d => d.dimension === 'stability')!;
      const insightDim = dimScores.find(d => d.dimension === 'insight')!;
      const repair = dimScores.find(d => d.dimension === 'repair')!;

      const { error } = await supabase.from('parent_ability_assessments' as any).insert({
        user_id: user.id,
        total_score: totalScore,
        total_max: totalMax,
        result_type: resultType,
        result_title: result.title,
        stability_score: stability.score,
        stability_max: stability.maxScore,
        insight_score: insightDim.score,
        insight_max: insightDim.maxScore,
        repair_score: repair.score,
        repair_max: repair.maxScore,
        sub_dimension_scores: subDimScores,
        answers,
        follow_up_answers: followUpAnswers,
        ai_insight: insight,
      } as any);

      if (error) {
        console.error('Save assessment error:', error);
        hasSaved.current = false; // Allow retry
        toast.error('保存记录失败，请稍后重试');
      } else {
        setSaved(true);
      }
    } catch (e) {
      console.error('Save failed:', e);
      hasSaved.current = false;
    }
  };

  useEffect(() => {
    if (savedRecord?.ai_insight) return;
    const fetchInsight = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-parent-ability-insight', {
          body: {
            dimensionScores: dimScores,
            subDimensionScores: subDimScores,
            resultType,
            resultTitle: result.title,
            followUpAnswers,
            totalScore,
            totalMax,
          },
        });
        if (error) throw error;
        setAiInsight(data);
        saveResult(data);
      } catch (e) {
        console.error('AI insight failed:', e);
        const fallback: AIInsight = {
          portrait: '你正在努力成为更好的父母，这本身就是最大的力量。',
          blindSpot: '建议关注自己最弱的维度，从一个小场景开始练习。',
          microAction: '本周尝试：在孩子发脾气时，先深呼吸3次再回应。',
          balanceComment: `你的三力分布为：${dimScores.map(d => `${d.label}${d.percentage}%`).join('，')}。`,
        };
        setAiInsight(fallback);
        saveResult(fallback);
      } finally {
        setLoadingAI(false);
      }
    };
    fetchInsight();
  }, []);

  const dimConfig = [
    { key: 'stability', color: '#10b981', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', Icon: Shield },
    { key: 'insight', color: '#0ea5e9', bgColor: 'bg-sky-50', textColor: 'text-sky-700', Icon: Eye },
    { key: 'repair', color: '#8b5cf6', bgColor: 'bg-violet-50', textColor: 'text-violet-700', Icon: Heart },
  ];

  // Find weakest sub-dimension
  const weakestSub = subDimScores.reduce((min, cur) =>
    (cur.score / cur.maxScore) < (min.score / min.maxScore) ? cur : min
  , subDimScores[0]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-white p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">

        {/* Header with score ring */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-4 space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-28 h-28" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={2 * Math.PI * 52}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - totalPercentage / 100) }}
                transition={{ duration: 1.2, delay: 0.3 }}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{totalPercentage}</span>
              <span className="text-xs text-muted-foreground">综合得分</span>
            </div>
          </div>
          <div className="text-4xl">{result.emoji}</div>
          <h1 className="text-xl font-bold text-foreground">{result.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed px-4">{result.description}</p>
        </motion.div>

        {/* Radar + dimension scores */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-emerald-200 bg-white/95 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-center mb-2 flex items-center justify-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />三力平衡图
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#d1d5db" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Dimension cards */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {dimScores.map((d, i) => {
                  const cfg = dimConfig[i];
                  return (
                    <div key={d.dimension} className={`rounded-xl p-2.5 ${cfg.bgColor} text-center`}>
                      <cfg.Icon className={`w-4 h-4 mx-auto mb-1 ${cfg.textColor}`} />
                      <p className="text-xs font-medium text-muted-foreground">{d.label}</p>
                      <p className={`text-lg font-bold ${cfg.textColor}`}>{d.percentage}%</p>
                      <p className="text-xs text-muted-foreground">{d.score}/{d.maxScore}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sub-dimension breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-emerald-200 bg-white/95 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />12项子维度详情
              </h3>
              <div className="space-y-2">
                {subDimScores.map((sub) => {
                  const pct = Math.round((sub.score / sub.maxScore) * 100);
                  const dimIdx = ['stability', 'insight', 'repair'].indexOf(sub.dimension);
                  const barColor = dimConfig[dimIdx]?.color || '#10b981';
                  const isWeakest = sub.subDimension === weakestSub.subDimension;
                  return (
                    <div key={sub.subDimension} className={`flex items-center gap-2 ${isWeakest ? 'bg-amber-50 rounded-lg px-2 py-1 -mx-2' : ''}`}>
                      {isWeakest && <span className="text-xs">⚠️</span>}
                      <span className="text-xs text-muted-foreground w-16 shrink-0">{sub.label}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.5, duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{sub.score}/{sub.maxScore}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insight */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-500" />
                <span className="font-semibold text-teal-700 text-sm">AI 深度解读</span>
              </div>
              {loadingAI ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI正在分析你的三力数据...
                </div>
              ) : aiInsight ? (
                <div className="space-y-3 text-sm leading-relaxed">
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium text-foreground mb-1">📝 你的家长情绪画像</p>
                    <div className="text-muted-foreground">{renderAIText(aiInsight.portrait)}</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium text-foreground mb-1">🔍 需要突破的盲区</p>
                    <div className="text-muted-foreground">{renderAIText(aiInsight.blindSpot)}</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium text-foreground mb-1">✅ 本周微行动</p>
                    <div className="text-muted-foreground">{renderAIText(aiInsight.microAction)}</div>
                  </div>
                  <div className="pt-2 border-t border-teal-200/60">
                    <p className="text-xs text-teal-600 italic">{renderAIText(aiInsight.balanceComment)}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        {/* Advice */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-emerald-200 bg-white/95 shadow-sm">
            <CardContent className="p-4">
              <p className="font-medium text-sm mb-2">💡 给你的建议</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.advice}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saved indicator */}
        {saved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <span className="text-xs text-emerald-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />报告已自动保存
            </span>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="space-y-3 pt-2">
          <Button
            onClick={() => navigate('/camp-intro/parent_emotion_21')}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-full shadow-lg"
          >
            加入21天训练营，系统提升三力
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onRestart} className="w-full rounded-full">
            <RefreshCw className="mr-2 h-4 w-4" />重新测评
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

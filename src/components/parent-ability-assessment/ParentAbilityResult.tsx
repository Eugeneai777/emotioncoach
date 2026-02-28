import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateDimensionScores,
  calculateSubDimensionScores,
  determineResultType,
  resultTypes,
  dimensionMeta,
  type DimensionScore,
} from "./parentAbilityData";
import type { FollowUpAnswer } from "./ParentAbilityQuestions";

interface ParentAbilityResultProps {
  answers: Record<number, number>;
  followUpAnswers: FollowUpAnswer[];
  onRestart: () => void;
}

interface AIInsight {
  portrait: string;
  blindSpot: string;
  microAction: string;
  balanceComment: string;
}

export function ParentAbilityResult({ answers, followUpAnswers, onRestart }: ParentAbilityResultProps) {
  const navigate = useNavigate();
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);

  const dimScores = calculateDimensionScores(answers);
  const subDimScores = calculateSubDimensionScores(answers);
  const resultType = determineResultType(dimScores);
  const result = resultTypes[resultType];
  const totalScore = dimScores.reduce((s, d) => s + d.score, 0);
  const totalMax = dimScores.reduce((s, d) => s + d.maxScore, 0);

  const radarData = dimScores.map(d => ({
    dimension: d.label,
    score: d.percentage,
    fullMark: 100,
  }));

  useEffect(() => {
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
      } catch (e) {
        console.error('AI insight failed:', e);
        setAiInsight({
          portrait: '你正在努力成为更好的父母，这本身就是最大的力量。',
          blindSpot: '建议关注自己最弱的维度，从一个小场景开始练习。',
          microAction: '本周尝试：在孩子发脾气时，先深呼吸3次再回应。',
          balanceComment: `你的三力分布为：${dimScores.map(d => `${d.label}${d.percentage}%`).join('，')}。`,
        });
      } finally {
        setLoadingAI(false);
      }
    };
    fetchInsight();
  }, []);

  const dimColorMap: Record<string, string> = {
    stability: '#10b981',
    insight: '#0ea5e9',
    repair: '#8b5cf6',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 p-4 pb-24">
      <div className="max-w-md mx-auto space-y-5">
        {/* 类型标题 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-6 space-y-2">
          <div className="text-5xl">{result.emoji}</div>
          <h1 className="text-2xl font-bold text-foreground">{result.title}</h1>
          <p className="text-sm text-muted-foreground">{result.description}</p>
          <div className="text-xs text-muted-foreground">综合得分 {totalScore}/{totalMax}</div>
        </motion.div>

        {/* 雷达图 */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-emerald-200 bg-white/90">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-center mb-2">三力平衡图</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      dataKey="score"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {/* 维度得分条 */}
              <div className="space-y-2 mt-3">
                {dimScores.map((d) => (
                  <div key={d.dimension} className="flex items-center gap-2">
                    <span className="text-xs w-20 text-right">{dimensionMeta[d.dimension].icon} {d.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.percentage}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: dimColorMap[d.dimension] }}
                      />
                    </div>
                    <span className="text-xs w-10 text-muted-foreground">{d.score}/{d.maxScore}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI 解读 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-500" />
                <span className="font-medium text-teal-700 text-sm">AI 深度解读</span>
              </div>
              {loadingAI ? (
                <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI正在分析你的三力数据...
                </div>
              ) : aiInsight ? (
                <div className="space-y-3 text-sm leading-relaxed">
                  <div>
                    <p className="font-medium text-foreground mb-1">📝 你的家长情绪画像</p>
                    <p className="text-muted-foreground">{typeof aiInsight.portrait === 'string' ? aiInsight.portrait : JSON.stringify(aiInsight.portrait)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">🔍 需要突破的盲区</p>
                    <p className="text-muted-foreground">{typeof aiInsight.blindSpot === 'string' ? aiInsight.blindSpot : JSON.stringify(aiInsight.blindSpot)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">✅ 本周微行动</p>
                    <div className="text-muted-foreground">
                      {typeof aiInsight.microAction === 'string' 
                        ? <p>{aiInsight.microAction}</p>
                        : aiInsight.microAction && typeof aiInsight.microAction === 'object'
                          ? <div>
                              {(aiInsight.microAction as any).title && <p className="font-medium">{(aiInsight.microAction as any).title}</p>}
                              {Array.isArray((aiInsight.microAction as any).steps) && (
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                  {(aiInsight.microAction as any).steps.map((step: string, i: number) => <li key={i}>{step}</li>)}
                                </ul>
                              )}
                            </div>
                          : <p>{JSON.stringify(aiInsight.microAction)}</p>
                      }
                    </div>
                  </div>
                  <div className="pt-2 border-t border-teal-200">
                    <p className="text-xs text-teal-600 italic">{typeof aiInsight.balanceComment === 'string' ? aiInsight.balanceComment : JSON.stringify(aiInsight.balanceComment)}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        {/* 建议 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-emerald-200 bg-white/90">
            <CardContent className="p-4">
              <p className="font-medium text-sm mb-2">💡 给你的建议</p>
              <p className="text-sm text-muted-foreground">{result.advice}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="space-y-3">
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

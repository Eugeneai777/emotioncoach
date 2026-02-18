import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CompetitivenessResult as ResultType,
  categoryInfo,
  levelInfo,
  FollowUpAnswer,
  CompetitivenessCategory,
} from "./competitivenessData";

interface CompetitivenessResultProps {
  result: ResultType;
  answers: Record<number, number>;
  followUpInsights?: FollowUpAnswer[];
  onBack?: () => void;
}

export function CompetitivenessResult({ result, answers, followUpInsights, onBack }: CompetitivenessResultProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(true);

  const level = levelInfo[result.level];
  const strongest = categoryInfo[result.strongestCategory];
  const weakest = categoryInfo[result.weakestCategory];

  const radarData = (Object.keys(categoryInfo) as CompetitivenessCategory[]).map(key => ({
    name: categoryInfo[key].name,
    value: result.categoryScores[key],
    fullMark: 100,
  }));

  useEffect(() => {
    const fetchAIAnalysis = async () => {
      setIsLoadingAI(true);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-competitiveness', {
          body: {
            totalScore: result.totalScore,
            level: result.level,
            categoryScores: result.categoryScores,
            strongestCategory: result.strongestCategory,
            weakestCategory: result.weakestCategory,
            followUpInsights,
          }
        });

        if (error) throw error;
        setAiAnalysis(data?.analysis || data?.error || "AI分析暂时不可用");
      } catch (err) {
        console.error('AI analysis error:', err);
        setAiAnalysis(null);
        toast.error("AI分析生成失败，但你的测评结果已保存");
      } finally {
        setIsLoadingAI(false);
      }
    };

    fetchAIAnalysis();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-purple-50 p-4 pb-safe">
      <div className="max-w-lg mx-auto space-y-4">
        {/* 返回 */}
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> 重新测评
          </Button>
        )}

        {/* 竞争力等级卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className={`border-0 bg-gradient-to-br ${level.gradient} text-white shadow-lg overflow-hidden`}>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">{level.emoji}</div>
              <h2 className="text-2xl font-bold mb-1">你的竞争力处于「{level.name}」</h2>
              <div className="text-5xl font-bold my-3">{result.totalScore}<span className="text-lg">分</span></div>
              <p className="text-sm opacity-90">{level.description}</p>
              <p className="text-xs mt-2 opacity-80 italic">"{level.encouragement}"</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 雷达图 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Card className="border-rose-200 bg-white/90">
            <CardContent className="p-4">
              <h3 className="font-bold text-center mb-2 text-rose-800">🎯 五维竞争力雷达图</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <defs>
                      <linearGradient id="competitivenessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#fda4af" strokeWidth={1} gridType="polygon" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Radar
                      name="竞争力"
                      dataKey="value"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fill="url(#competitivenessGradient)"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 各维度得分 */}
              <div className="space-y-2 mt-2">
                {(Object.keys(categoryInfo) as CompetitivenessCategory[]).map(key => {
                  const info = categoryInfo[key];
                  const score = result.categoryScores[key];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm">{info.emoji}</span>
                      <span className="text-sm w-20 text-foreground">{info.name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: info.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ delay: 0.3, duration: 0.8 }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{score}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 优势 & 短板 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="border-emerald-200 bg-emerald-50/80">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">{strongest.emoji}</div>
              <p className="text-xs text-muted-foreground">最强维度</p>
              <p className="font-bold text-emerald-700">{strongest.name}</p>
              <p className="text-lg font-bold text-emerald-600">{result.categoryScores[result.strongestCategory]}分</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/80">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">{weakest.emoji}</div>
              <p className="text-xs text-muted-foreground">最需突破</p>
              <p className="font-bold text-amber-700">{weakest.name}</p>
              <p className="text-lg font-bold text-amber-600">{result.categoryScores[result.weakestCategory]}分</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI 深度解读 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <Card className="border-purple-200 bg-white/90">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <h3 className="font-bold text-purple-800">AI 深度解读</h3>
              </div>
              {isLoadingAI ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">AI正在为你生成专属分析...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  AI分析暂时不可用，请稍后再试
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

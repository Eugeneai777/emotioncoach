import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CompetitivenessResult as ResultType,
  categoryInfo,
  levelInfo,
  FollowUpAnswer,
  CompetitivenessCategory,
  CompetitivenessLevel,
} from "./competitivenessData";

interface CompetitivenessResultProps {
  result: ResultType;
  answers: Record<number, number>;
  followUpInsights?: FollowUpAnswer[];
  onBack?: () => void;
  assessmentId?: string;
  preloadedAiAnalysis?: string | null;
}

// 分数标尺上的阶段配置
const scaleSegments: { key: CompetitivenessLevel; min: number; max: number }[] = [
  { key: "dormant", min: 0, max: 40 },
  { key: "awakening", min: 41, max: 60 },
  { key: "blooming", min: 61, max: 80 },
  { key: "leading", min: 81, max: 100 },
];

// 将 AI markdown 按 ## 标题拆分为段落
function splitMarkdownSections(md: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const parts = md.split(/^## /m).filter(Boolean);
  for (const part of parts) {
    const newlineIdx = part.indexOf("\n");
    if (newlineIdx === -1) {
      sections.push({ title: part.trim(), content: "" });
    } else {
      sections.push({
        title: part.slice(0, newlineIdx).trim(),
        content: part.slice(newlineIdx + 1).trim(),
      });
    }
  }
  return sections;
}

export function CompetitivenessResult({ result, answers, followUpInsights, onBack, assessmentId: existingId, preloadedAiAnalysis }: CompetitivenessResultProps) {
  const { user } = useAuth();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true });
  const [assessmentId, setAssessmentId] = useState<string | null>(existingId || null);

  const level = levelInfo[result.level];
  const strongest = categoryInfo[result.strongestCategory];
  const weakest = categoryInfo[result.weakestCategory];

  const radarData = (Object.keys(categoryInfo) as CompetitivenessCategory[]).map(key => ({
    name: categoryInfo[key].name,
    value: result.categoryScores[key],
    fullMark: 100,
  }));

  // 计算距离下一阶段的分数差
  const nextLevelInfo = useMemo(() => {
    if (!level.nextLevel) return null;
    const next = levelInfo[level.nextLevel];
    const seg = scaleSegments.find(s => s.key === level.nextLevel);
    const diff = seg ? seg.min - result.totalScore : 0;
    return { name: next.name, emoji: next.emoji, diff };
  }, [result.totalScore, level.nextLevel]);

  // AI 段落
  const aiSections = useMemo(() => {
    if (!aiAnalysis) return [];
    return splitMarkdownSections(aiAnalysis);
  }, [aiAnalysis]);

  // 保存测评结果到数据库
  useEffect(() => {
    if (!user || assessmentId) return;
    const saveAssessment = async () => {
      try {
        const { data, error } = await supabase
          .from('competitiveness_assessments' as any)
          .insert({
            user_id: user.id,
            total_score: result.totalScore,
            level: result.level,
            category_scores: result.categoryScores,
            strongest_category: result.strongestCategory,
            weakest_category: result.weakestCategory,
            answers,
            follow_up_insights: followUpInsights || null,
          })
          .select('id')
          .single();
        if (!error && data) {
          setAssessmentId((data as any).id);
        }
      } catch (err) {
        console.error('Save assessment error:', err);
      }
    };
    saveAssessment();
  }, [user]);

  useEffect(() => {
    if (preloadedAiAnalysis) {
      setAiAnalysis(preloadedAiAnalysis);
      setIsLoadingAI(false);
      return;
    }
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
        const analysis = data?.analysis || data?.error || "AI分析暂时不可用";
        setAiAnalysis(analysis);
        // 更新数据库中的AI分析
        if (assessmentId) {
          supabase
            .from('competitiveness_assessments' as any)
            .update({ ai_analysis: analysis })
            .eq('id', assessmentId)
            .then(() => {});
        }
      } catch (err) {
        console.error('AI analysis error:', err);
        setAiAnalysis(null);
        toast.error("AI分析生成失败，但你的测评结果已保存");
      } finally {
        setIsLoadingAI(false);
      }
    };
    fetchAIAnalysis();
  }, [preloadedAiAnalysis]);

  const toggleSection = (idx: number) => {
    setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-purple-50 pb-safe">
      <PageHeader title="竞争力报告" showBack={true} backTo={undefined} />
      <div className="max-w-lg mx-auto space-y-4 p-4">

        {/* 竞争力等级卡片 — 增强版 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className={`border-0 bg-gradient-to-br ${level.gradient} text-white shadow-lg overflow-hidden`}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl mb-2">{level.emoji}</div>
                <h2 className="text-2xl font-bold mb-1">你的竞争力处于「{level.name}」</h2>
                <div className="text-5xl font-bold my-3">{result.totalScore}<span className="text-lg">分</span></div>
                <p className="text-sm opacity-90">{level.description}</p>
              </div>

              {/* 分数段标尺 */}
              <div className="mt-5">
                <div className="flex rounded-full overflow-hidden h-3 bg-white/20">
                  {scaleSegments.map((seg) => {
                    const width = seg.max - seg.min + (seg.min === 0 ? 1 : 0);
                    return (
                      <div
                        key={seg.key}
                        className={`relative ${seg.key === result.level ? 'opacity-100' : 'opacity-40'}`}
                        style={{
                          width: `${width}%`,
                          backgroundColor: levelInfo[seg.key].color,
                        }}
                      />
                    );
                  })}
                </div>
                {/* 指示器 */}
                <div className="relative h-4 mt-1">
                  <div
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${result.totalScore}%` }}
                  >
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-white" />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] opacity-70 -mt-1">
                  <span>0</span><span>40</span><span>60</span><span>80</span><span>100</span>
                </div>
              </div>

              {/* 特征标签 */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {level.characteristics.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full bg-white/20 text-xs">{c}</span>
                ))}
              </div>

              {/* 下一阶段目标 */}
              {nextLevelInfo && (
                <div className="mt-4 bg-white/15 rounded-lg p-3 text-center text-sm">
                  <span className="opacity-80">距离</span>
                  <span className="font-bold mx-1">{nextLevelInfo.emoji} {nextLevelInfo.name}</span>
                  <span className="opacity-80">还差</span>
                  <span className="font-bold text-lg mx-1">{nextLevelInfo.diff}</span>
                  <span className="opacity-80">分</span>
                  <p className="text-xs opacity-70 mt-1">{level.nextLevelTip}</p>
                </div>
              )}

              <p className="text-xs mt-3 opacity-80 italic text-center">"{level.encouragement}"</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 四阶段全览 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <Card className="border-rose-200 bg-white/90">
            <CardContent className="p-4">
              <h3 className="font-bold text-center mb-3 text-rose-800">📊 竞争力阶段全览</h3>
              <div className="space-y-2">
                {(["dormant", "awakening", "blooming", "leading"] as CompetitivenessLevel[]).map(key => {
                  const info = levelInfo[key];
                  const isCurrent = key === result.level;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 rounded-lg p-2.5 transition-all ${
                        isCurrent ? 'ring-2 ring-offset-1 bg-gradient-to-r text-white shadow-sm' : 'bg-muted/50'
                      }`}
                      style={isCurrent ? {
                        backgroundImage: `linear-gradient(135deg, ${info.color}, ${info.color}dd)`,
                        boxShadow: `0 0 0 2px ${info.color}`,
                      } : undefined}
                    >
                      <span className="text-xl">{info.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isCurrent ? '' : 'text-foreground'}`}>{info.name}</span>
                          <span className={`text-xs ${isCurrent ? 'opacity-80' : 'text-muted-foreground'}`}>{info.scoreRange}</span>
                          {isCurrent && <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full">← 你在这里</span>}
                        </div>
                        <div className={`flex gap-1 mt-1 flex-wrap ${isCurrent ? '' : 'opacity-60'}`}>
                          {info.characteristics.map(c => (
                            <span key={c} className={`text-[10px] px-1.5 py-0.5 rounded ${isCurrent ? 'bg-white/20' : 'bg-muted'}`}>{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 优势 & 短板 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
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

        {/* 突破方向卡片 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-4">
              <h3 className="font-bold text-indigo-800 mb-3">🧭 你的突破方向</h3>
              <div className="space-y-3">
                {nextLevelInfo && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">🎯</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">你的目标</p>
                      <p className="text-xs text-muted-foreground">从{level.name}迈向{nextLevelInfo.emoji}{nextLevelInfo.name}，提升{nextLevelInfo.diff}分</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">🔓</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">核心突破点</p>
                    <p className="text-xs text-muted-foreground">重点提升「{weakest.name}」— {weakest.description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">💪</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">最大优势</p>
                    <p className="text-xs text-muted-foreground">你的「{strongest.name}」表现突出，{strongest.description}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 雷达图 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
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
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => [`${value}分`, '竞争力']} />
                    <Radar name="竞争力" dataKey="value" stroke="#f43f5e" strokeWidth={2} fill="url(#competitivenessGradient)" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
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

        {/* AI 深度解读 — 折叠分段 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
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
              ) : aiSections.length > 0 ? (
                <div className="space-y-2">
                  {aiSections.map((section, idx) => (
                    <Collapsible key={idx} open={openSections[idx] ?? false} onOpenChange={() => toggleSection(idx)}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-left">
                        <span className="font-medium text-sm text-purple-900">{section.title}</span>
                        <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${openSections[idx] ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2.5 pt-2 pb-1">
                        <div className="prose prose-sm max-w-none text-foreground">
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
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

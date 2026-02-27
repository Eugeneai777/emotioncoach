import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { ArrowLeft, Copy, Check, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type CommAssessmentResult as ResultType,
  type Perspective,
  patternConfigs,
  generateInviteCode,
} from "./communicationAssessmentData";

interface CommAssessmentResultProps {
  result: ResultType;
  onBack: () => void;
  onStartCoach?: () => void;
}

export function CommAssessmentResult({ result, onBack, onStartCoach }: CommAssessmentResultProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const primary = patternConfigs[result.primaryPattern];
  const secondary = result.secondaryPattern ? patternConfigs[result.secondaryPattern] : null;

  // 保存结果到数据库
  useEffect(() => {
    saveResult();
  }, []);

  const saveResult = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const code = generateInviteCode();
      const scores = Object.fromEntries(result.dimensionScores.map(d => [`${d.key}_score`, d.score]));

      const { data, error } = await supabase
        .from('communication_pattern_assessments')
        .insert({
          user_id: user.id,
          perspective: result.perspective,
          ...scores,
          primary_pattern: result.primaryPattern,
          secondary_pattern: result.secondaryPattern,
          answers: result.dimensionScores as any,
          invite_code: code,
        } as any)
        .select('id')
        .single();

      if (!error && data) {
        setSavedId((data as any).id);
        setInviteCode(code);
      }
    } catch (e) {
      console.error('Save result error:', e);
    }
  };

  // 获取AI建议
  const fetchAIInsight = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-comm-assessment-insight', {
        body: {
          dimensionScores: result.dimensionScores,
          primaryPattern: result.primaryPattern,
          secondaryPattern: result.secondaryPattern,
          perspective: result.perspective,
          totalScore: result.totalScore,
        },
      });
      if (error) throw error;
      setAiInsight(data?.insight || '暂时无法生成建议，请稍后再试。');
    } catch (e) {
      console.error('AI insight error:', e);
      setAiInsight('AI 建议生成失败，请稍后重试。');
    } finally {
      setAiLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success('邀请码已复制');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 雷达图数据
  const radarData = result.dimensionScores.map((d) => ({
    dimension: d.label,
    score: d.percentage,
    fullMark: 100,
  }));

  const overallPercentage = Math.round((result.totalScore / result.maxTotalScore) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 p-4 pb-24">
      {/* 顶部 */}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />返回
        </Button>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* 模式识别卡片 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-sky-200 bg-white/90 shadow-lg overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-sky-400 to-indigo-400" />
            <CardContent className="p-5">
              <div className="text-center mb-4">
                <span className="text-4xl">{primary.emoji}</span>
                <h2 className="text-lg font-bold mt-2">{primary.label}</h2>
                <p className="text-sm text-muted-foreground mt-1">{primary.description}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs">
                  综合得分 {overallPercentage}%
                </div>
              </div>

              {secondary && (
                <div className="mt-3 pt-3 border-t border-dashed border-sky-200">
                  <p className="text-xs text-muted-foreground text-center">
                    次要模式：<span className="font-medium">{secondary.emoji} {secondary.label}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 雷达图 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-sky-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-center mb-2">六维沟通能力雷达图</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                    <defs>
                      <linearGradient id="commRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#bae6fd" strokeWidth={1} gridType="polygon" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Radar name="得分" dataKey="score" stroke="#0ea5e9" strokeWidth={2} fill="url(#commRadarFill)" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 维度详解 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-sky-200 bg-white/90 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">维度详解</h3>
              {result.dimensionScores.map((d) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="text-base">{d.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-medium">{d.label}</span>
                      <span className="text-xs text-muted-foreground">{d.score}/{d.maxScore}</span>
                    </div>
                    <div className="h-1.5 bg-sky-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.percentage}%` }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* 改善建议 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-sky-200 bg-white/90 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <span>💡</span> 改善建议
              </h3>
              {primary.improveTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-sky-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI 个性化建议 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 shadow-sm">
            <CardContent className="p-4">
              {!aiInsight && !aiLoading ? (
                <Button
                  onClick={fetchAIInsight}
                  variant="outline"
                  className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Sparkles className="h-4 w-4 mr-2" />获取 AI 个性化建议
                </Button>
              ) : aiLoading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />正在生成个性化建议...
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" /> AI 个性化建议
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{aiInsight}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 邀请码 */}
        {inviteCode && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ transform: 'translateZ(0)' }}>
            <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-pink-50 shadow-sm">
              <CardContent className="p-4 text-center">
                <h3 className="text-sm font-semibold mb-2">
                  📨 邀请{result.perspective === 'parent' ? '孩子' : '家长'}也来测评
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  分享邀请码，完成双视角对比，发现你们之间的认知差异
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold tracking-widest text-violet-700 bg-violet-100 px-4 py-2 rounded-lg">
                    {inviteCode}
                  </span>
                  <Button variant="ghost" size="sm" onClick={copyInviteCode}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* CTA：亲子教练对话 */}
        {onStartCoach && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ transform: 'translateZ(0)' }}>
            <Button
              onClick={onStartCoach}
              className="w-full h-12 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-medium rounded-full shadow-lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />开始亲子教练对话
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

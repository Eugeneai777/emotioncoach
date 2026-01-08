import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Heart, Brain, Share2, MessageCircle, Sparkles, RotateCcw, Save, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import WealthInviteCardDialog from "@/components/wealth-camp/WealthInviteCardDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WechatPayDialog } from "@/components/WechatPayDialog";
import { useCampPurchase } from "@/hooks/useCampPurchase";
import { useQueryClient } from "@tanstack/react-query";
import { useWealthCampAnalytics } from "@/hooks/useWealthCampAnalytics";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { 
  AssessmentResult, 
  blockInfo, 
  patternInfo, 
  fourPoorInfo, 
  emotionBlockInfo, 
  beliefBlockInfo,
  FourPoorType,
  EmotionBlockType,
  BeliefBlockType,
  calculateHealthScore,
  FollowUpAnswer
} from "./wealthBlockData";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EnhancedHealthGauge } from "./EnhancedHealthGauge";
import { EnhancedFourPoorRadar } from "./EnhancedFourPoorRadar";
import { PriorityBreakthroughMap } from "./PriorityBreakthroughMap";
import { AIInsightCard, AIInsightData } from "./AIInsightCard";
import { LayerTransitionHint } from "./LayerTransitionHint";
import { CampConversionCard } from "./CampConversionCard";
import { DeepFollowUpAnswer } from "./DeepFollowUpDialog";

interface WealthBlockResultProps {
  result: AssessmentResult;
  followUpInsights?: FollowUpAnswer[];
  deepFollowUpAnswers?: DeepFollowUpAnswer[];
  onRetake: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export function WealthBlockResult({ result, followUpInsights, deepFollowUpAnswers, onRetake, onSave, isSaving, isSaved }: WealthBlockResultProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { trackEvent } = useWealthCampAnalytics();
  const pattern = patternInfo[result.reactionPattern];
  const dominantPoor = fourPoorInfo[result.dominantPoor];
  const dominantEmotion = emotionBlockInfo[result.dominantEmotionBlock];
  const dominantBelief = beliefBlockInfo[result.dominantBeliefBlock];

  // AI Insight state
  const [aiInsight, setAiInsight] = useState<AIInsightData | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // 直接购买训练营状态
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const { data: purchaseRecord, refetch: refetchPurchase } = useCampPurchase("wealth_block_21");
  const hasPurchased = !!purchaseRecord;

  const totalScore = result.behaviorScore + result.emotionScore + result.beliefScore;
  const healthScore = calculateHealthScore(totalScore);
  
  // 埋点：结果页访问
  useEffect(() => {
    trackEvent('assessment_result_viewed', {
      metadata: { health_score: healthScore, reaction_pattern: result.reactionPattern }
    });
  }, []);

  // Fetch AI insight on mount
  useEffect(() => {
    const fetchAIInsight = async () => {
      setIsLoadingAI(true);
      setAiError(null);

      try {
        const { data, error } = await supabase.functions.invoke('analyze-wealth-blocks', {
          body: {
            reactionPattern: result.reactionPattern,
            dominantPoor: result.dominantPoor,
            dominantEmotionBlock: result.dominantEmotionBlock,
            dominantBeliefBlock: result.dominantBeliefBlock,
            scores: {
              behavior: result.behaviorScore,
              emotion: result.emotionScore,
              belief: result.beliefScore,
              mouth: result.mouthScore,
              hand: result.handScore,
              eye: result.eyeScore,
              heart: result.heartScore,
              anxiety: result.anxietyScore,
              scarcity: result.scarcityScore,
              comparison: result.comparisonScore,
              shame: result.shameScore,
              guilt: result.guiltScore,
              lack: result.lackScore,
              linear: result.linearScore,
              stigma: result.stigmaScore,
              unworthy: result.unworthyScore,
              relationship: result.relationshipScore,
            },
            healthScore,
            // 传递追问洞察数据
            followUpInsights: followUpInsights?.map(f => ({
              questionId: f.questionId,
              questionText: f.questionText,
              selectedOption: f.selectedOption
            })),
            // 传递深度追问回答（用户原话）
            deepFollowUpAnswers: deepFollowUpAnswers?.map(a => ({
              question: a.question,
              answer: a.answer,
              targetBlock: a.targetBlock
            }))
          }
        });

        if (error) {
          throw error;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setAiInsight(data);
      } catch (err) {
        console.error('AI insight error:', err);
        setAiError("AI分析暂时不可用，您仍可查看基础分析结果");
      } finally {
        setIsLoadingAI(false);
      }
    };

    fetchAIInsight();
  }, [result, healthScore]);

  // 四穷雷达图数据
  const fourPoorRadarData = [
    { subject: '嘴穷', score: result.mouthScore, fullMark: 15 },
    { subject: '手穷', score: result.handScore, fullMark: 10 },
    { subject: '眼穷', score: result.eyeScore, fullMark: 15 },
    { subject: '心穷', score: result.heartScore, fullMark: 10 },
  ];

  // 情绪卡点雷达图数据
  const emotionRadarData = [
    { subject: '金钱焦虑', score: result.anxietyScore, fullMark: 10 },
    { subject: '匮乏恐惧', score: result.scarcityScore, fullMark: 10 },
    { subject: '比较自卑', score: result.comparisonScore, fullMark: 10 },
    { subject: '羞耻厌恶', score: result.shameScore, fullMark: 10 },
    { subject: '消费内疚', score: result.guiltScore, fullMark: 10 },
  ];

  // 信念卡点雷达图数据
  const beliefRadarData = [
    { subject: '匮乏感', score: result.lackScore, fullMark: 10 },
    { subject: '线性思维', score: result.linearScore, fullMark: 10 },
    { subject: '金钱污名', score: result.stigmaScore, fullMark: 10 },
    { subject: '不配得感', score: result.unworthyScore, fullMark: 10 },
    { subject: '关系恐惧', score: result.relationshipScore, fullMark: 10 },
  ];

  // 三层雷达图数据
  const layerRadarData = [
    { subject: '行为层', score: result.behaviorScore, fullMark: 50 },
    { subject: '情绪层', score: result.emotionScore, fullMark: 50 },
    { subject: '信念层', score: result.beliefScore, fullMark: 50 },
  ];

  const fourPoorColors: Record<FourPoorType, string> = {
    mouth: "#f97316",
    hand: "#10b981",
    eye: "#3b82f6",
    heart: "#f43f5e",
  };

  const emotionColors: Record<EmotionBlockType, string> = {
    anxiety: "#f97316",
    scarcity: "#6b7280",
    comparison: "#8b5cf6",
    shame: "#ec4899",
    guilt: "#14b8a6",
  };

  const beliefColors: Record<BeliefBlockType, string> = {
    lack: "#78716c",
    linear: "#2563eb",
    stigma: "#dc2626",
    unworthy: "#7c3aed",
    relationship: "#db2777",
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 健康度仪表盘 - 视觉冲击力升级 */}
      <EnhancedHealthGauge
        healthScore={healthScore}
        behaviorScore={result.behaviorScore}
        emotionScore={result.emotionScore}
        beliefScore={result.beliefScore}
      />

      {/* 财富反应模式结果卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className={cn("bg-gradient-to-br p-6 text-white", pattern.color)}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm text-4xl">
                {pattern.emoji}
              </div>
              <div>
                <p className="text-white/80 text-sm">🧭 你的财富反应模式</p>
                <h2 className="text-2xl font-bold">【{pattern.name}】</h2>
                <p className="text-white/90 text-sm mt-1">{pattern.tagline}</p>
              </div>
            </div>
            
            {/* 说明文字 */}
            <div className="p-3 bg-white/15 rounded-xl mb-4">
              <p className="text-white/95 text-sm leading-relaxed">
                📌 这不是性格，<br/>
                而是你在面对<span className="font-semibold">钱、机会、价格、收入</span>时的自动反应。
              </p>
            </div>
            
            {/* 你的状态 */}
            <div className="mb-4">
              <h4 className="text-white/90 text-sm font-semibold mb-2 flex items-center gap-2">
                💬 你的状态
              </h4>
              <ul className="space-y-1.5">
                {pattern.state.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-white/90 text-sm">
                    <span className="w-1.5 h-1.5 bg-white/70 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 专业解读 */}
            <div className="mb-4">
              <h4 className="text-white/90 text-sm font-semibold mb-2 flex items-center gap-2">
                🔍 专业解读
              </h4>
              <p className="text-white/90 text-sm leading-relaxed">
                {pattern.interpretation}
              </p>
            </div>
            
            {/* 系统建议 */}
            <div className="p-3 bg-white/20 rounded-xl">
              <h4 className="text-white text-sm font-semibold mb-1 flex items-center gap-2">
                💡 系统建议
              </h4>
              <p className="text-white/95 text-sm">{pattern.suggestion}</p>
              <p className="text-white/80 text-xs mt-1">训练营重点：{pattern.trainingFocus}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 三层深度分析标题 */}
      <div className="text-center py-2">
        <h3 className="text-lg font-bold text-foreground">📊 三层深度诊断</h3>
        <p className="text-sm text-muted-foreground">行为 → 情绪 → 信念，层层递进</p>
      </div>

      {/* 三层深度分析 - 手风琴 */}
      <Accordion type="multiple" defaultValue={["behavior"]} className="space-y-4">
        {/* 第一层：行为层分析 */}
        <AccordionItem value="behavior" className="border-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:rounded-b-none">
                <div className={cn("bg-gradient-to-br p-4 text-white w-full", blockInfo.behavior.color)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-white/80 text-xs">第一层</p>
                        <h3 className="text-lg font-bold">行为层分析（四穷模型）</h3>
                        <p className="text-white/90 text-xs">主导卡点：{dominantPoor.name}</p>
                      </div>
                    </div>
                    <div className="text-right mr-2">
                      <span className="text-2xl font-bold">{result.behaviorScore}</span>
                      <span className="text-white/80 text-sm">/50</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="p-5 space-y-5">
                  {/* 主导卡点卡片 */}
                  <div className={cn("bg-gradient-to-br p-4 text-white rounded-xl", dominantPoor.color)}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{dominantPoor.emoji}</span>
                      <div>
                        <h4 className="font-bold text-lg">{dominantPoor.name}</h4>
                        <p className="text-white/80 text-sm">{dominantPoor.description}</p>
                      </div>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed mb-3">{dominantPoor.detail}</p>
                    <div className="p-3 bg-white/20 rounded-lg">
                      <p className="text-sm font-medium">💡 突破方案：{dominantPoor.solution}</p>
                    </div>
                  </div>

                  {/* 雷达图和条形图 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={fourPoorRadarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 15]} tick={false} axisLine={false} />
                          <Radar dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: '嘴穷', score: result.mouthScore, key: 'mouth' as FourPoorType },
                            { name: '手穷', score: result.handScore, key: 'hand' as FourPoorType },
                            { name: '眼穷', score: result.eyeScore, key: 'eye' as FourPoorType },
                            { name: '心穷', score: result.heartScore, key: 'heart' as FourPoorType },
                          ]} 
                          layout="vertical"
                        >
                          <XAxis type="number" domain={[0, 15]} hide />
                          <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 11 }} />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {[
                              { key: 'mouth' as FourPoorType },
                              { key: 'hand' as FourPoorType },
                              { key: 'eye' as FourPoorType },
                              { key: 'heart' as FourPoorType },
                            ].map((entry) => (
                              <Cell key={entry.key} fill={fourPoorColors[entry.key]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 行动清单 */}
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h5 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      突破"{dominantPoor.name}"行动清单
                    </h5>
                    <ul className="space-y-2">
                      {dominantPoor.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                          <span className="flex-shrink-0 w-5 h-5 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </motion.div>
        </AccordionItem>

        {/* 层间递进提示 */}
        <LayerTransitionHint from="behavior" to="emotion" />

        {/* 第二层：情绪层分析 */}
        <AccordionItem value="emotion" className="border-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:rounded-b-none">
                <div className={cn("bg-gradient-to-br p-4 text-white w-full", blockInfo.emotion.color)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-white/80 text-xs">第二层</p>
                        <h3 className="text-lg font-bold">情绪层分析（5大情绪卡点）</h3>
                        <p className="text-white/90 text-xs">主导卡点：{dominantEmotion.name}</p>
                      </div>
                    </div>
                    <div className="text-right mr-2">
                      <span className="text-2xl font-bold">{result.emotionScore}</span>
                      <span className="text-white/80 text-sm">/50</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="p-5 space-y-5">
                  {/* 核心理念 */}
                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <p className="text-sm text-pink-800">
                      <span className="font-semibold">💡 核心洞见：</span>财富的本质是心理能量的流动。财富卡住=心理能量阻塞（如恐惧、匮乏、控制欲）
                    </p>
                  </div>

                  {/* 主导卡点卡片 */}
                  <div className={cn("bg-gradient-to-br p-4 text-white rounded-xl", dominantEmotion.color)}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{dominantEmotion.emoji}</span>
                      <div>
                        <h4 className="font-bold text-lg">{dominantEmotion.name}</h4>
                        <p className="text-white/80 text-sm">{dominantEmotion.description}</p>
                      </div>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed mb-3">{dominantEmotion.detail}</p>
                    <div className="p-3 bg-white/20 rounded-lg">
                      <p className="text-sm font-medium">💡 突破方案：{dominantEmotion.solution}</p>
                    </div>
                  </div>

                  {/* 雷达图和条形图 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={emotionRadarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                          <Radar dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: '焦虑', score: result.anxietyScore, key: 'anxiety' as EmotionBlockType },
                            { name: '匮乏', score: result.scarcityScore, key: 'scarcity' as EmotionBlockType },
                            { name: '比较', score: result.comparisonScore, key: 'comparison' as EmotionBlockType },
                            { name: '羞耻', score: result.shameScore, key: 'shame' as EmotionBlockType },
                            { name: '内疚', score: result.guiltScore, key: 'guilt' as EmotionBlockType },
                          ]} 
                          layout="vertical"
                        >
                          <XAxis type="number" domain={[0, 10]} hide />
                          <YAxis dataKey="name" type="category" width={35} tick={{ fontSize: 10 }} />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {[
                              { key: 'anxiety' as EmotionBlockType },
                              { key: 'scarcity' as EmotionBlockType },
                              { key: 'comparison' as EmotionBlockType },
                              { key: 'shame' as EmotionBlockType },
                              { key: 'guilt' as EmotionBlockType },
                            ].map((entry) => (
                              <Cell key={entry.key} fill={emotionColors[entry.key]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 行动清单 */}
                  <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                    <h5 className="font-semibold text-pink-700 mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      情绪疗愈行动清单
                    </h5>
                    <ul className="space-y-2">
                      {dominantEmotion.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-pink-800">
                          <span className="flex-shrink-0 w-5 h-5 bg-pink-200 text-pink-700 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </motion.div>
        </AccordionItem>

        {/* 层间递进提示 */}
        <LayerTransitionHint from="emotion" to="belief" />

        {/* 第三层：信念层分析 */}
        <AccordionItem value="belief" className="border-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:rounded-b-none">
                <div className={cn("bg-gradient-to-br p-4 text-white w-full", blockInfo.belief.color)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-white/80 text-xs">第三层</p>
                        <h3 className="text-lg font-bold">信念层分析（5大信念卡点）</h3>
                        <p className="text-white/90 text-xs">主导卡点：{dominantBelief.name}</p>
                      </div>
                    </div>
                    <div className="text-right mr-2">
                      <span className="text-2xl font-bold">{result.beliefScore}</span>
                      <span className="text-white/80 text-sm">/50</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="p-5 space-y-5">
                  {/* 核心理念 */}
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800">
                      <span className="font-semibold">💡 离苦得乐的关键：</span>直面内在障碍，让"爱与智慧"替代"焦虑与评判"，使财富随能量流动自然显化
                    </p>
                  </div>

                  {/* 主导卡点卡片 */}
                  <div className={cn("bg-gradient-to-br p-4 text-white rounded-xl", dominantBelief.color)}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{dominantBelief.emoji}</span>
                      <div>
                        <h4 className="font-bold text-lg">{dominantBelief.name}</h4>
                        <p className="text-white/80 text-sm">{dominantBelief.description}</p>
                      </div>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed mb-3">{dominantBelief.detail}</p>
                    
                    {/* 核心信念标签 */}
                    <div className="mb-3">
                      <p className="text-white/70 text-xs mb-2">限制性信念：</p>
                      <div className="flex flex-wrap gap-2">
                        {dominantBelief.coreBeliefs.map((belief, index) => (
                          <span key={index} className="bg-white/20 px-2 py-1 rounded text-xs">
                            "{belief}"
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white/20 rounded-lg">
                      <p className="text-sm font-medium">💡 突破方案：{dominantBelief.solution}</p>
                    </div>
                  </div>

                  {/* 雷达图和条形图 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={beliefRadarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                          <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: '匮乏', score: result.lackScore, key: 'lack' as BeliefBlockType },
                            { name: '线性', score: result.linearScore, key: 'linear' as BeliefBlockType },
                            { name: '污名', score: result.stigmaScore, key: 'stigma' as BeliefBlockType },
                            { name: '不配', score: result.unworthyScore, key: 'unworthy' as BeliefBlockType },
                            { name: '关系', score: result.relationshipScore, key: 'relationship' as BeliefBlockType },
                          ]} 
                          layout="vertical"
                        >
                          <XAxis type="number" domain={[0, 10]} hide />
                          <YAxis dataKey="name" type="category" width={35} tick={{ fontSize: 10 }} />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {[
                              { key: 'lack' as BeliefBlockType },
                              { key: 'linear' as BeliefBlockType },
                              { key: 'stigma' as BeliefBlockType },
                              { key: 'unworthy' as BeliefBlockType },
                              { key: 'relationship' as BeliefBlockType },
                            ].map((entry) => (
                              <Cell key={entry.key} fill={beliefColors[entry.key]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 行动清单 */}
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h5 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      信念重塑行动清单
                    </h5>
                    <ul className="space-y-2">
                      {dominantBelief.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-purple-800">
                          <span className="flex-shrink-0 w-5 h-5 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </motion.div>
        </AccordionItem>
      </Accordion>

      {/* AI 个性化洞察卡片 - 移到三层分析后 */}
      <AIInsightCard
        insight={aiInsight}
        isLoading={isLoadingAI}
        error={aiError}
      />

      {/* 优先突破地图 - Top 3 */}
      <PriorityBreakthroughMap
        mouthScore={result.mouthScore}
        handScore={result.handScore}
        eyeScore={result.eyeScore}
        heartScore={result.heartScore}
        anxietyScore={result.anxietyScore}
        scarcityScore={result.scarcityScore}
        comparisonScore={result.comparisonScore}
        shameScore={result.shameScore}
        guiltScore={result.guiltScore}
        lackScore={result.lackScore}
        linearScore={result.linearScore}
        stigmaScore={result.stigmaScore}
        unworthyScore={result.unworthyScore}
        relationshipScore={result.relationshipScore}
      />

      {/* 训练营转化卡片 */}
      <CampConversionCard
        hasPurchased={hasPurchased}
        onPurchase={() => setShowPayDialog(true)}
        onStart={() => setShowStartDialog(true)}
        onViewDetails={() => navigate('/wealth-camp-intro')}
      />

      {/* 行动按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        {onSave && !isSaved && (
          <Button 
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg h-12"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "保存中..." : "保存测评结果"}
          </Button>
        )}
        
        {isSaved && (
          <div className="flex items-center justify-center gap-2 text-emerald-600 py-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">测评结果已保存</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <WealthInviteCardDialog
            defaultTab="assessment"
            trigger={
              <Button variant="outline" className="h-11 w-full">
                <Share2 className="w-4 h-4 mr-2" />
                分享结果
              </Button>
            }
          />
          <Button variant="outline" className="h-11" onClick={() => navigate('/energy-studio#coach')}>
            <MessageCircle className="w-4 h-4 mr-2" />
            与教练对话
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground"
          onClick={onRetake}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重新测评
        </Button>
        
        {/* 微信支付对话框 */}
        <WechatPayDialog
          open={showPayDialog}
          onOpenChange={(open) => {
            setShowPayDialog(open);
            if (open) {
              // 埋点：发起支付
              trackEvent('payment_initiated', { metadata: { package_key: 'camp-wealth_block_21', price: 299 } });
            }
          }}
          packageInfo={{
            key: 'camp-wealth_block_21',
            name: '财富觉醒训练营',
            price: 299
          }}
          onSuccess={async () => {
            // 1. 首先记录购买（最重要）
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { error } = await supabase.from('user_camp_purchases').insert({
                  user_id: user.id,
                  camp_type: 'wealth_block_21',
                  camp_name: '财富觉醒训练营',
                  purchase_price: 299,
                  payment_status: 'paid'
                });
                if (error) {
                  console.error('❌ Failed to record purchase:', error);
                } else {
                  console.log('✅ Purchase recorded successfully');
                }
              }
            } catch (err) {
              console.error('❌ Failed to record purchase:', err);
            }
            
            // 2. 然后执行其他操作
            setShowPayDialog(false);
            toast.success("购买成功！请选择开始日期");
            refetchPurchase();
            queryClient.invalidateQueries({ queryKey: ['camp-purchase', 'wealth_block_21'] });
            setShowStartDialog(true);
          }}
        />
        
        {/* 开始训练营对话框 */}
        <StartCampDialog
          open={showStartDialog}
          onOpenChange={setShowStartDialog}
          campTemplate={{
            camp_type: "wealth_block_21",
            camp_name: "财富觉醒训练营",
            duration_days: 21,
            price: 299,
            original_price: 399
          }}
        />
      </motion.div>
    </div>
  );
}

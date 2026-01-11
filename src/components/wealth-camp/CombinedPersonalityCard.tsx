import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Target, 
  Heart, 
  Brain, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Sparkles,
  Zap
} from "lucide-react";
import { useLayerProgress } from "@/hooks/useLayerProgress";
import { useAssessmentBaseline } from "@/hooks/useAssessmentBaseline";
import { useFourPoorProgress } from "@/hooks/useFourPoorProgress";
import { getPatternConfig, reactionPatternConfig } from "@/config/reactionPatternConfig";
import { useReactionPatternProgress } from "@/hooks/useReactionPatternProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { fourPoorRichConfig } from "@/config/fourPoorConfig";
import {
  fourPoorInfo,
  emotionBlockInfo,
  beliefBlockInfo,
  patternInfo,
  blockInfo,
  FourPoorType,
  EmotionBlockType,
  BeliefBlockType,
} from "@/components/wealth-block/wealthBlockData";
import { useState } from "react";

interface CombinedPersonalityCardProps {
  campId?: string;
  currentDay?: number;
  onNavigateToTask?: (taskKey: 'meditation' | 'coaching' | 'challenge' | 'share') => void;
  className?: string;
}

// Color maps for charts
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

export function CombinedPersonalityCard({ 
  campId, 
  currentDay: _currentDay,
  onNavigateToTask,
  className 
}: CombinedPersonalityCardProps) {
  const navigate = useNavigate();
  const { layers, overall, isLoading: layersLoading } = useLayerProgress(campId);
  const { baseline, isLoading: baselineLoading } = useAssessmentBaseline(campId);
  const { transformationRate, patternConfig, isLoading: patternLoading } = useReactionPatternProgress(campId);
  const { awarenessCount, awarenessBreakdown, transformationRates } = useFourPoorProgress(campId);
  
  const [openLayers, setOpenLayers] = useState<string[]>([]);
  
  const isLoading = layersLoading || baselineLoading || patternLoading;

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Get pattern info from wealthBlockData for full display - with fallback
  const pattern = baseline?.reaction_pattern 
    ? (patternInfo[baseline.reaction_pattern as keyof typeof patternInfo] || patternInfo.harmony)
    : patternInfo.harmony;
  
  // Get patternConfig with fallback
  const safePatternConfig = patternConfig || getPatternConfig('harmony') || reactionPatternConfig.harmony;

  if (!baseline) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">
            请先完成财富卡点测评以查看人格画像
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => navigate('/wealth-block')}
          >
            去测评
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Get dominant block info
  const dominantPoor = baseline.dominant_poor ? 
    fourPoorInfo[baseline.dominant_poor as FourPoorType] : fourPoorInfo.mouth;
  const dominantEmotion = baseline.dominant_emotion ? 
    emotionBlockInfo[baseline.dominant_emotion as EmotionBlockType] : emotionBlockInfo.anxiety;
  const dominantBelief = baseline.dominant_belief ? 
    beliefBlockInfo[baseline.dominant_belief as BeliefBlockType] : beliefBlockInfo.lack;

  // Build radar data
  const fourPoorRadarData = [
    { subject: '嘴穷', score: baseline.mouth_score || 0, fullMark: 15 },
    { subject: '手穷', score: baseline.hand_score || 0, fullMark: 10 },
    { subject: '眼穷', score: baseline.eye_score || 0, fullMark: 15 },
    { subject: '心穷', score: baseline.heart_score || 0, fullMark: 10 },
  ];

  // Emotion radar - approximate from baseline
  const emotionRadarData = [
    { subject: '金钱焦虑', score: Math.round((baseline.emotion_score || 25) / 5), fullMark: 10 },
    { subject: '匮乏恐惧', score: Math.round((baseline.emotion_score || 25) / 5), fullMark: 10 },
    { subject: '比较自卑', score: Math.round((baseline.emotion_score || 25) / 6), fullMark: 10 },
    { subject: '羞耻厌恶', score: Math.round((baseline.emotion_score || 25) / 6), fullMark: 10 },
    { subject: '消费内疚', score: Math.round((baseline.emotion_score || 25) / 7), fullMark: 10 },
  ];

  // Belief radar - approximate from baseline
  const beliefRadarData = [
    { subject: '匮乏感', score: Math.round((baseline.belief_score || 20) / 5), fullMark: 10 },
    { subject: '线性思维', score: Math.round((baseline.belief_score || 20) / 5), fullMark: 10 },
    { subject: '金钱污名', score: Math.round((baseline.belief_score || 20) / 5), fullMark: 10 },
    { subject: '不配得感', score: Math.round((baseline.belief_score || 20) / 6), fullMark: 10 },
    { subject: '关系恐惧', score: Math.round((baseline.belief_score || 20) / 7), fullMark: 10 },
  ];

  // Get layer data
  const behaviorLayer = layers.find(l => l.key === 'behavior');
  const emotionLayer = layers.find(l => l.key === 'emotion');
  const beliefLayer = layers.find(l => l.key === 'belief');

  // Calculate score changes (block score: lower = better)
  const behaviorChange = baseline.behavior_score - (behaviorLayer?.currentStars ? (5 - behaviorLayer.currentStars) * 10 : baseline.behavior_score);
  const emotionChange = baseline.emotion_score - (emotionLayer?.currentStars ? (5 - emotionLayer.currentStars) * 10 : baseline.emotion_score);
  const beliefChange = baseline.belief_score - (beliefLayer?.currentStars ? (5 - beliefLayer.currentStars) * 10 : baseline.belief_score);

  const handleViewReport = () => {
    navigate('/wealth-block?view=history');
  };

  const handleNavigateToTask = (taskKey: 'meditation' | 'coaching' | 'challenge' | 'share') => {
    if (onNavigateToTask) {
      onNavigateToTask(taskKey);
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">🧬</span>
            我的财富人格画像
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            onClick={handleViewReport}
          >
            📋查看报告
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {/* 财富反应模式卡片 - 复刻测评报告样式 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className={cn("rounded-xl overflow-hidden", pattern.color)}>
            <div className="bg-gradient-to-br p-3 text-white">
              {/* 头部 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <span className="text-2xl">{pattern.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-[10px]">🧭 你的财富反应模式</p>
                  <h2 className="text-lg font-bold">【{pattern.name}】</h2>
                  <p className="text-white/90 text-xs mt-0.5">{pattern.tagline}</p>
                </div>
              </div>
              
              {/* 说明文字 */}
              <div className="p-2 bg-white/15 rounded-lg mb-2">
                <p className="text-white/95 text-xs leading-relaxed">
                  📌 这不是性格，而是你在面对<span className="font-semibold">钱、机会、价格</span>时的自动反应。
                </p>
              </div>
              
              {/* 你的状态 */}
              <div className="mb-2">
                <h4 className="text-white/90 text-[10px] font-semibold mb-1.5 flex items-center gap-1">
                  💬 你的状态
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {pattern.state.map((item, index) => (
                    <span key={index} className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/95">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 系统建议 */}
              <div className="p-2 bg-white/20 rounded-lg mb-2">
                <h4 className="text-white text-xs font-semibold mb-1 flex items-center gap-1.5">
                  💡 系统建议
                </h4>
                <p className="text-white/95 text-xs">{pattern.suggestion}</p>
                <p className="text-white/80 text-[10px] mt-1">
                  训练重点：{pattern.trainingFocus}
                </p>
              </div>
              
              {/* 转化进度 */}
              <div className="pt-2 border-t border-white/20">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-white/80">🎯 转化进度</span>
                  <span className="flex items-center gap-2">
                    <span className="text-white/60">{safePatternConfig.transformation.from}</span>
                    <span>→</span>
                    <span className="font-semibold">{safePatternConfig.transformation.toName} {safePatternConfig.transformation.toEmoji}</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-white/80"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, transformationRate)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/70 mt-1">
                  <span>Day 0: {Math.max(0, transformationRate - 20)}%</span>
                  <span className="text-white font-medium">当前: {transformationRate}%</span>
                </div>
              </div>
              
              {/* 智能规划提示 */}
              <div className="mt-2 p-2 bg-white/10 rounded-lg border border-white/20">
                <p className="text-white/90 text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  每日打卡挑战将根据你的模式智能规划突破路径
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 分隔线 */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] text-muted-foreground font-medium">三层深度分析</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* 三层深度分析 - 手风琴 */}
        <Accordion
          type="multiple"
          value={openLayers}
          onValueChange={setOpenLayers}
          className="space-y-2"
        >
          {/* 第一层：行为层 */}
          <AccordionItem value="behavior" className="border-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden border shadow-sm">
                <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:rounded-b-none">
                  <div className={cn("bg-gradient-to-br p-3 text-white w-full", blockInfo.behavior.color)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-[10px]">◎ 第一层</p>
                          <h3 className="text-sm font-bold">行为层分析（四穷模型）</h3>
                          <p className="text-white/90 text-[10px]">主导：{dominantPoor.name}</p>
                        </div>
                      </div>
                      <div className="text-right mr-2">
                        <span className="text-xl font-bold">{baseline.behavior_score}</span>
                        <span className="text-white/80 text-xs">/50</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="p-3 space-y-3">
                    {/* 主导卡点卡片 */}
                    <div className={cn("p-3 text-white rounded-lg", dominantPoor.color)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{dominantPoor.emoji}</span>
                        <div>
                          <h4 className="font-bold text-sm">{dominantPoor.name}</h4>
                          <p className="text-white/80 text-[10px]">{dominantPoor.description}</p>
                        </div>
                      </div>
                      <p className="text-white/90 text-xs leading-relaxed mb-2">{dominantPoor.detail}</p>
                      <div className="p-2 bg-white/20 rounded-lg">
                        <p className="text-xs">💡 突破方案：{dominantPoor.solution}</p>
                      </div>
                    </div>

                    {/* 雷达图和条形图 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={fourPoorRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 15]} tick={false} axisLine={false} />
                            <Radar dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={[
                              { name: '嘴穷', score: baseline.mouth_score, key: 'mouth' as FourPoorType },
                              { name: '手穷', score: baseline.hand_score, key: 'hand' as FourPoorType },
                              { name: '眼穷', score: baseline.eye_score, key: 'eye' as FourPoorType },
                              { name: '心穷', score: baseline.heart_score, key: 'heart' as FourPoorType },
                            ]} 
                            layout="vertical"
                          >
                            <XAxis type="number" domain={[0, 15]} hide />
                            <YAxis dataKey="name" type="category" width={35} tick={{ fontSize: 9 }} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {(['mouth', 'hand', 'eye', 'heart'] as const).map((key) => (
                                <Cell key={key} fill={fourPoorColors[key]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 成长对比 */}
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">📊 成长对比</span>
                        {behaviorChange !== 0 && (
                          <span className={cn(
                            "font-medium",
                            behaviorChange > 0 ? "text-emerald-600" : "text-muted-foreground"
                          )}>
                            {behaviorChange > 0 ? `-${behaviorChange}分 ↓ 行为改善` : "持续练习中"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Day 0: {baseline.behavior_score}分</span>
                        <span>→</span>
                        <span className="font-medium">当前: {behaviorLayer?.currentStars?.toFixed(1)}★</span>
                      </div>
                    </div>

                    {/* 下一步行动 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                      onClick={() => handleNavigateToTask('coaching')}
                    >
                      📌 {behaviorLayer?.nextStep} →
                    </Button>
                  </CardContent>
                </AccordionContent>
              </Card>
            </motion.div>
          </AccordionItem>

          {/* 第二层：情绪层 */}
          <AccordionItem value="emotion" className="border-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="overflow-hidden border shadow-sm">
                <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:rounded-b-none">
                  <div className={cn("bg-gradient-to-br p-3 text-white w-full", blockInfo.emotion.color)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-[10px]">♡ 第二层</p>
                          <h3 className="text-sm font-bold">情绪层分析（5大情绪卡点）</h3>
                          <p className="text-white/90 text-[10px]">主导：{dominantEmotion.name}</p>
                        </div>
                      </div>
                      <div className="text-right mr-2">
                        <span className="text-xl font-bold">{baseline.emotion_score}</span>
                        <span className="text-white/80 text-xs">/50</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="p-3 space-y-3">
                    {/* 主导卡点卡片 */}
                    <div className={cn("p-3 text-white rounded-lg", dominantEmotion.color)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{dominantEmotion.emoji}</span>
                        <div>
                          <h4 className="font-bold text-sm">{dominantEmotion.name}</h4>
                          <p className="text-white/80 text-[10px]">{dominantEmotion.description}</p>
                        </div>
                      </div>
                      <p className="text-white/90 text-xs leading-relaxed mb-2">{dominantEmotion.detail}</p>
                      <div className="p-2 bg-white/20 rounded-lg">
                        <p className="text-xs">💡 突破方案：{dominantEmotion.solution}</p>
                      </div>
                    </div>

                    {/* 雷达图和条形图 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={emotionRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={[
                              { name: '焦虑', score: emotionRadarData[0].score, key: 'anxiety' },
                              { name: '匮乏', score: emotionRadarData[1].score, key: 'scarcity' },
                              { name: '比较', score: emotionRadarData[2].score, key: 'comparison' },
                              { name: '羞耻', score: emotionRadarData[3].score, key: 'shame' },
                              { name: '内疚', score: emotionRadarData[4].score, key: 'guilt' },
                            ]} 
                            layout="vertical"
                          >
                            <XAxis type="number" domain={[0, 10]} hide />
                            <YAxis dataKey="name" type="category" width={30} tick={{ fontSize: 8 }} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {(['anxiety', 'scarcity', 'comparison', 'shame', 'guilt'] as const).map((key) => (
                                <Cell key={key} fill={emotionColors[key]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 成长对比 */}
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">📊 成长对比</span>
                        {emotionChange !== 0 && (
                          <span className={cn(
                            "font-medium",
                            emotionChange > 0 ? "text-emerald-600" : "text-muted-foreground"
                          )}>
                            {emotionChange > 0 ? `-${emotionChange}分 ↓ 情绪舒缓` : "持续练习中"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Day 0: {baseline.emotion_score}分</span>
                        <span>→</span>
                        <span className="font-medium">当前: {emotionLayer?.currentStars?.toFixed(1)}★</span>
                      </div>
                    </div>

                    {/* 核心洞见 */}
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg border-l-2 border-pink-500">
                      <p className="text-xs text-pink-800 dark:text-pink-200">
                        <span className="font-semibold">💡</span> 财富的本质是心理能量的流动。财富卡住=心理能量阻塞
                      </p>
                    </div>

                    {/* 下一步行动 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8 text-pink-700 hover:text-pink-800 hover:bg-pink-50"
                      onClick={() => handleNavigateToTask('meditation')}
                    >
                      📌 {emotionLayer?.nextStep} →
                    </Button>
                  </CardContent>
                </AccordionContent>
              </Card>
            </motion.div>
          </AccordionItem>

          {/* 第三层：信念层 */}
          <AccordionItem value="belief" className="border-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden border shadow-sm">
                <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:rounded-b-none">
                  <div className={cn("bg-gradient-to-br p-3 text-white w-full", blockInfo.belief.color)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <Brain className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-[10px]">✧ 第三层</p>
                          <h3 className="text-sm font-bold">信念层分析（5大信念卡点）</h3>
                          <p className="text-white/90 text-[10px]">主导：{dominantBelief.name}</p>
                        </div>
                      </div>
                      <div className="text-right mr-2">
                        <span className="text-xl font-bold">{baseline.belief_score}</span>
                        <span className="text-white/80 text-xs">/50</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="p-3 space-y-3">
                    {/* 主导卡点卡片 */}
                    <div className={cn("p-3 text-white rounded-lg", dominantBelief.color)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{dominantBelief.emoji}</span>
                        <div>
                          <h4 className="font-bold text-sm">{dominantBelief.name}</h4>
                          <p className="text-white/80 text-[10px]">{dominantBelief.description}</p>
                        </div>
                      </div>
                      <p className="text-white/90 text-xs leading-relaxed mb-2">{dominantBelief.detail}</p>
                      
                      {/* 限制性信念标签 */}
                      <div className="mb-2">
                        <p className="text-white/70 text-[10px] mb-1">限制性信念：</p>
                        <div className="flex flex-wrap gap-1">
                          {dominantBelief.coreBeliefs.map((belief, index) => (
                            <span key={index} className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                              "{belief}"
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-2 bg-white/20 rounded-lg">
                        <p className="text-xs">💡 突破方案：{dominantBelief.solution}</p>
                      </div>
                    </div>

                    {/* 雷达图和条形图 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={beliefRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={[
                              { name: '匮乏', score: beliefRadarData[0].score, key: 'lack' },
                              { name: '线性', score: beliefRadarData[1].score, key: 'linear' },
                              { name: '污名', score: beliefRadarData[2].score, key: 'stigma' },
                              { name: '不配', score: beliefRadarData[3].score, key: 'unworthy' },
                              { name: '关系', score: beliefRadarData[4].score, key: 'relationship' },
                            ]} 
                            layout="vertical"
                          >
                            <XAxis type="number" domain={[0, 10]} hide />
                            <YAxis dataKey="name" type="category" width={30} tick={{ fontSize: 8 }} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {(['lack', 'linear', 'stigma', 'unworthy', 'relationship'] as const).map((key) => (
                                <Cell key={key} fill={beliefColors[key]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 成长对比 */}
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">📊 成长对比</span>
                        {beliefChange !== 0 && (
                          <span className={cn(
                            "font-medium",
                            beliefChange > 0 ? "text-emerald-600" : "text-muted-foreground"
                          )}>
                            {beliefChange > 0 ? `-${beliefChange}分 ↓ 信念松动` : "持续练习中"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Day 0: {baseline.belief_score}分</span>
                        <span>→</span>
                        <span className="font-medium">当前: {beliefLayer?.currentStars?.toFixed(1)}★</span>
                      </div>
                    </div>

                    {/* 核心洞见 */}
                    <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border-l-2 border-violet-500">
                      <p className="text-xs text-violet-800 dark:text-violet-200">
                        <span className="font-semibold">💡</span> 直面内在障碍，让"爱与智慧"替代"焦虑与评判"
                      </p>
                    </div>

                    {/* 下一步行动 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8 text-violet-700 hover:text-violet-800 hover:bg-violet-50"
                      onClick={() => handleNavigateToTask('meditation')}
                    >
                      📌 {beliefLayer?.nextStep} →
                    </Button>
                  </CardContent>
                </AccordionContent>
              </Card>
            </motion.div>
          </AccordionItem>
        </Accordion>

        {/* 底部核心洞见 + 智能规划提示 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50">
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              核心洞见
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-3">
              行为模式是冰山一角，背后是情绪与信念的驱动。改变行为，需先看见行为背后的能量模式。
            </p>
            <div className="p-2 bg-white/60 dark:bg-white/10 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-medium">每日打卡挑战将根据你的三层数据智能规划突破方向</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => handleNavigateToTask('challenge')}
            >
              📌 前往今日任务
            </Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

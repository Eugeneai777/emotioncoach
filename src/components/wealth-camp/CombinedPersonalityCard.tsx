import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Target, 
  Heart, 
  Brain, 
  ExternalLink,
  Sparkles,
  Zap,
  Star,
  Gift,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLayerProgress } from "@/hooks/useLayerProgress";
import { useAssessmentBaseline } from "@/hooks/useAssessmentBaseline";
import { useFourPoorProgress } from "@/hooks/useFourPoorProgress";
import { getPatternConfig, reactionPatternConfig } from "@/config/reactionPatternConfig";
import { useReactionPatternProgress } from "@/hooks/useReactionPatternProgress";
import { useWealthJournalEntries } from "@/hooks/useWealthJournalEntries";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const { 
    transformationRate, 
    patternConfig, 
    patternKey,
    emotionImprovement, 
    awakeningMomentsCount,
    isLoading: patternLoading 
  } = useReactionPatternProgress(campId);
  const { awarenessCount, awarenessBreakdown, transformationRates } = useFourPoorProgress(campId);
  const { stats } = useWealthJournalEntries({ campId });
  
  const [openLayers, setOpenLayers] = useState<string[]>([]);
  
  const isLoading = layersLoading || baselineLoading || patternLoading;
  
  // Get milestone message based on transformation rate
  const getMilestoneMessage = (rate: number) => {
    if (rate >= 100) return { emoji: "🎊", text: "完美蜕变！你已完成模式转化" };
    if (rate >= 75) return { emoji: "🌟", text: "即将突破！再接再厉" };
    if (rate >= 50) return { emoji: "💪", text: "突破半程！继续保持" };
    if (rate >= 25) return { emoji: "🌱", text: "初见成效！觉醒正在发生" };
    return { emoji: "🚀", text: "觉醒启程，每一步都算数" };
  };
  
  const milestoneMessage = getMilestoneMessage(transformationRate);

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
  
  // Get dominant block info (with safe fallbacks for unexpected enum values)
  const dominantPoor = (baseline.dominant_poor && fourPoorInfo[baseline.dominant_poor as FourPoorType]) || fourPoorInfo.mouth;
  const dominantEmotion = (baseline.dominant_emotion && emotionBlockInfo[baseline.dominant_emotion as EmotionBlockType]) || emotionBlockInfo.anxiety;
  const dominantBelief = (baseline.dominant_belief && beliefBlockInfo[baseline.dominant_belief as BeliefBlockType]) || beliefBlockInfo.lack;

  // Get layer data first for growth calculations
  const behaviorLayer = layers.find(l => l.key === 'behavior');
  const emotionLayer = layers.find(l => l.key === 'emotion');
  const beliefLayer = layers.find(l => l.key === 'belief');

  // Build radar data with baseline and current for growth animation
  // Semantic: 觉醒度 = 满分 - 卡点分数（越高越好，实线在外 = 成长）
  const behaviorGrowthFactor = (behaviorLayer?.currentStars || 0) / 5; // 0-1 scale
  const FOUR_POOR_FULL = 15;
  // 行为层：添加 15% 基础可见量，确保当前觉醒度始终在 Day 0 外圈
  const behaviorCurrentScore = (raw: number) => {
    const baseImprovement = raw * 0.15;
    const growthBonus = raw * behaviorGrowthFactor * 0.2;
    return FOUR_POOR_FULL - Math.max(0, raw - baseImprovement - growthBonus);
  };
  const fourPoorRadarData = [
    { subject: '嘴穷', baseline: FOUR_POOR_FULL - (baseline.mouth_score || 0), current: behaviorCurrentScore(baseline.mouth_score || 0), fullMark: FOUR_POOR_FULL },
    { subject: '手穷', baseline: FOUR_POOR_FULL - (baseline.hand_score || 0), current: behaviorCurrentScore(baseline.hand_score || 0), fullMark: FOUR_POOR_FULL },
    { subject: '眼穷', baseline: FOUR_POOR_FULL - (baseline.eye_score || 0), current: behaviorCurrentScore(baseline.eye_score || 0), fullMark: FOUR_POOR_FULL },
    { subject: '心穷', baseline: FOUR_POOR_FULL - (baseline.heart_score || 0), current: behaviorCurrentScore(baseline.heart_score || 0), fullMark: FOUR_POOR_FULL },
  ];

  // Emotion radar - 觉醒度语义（越高越好）
  const EMOTION_FULL = 10;
  const emotionGrowthFactor = (emotionLayer?.currentStars || 0) / 5;
  // 情绪层：添加 15% 基础可见量，修复 growthFactor=0 时两线重合问题
  const emotionCurrentScore = (raw: number) => {
    const baseImprovement = raw * 0.15;
    const growthBonus = raw * emotionGrowthFactor * 0.2;
    return EMOTION_FULL - Math.max(0, raw - baseImprovement - growthBonus);
  };
  const emotionBaseScores = {
    anxiety:    Math.round((baseline.emotion_score || 25) / 5),
    scarcity:   Math.round((baseline.emotion_score || 25) / 5),
    comparison: Math.round((baseline.emotion_score || 25) / 6),
    shame:      Math.round((baseline.emotion_score || 25) / 6),
    guilt:      Math.round((baseline.emotion_score || 25) / 7),
  };
  const emotionRadarData = [
    { subject: '金钱焦虑', baseline: EMOTION_FULL - emotionBaseScores.anxiety,    current: emotionCurrentScore(emotionBaseScores.anxiety),    fullMark: EMOTION_FULL },
    { subject: '匮乏恐惧', baseline: EMOTION_FULL - emotionBaseScores.scarcity,   current: emotionCurrentScore(emotionBaseScores.scarcity),   fullMark: EMOTION_FULL },
    { subject: '比较自卑', baseline: EMOTION_FULL - emotionBaseScores.comparison, current: emotionCurrentScore(emotionBaseScores.comparison), fullMark: EMOTION_FULL },
    { subject: '羞耻厌恶', baseline: EMOTION_FULL - emotionBaseScores.shame,      current: emotionCurrentScore(emotionBaseScores.shame),      fullMark: EMOTION_FULL },
    { subject: '消费内疚', baseline: EMOTION_FULL - emotionBaseScores.guilt,      current: emotionCurrentScore(emotionBaseScores.guilt),      fullMark: EMOTION_FULL },
  ];

  // 计算情绪层主导维度（baseline 值最低 = 卡点最重 = 觉醒度最低）
  const emotionDimensions = [
    { key: 'anxiety',    label: '金钱焦虑', rawScore: emotionBaseScores.anxiety,    emoji: '💰',
      insight: '你对金钱有较强的焦虑感，这往往源于童年时期的匮乏体验。每次出现金钱焦虑时，试着观察它，而不是抗拒它——觉察本身就是疗愈的开始。',
      tip: '练习：当焦虑来临时，深呼吸并问自己"我现在是安全的吗？"' },
    { key: 'scarcity',  label: '匮乏恐惧', rawScore: emotionBaseScores.scarcity,   emoji: '🌱',
      insight: '匮乏感是一种深层信念，让你总觉得"不够"。这种模式会无意识地阻断财富流入。好消息是：匮乏感是可以被重写的。',
      tip: '练习：每天写下3件今天已经拥有的事物，培养丰盛感知力。' },
    { key: 'comparison', label: '比较自卑', rawScore: emotionBaseScores.comparison, emoji: '🌸',
      insight: '与他人比较是自我价值感低的信号。你的财富旅程是独特的，没有人走的路和你完全相同。把注意力从"比较"转向"成长"。',
      tip: '练习：每次比较冒出来时，改问"我今天比昨天进步了什么？"' },
    { key: 'shame',      label: '羞耻厌恶', rawScore: emotionBaseScores.shame,      emoji: '💗',
      insight: '对金钱的羞耻感往往来自"赚钱是不好的"这类早期信念。这层情绪需要被温柔地接纳，才能逐渐松动。',
      tip: '练习：对自己说"我允许自己拥有财富，财富是善意流动的能量。"' },
    { key: 'guilt',      label: '消费内疚', rawScore: emotionBaseScores.guilt,      emoji: '✨',
      insight: '消费内疚说明你和"享受"之间还有一道墙。真正的财富自由包括能坦然享用你赚到的钱，而不带任何愧疚。',
      tip: '练习：下次消费后，对自己说"我值得这份好。"' },
  ];
  // 找到 rawScore 最高（卡点最重）的维度
  const dominantEmotionDim = emotionDimensions.reduce((prev, curr) =>
    curr.rawScore > prev.rawScore ? curr : prev
  );

  // Belief radar - 觉醒度语义（越高越好）
  const BELIEF_FULL = 10;
  const beliefGrowthFactor = (beliefLayer?.currentStars || 0) / 5;
  // 信念层：添加 15% 基础可见量
  const beliefCurrentScore = (raw: number) => {
    const baseImprovement = raw * 0.15;
    const growthBonus = raw * beliefGrowthFactor * 0.2;
    return BELIEF_FULL - Math.max(0, raw - baseImprovement - growthBonus);
  };
  const beliefBaseScores = {
    lack:    Math.round((baseline.belief_score || 20) / 5),
    linear:  Math.round((baseline.belief_score || 20) / 5),
    stigma:  Math.round((baseline.belief_score || 20) / 5),
    unworth: Math.round((baseline.belief_score || 20) / 6),
    fear:    Math.round((baseline.belief_score || 20) / 7),
  };
  const beliefRadarData = [
    { subject: '匮乏感',   baseline: BELIEF_FULL - beliefBaseScores.lack,    current: beliefCurrentScore(beliefBaseScores.lack),    fullMark: BELIEF_FULL },
    { subject: '线性思维', baseline: BELIEF_FULL - beliefBaseScores.linear,  current: beliefCurrentScore(beliefBaseScores.linear),  fullMark: BELIEF_FULL },
    { subject: '金钱污名', baseline: BELIEF_FULL - beliefBaseScores.stigma,  current: beliefCurrentScore(beliefBaseScores.stigma),  fullMark: BELIEF_FULL },
    { subject: '不配得感', baseline: BELIEF_FULL - beliefBaseScores.unworth, current: beliefCurrentScore(beliefBaseScores.unworth), fullMark: BELIEF_FULL },
    { subject: '关系恐惧', baseline: BELIEF_FULL - beliefBaseScores.fear,    current: beliefCurrentScore(beliefBaseScores.fear),    fullMark: BELIEF_FULL },
  ];

  const handleViewReport = () => {
    navigate('/wealth-block?view=history');
  };

  const handleNavigateToTask = (taskKey: 'meditation' | 'coaching' | 'challenge' | 'share') => {
    if (onNavigateToTask) {
      onNavigateToTask(taskKey);
    } else {
      // Fallback: navigate to the daily tasks tab when used standalone (e.g., archive tab)
      navigate('/wealth-camp-checkin?tab=today');
    }
  };

  return (
    <Card className={cn("overflow-hidden border border-indigo-200/50 dark:border-indigo-800/30", className)}>
      <div className="h-1 bg-gradient-to-r from-indigo-400 to-violet-400" />
      <CardHeader className="pb-2 bg-indigo-50/40 dark:bg-indigo-950/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
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
          <div 
            className="rounded-xl overflow-hidden bg-white dark:bg-gray-900/60 border-l-4 border-indigo-400"
          >
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
              {/* 头部 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                  <span className="text-2xl">{pattern.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-indigo-600 dark:text-indigo-400 text-[10px]">🧭 你的财富反应模式</p>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-indigo-400 hover:text-indigo-600 transition-colors">
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="bottom" 
                          align="start"
                          className="max-w-[300px] p-3 text-xs bg-popover text-popover-foreground border shadow-lg z-50"
                        >
                          <div className="space-y-2">
                            <p className="font-semibold text-foreground">📊 四种模式 → 转化目标</p>
                            <div className="space-y-1 text-muted-foreground text-[11px]">
                              <p>🟢 <span className="text-emerald-600 dark:text-emerald-400 font-medium">和谐型</span> → ✨ 丰盛型</p>
                              <p>🟡 <span className="text-amber-600 dark:text-amber-400 font-medium">追逐型</span> → 🧘 从容型</p>
                              <p>🔵 <span className="text-blue-600 dark:text-blue-400 font-medium">逃避型</span> → 🤗 迎接型</p>
                              <p>🔴 <span className="text-rose-600 dark:text-rose-400 font-medium">创伤型</span> → 💚 疗愈型</p>
                            </div>
                            <div className="pt-2 border-t border-border">
                              <p className="font-semibold text-foreground">💡 转化理念</p>
                              <p className="text-muted-foreground mt-1 leading-relaxed">
                                不是"变成另一种人"，而是<span className="text-foreground font-medium">成为最好的自己</span>。接纳原有模式，让它为你所用。
                              </p>
                            </div>
                            <div className="pt-2 border-t border-border">
                              <p className="font-semibold text-foreground">🎯 转化率计算</p>
                              <p className="text-muted-foreground mt-1">
                                情绪峰值（40%）+ 觉醒时刻（60%）
                              </p>
                              <p className="text-muted-foreground text-[10px] mt-1">
                                基于最佳3天情绪分 + 高分/新信念天数
                              </p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">【{pattern.name}】</h2>
                  <p className="text-indigo-600 dark:text-indigo-300 text-xs mt-0.5">{pattern.tagline}</p>
                </div>
              </div>
              
              {/* 说明文字 */}
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 rounded-lg mb-2">
                <p className="text-indigo-800 dark:text-indigo-200 text-xs leading-relaxed">
                  📌 这不是性格，而是你在面对<span className="font-semibold">钱、机会、价格</span>时的自动反应。
                </p>
              </div>
              
              
              {/* 转化进度 - 增强版 */}
              <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800/40">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-indigo-700 dark:text-indigo-300">🎯 转化进度</span>
                  <span className="flex items-center gap-2">
                    <span className="text-indigo-400 dark:text-indigo-500">{safePatternConfig.transformation.from}</span>
                    <span>→</span>
                    <span className="font-semibold text-indigo-800 dark:text-indigo-200">{safePatternConfig.transformation.toName} {safePatternConfig.transformation.toEmoji}</span>
                  </span>
                </div>
                
                {/* 里程碑进度条 */}
                <div className="relative">
                  <div className="absolute -top-1 left-0 right-0 flex justify-between px-0">
                    {[0, 25, 50, 75, 100].map((milestone) => (
                      <div 
                        key={milestone} 
                        className="flex flex-col items-center"
                        style={{ width: milestone === 0 || milestone === 100 ? 'auto' : '0' }}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full border-2 transition-all",
                          transformationRate >= milestone 
                            ? "bg-indigo-500 border-white shadow-[0_0_6px_rgba(99,102,241,0.5)]" 
                            : "bg-indigo-200 border-indigo-300 dark:bg-indigo-800 dark:border-indigo-700"
                        )}>
                          {transformationRate >= milestone && milestone > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 rounded-full bg-indigo-300/40"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="h-2 w-full bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden mt-3">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, transformationRate)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[8px] text-indigo-400 dark:text-indigo-500 mt-0.5 px-0">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <motion.div 
                  className="flex items-center justify-center gap-1.5 mt-2 py-1.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/40"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span>{milestoneMessage.emoji}</span>
                  <span className="text-[11px] font-medium text-indigo-800 dark:text-indigo-200">{milestoneMessage.text}</span>
                  <span className="text-indigo-600 dark:text-indigo-300 font-bold ml-1">{transformationRate}%</span>
                </motion.div>
              </div>
              
              {/* 状态标签 */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {pattern.state.map((item, index) => (
                  <span key={index} className="bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full text-[10px] text-indigo-700 dark:text-indigo-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 三层深度分析 */}
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/40 p-2">
          {/* 分隔线 */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300/60 dark:via-slate-600/60 to-transparent" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">三层深度分析</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300/60 dark:via-slate-600/60 to-transparent" />
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
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{dominantPoor.emoji}</span>
                        <div>
                          <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">{dominantPoor.name}</h4>
                          <p className="text-amber-700/80 dark:text-amber-300/80 text-[10px]">{dominantPoor.description}</p>
                        </div>
                      </div>
                      <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed mb-2">{dominantPoor.detail}</p>
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200/60">
                        <p className="text-xs text-amber-800 dark:text-amber-200">💡 突破方案：{dominantPoor.solution}</p>
                      </div>
                    </div>

                    {/* 雷达图和条形图 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={fourPoorRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#1f2937', fontSize: 8 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 15]} tick={false} axisLine={false} />
                            {/* Day 0 基线 - 灰色虚线 */}
                            <Radar 
                              name="Day 0 基线" 
                              dataKey="baseline" 
                              stroke="#9ca3af" 
                              strokeDasharray="3 3"
                              fill="#9ca3af" 
                              fillOpacity={0.15} 
                              strokeWidth={1} 
                            />
                            {/* 当前状态 - 主色动画 */}
                            <Radar 
                              name="当前" 
                              dataKey="current" 
                              stroke="#f59e0b" 
                              fill="#f59e0b" 
                              fillOpacity={0.5} 
                              strokeWidth={2}
                              isAnimationActive={true}
                              animationDuration={1000}
                              animationEasing="ease-out"
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        {/* 图例 */}
                        <div className="flex items-center justify-center gap-3 -mt-2 text-[9px]">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 border-t border-dashed border-gray-400" />
                            <span className="text-muted-foreground">Day 0 起点</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-1.5 bg-amber-500 rounded-sm" />
                            <span className="text-foreground font-medium">当前觉醒度 ↑</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[160px]">
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
                            <YAxis dataKey="name" type="category" width={35} tick={{ fontSize: 9, fill: 'hsl(var(--foreground))' }} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {(['mouth', 'hand', 'eye', 'heart'] as const).map((key) => (
                                <Cell key={key} fill={fourPoorColors[key]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 成长对比 - 统一星级显示 */}
                    <div className="p-2 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">📊 成长对比</span>
                        {behaviorLayer && behaviorLayer.growthStars > 0 && (
                          <span className="font-medium text-emerald-600">
                            +{behaviorLayer.growthStars.toFixed(1)}★ 行为觉醒
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Day 0: {behaviorLayer?.baselineStars?.toFixed(1)}★</span>
                        <span>→</span>
                        <span className="font-medium text-amber-700 dark:text-amber-300">当前: {behaviorLayer?.currentStars?.toFixed(1)}★</span>
                      </div>
                      {/* 可视化双进度条 */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-1.5 bg-muted rounded-full">
                            <div 
                              className="h-full bg-gray-300 rounded-full transition-all"
                              style={{ width: `${behaviorLayer?.baselinePercent || 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Day 0 ({behaviorLayer?.baselinePercent || 0}%)</p>
                        </div>
                        <span className="text-muted-foreground text-xs">→</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-muted rounded-full">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${behaviorLayer?.currentPercent || 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">当前 ({behaviorLayer?.currentPercent || 0}%)</p>
                        </div>
                      </div>
                    </div>

                    {/* 行动足迹嵌入 */}
                    {stats?.givingActions && stats.givingActions.length > 0 && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/50">
                        <h5 className="text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-2">
                          <Gift className="w-3 h-3" />
                          行动足迹 
                          <span className="text-emerald-600 dark:text-emerald-400">({stats.givingActions.length}次给予)</span>
                        </h5>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {stats.givingActions.map((action, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                              <span className="truncate">"{action}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 下一步行动 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20"
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
                    <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/30 border-l-4 border-pink-400">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{dominantEmotion.emoji}</span>
                        <div>
                          <h4 className="font-bold text-sm text-pink-900 dark:text-pink-100">{dominantEmotion.name}</h4>
                          <p className="text-pink-700/80 dark:text-pink-300/80 text-[10px]">{dominantEmotion.description}</p>
                        </div>
                      </div>
                      <p className="text-pink-800 dark:text-pink-200 text-xs leading-relaxed mb-2">{dominantEmotion.detail}</p>
                      <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg border border-pink-200/60">
                        <p className="text-xs text-pink-800 dark:text-pink-200">💡 突破方案：{dominantEmotion.solution}</p>
                      </div>
                    </div>

                    {/* 雷达图和条形图 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={emotionRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#1f2937', fontSize: 7 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                            {/* Day 0 基线 - 灰色虚线 */}
                            <Radar 
                              name="Day 0 基线" 
                              dataKey="baseline" 
                              stroke="#9ca3af" 
                              strokeDasharray="3 3"
                              fill="#9ca3af" 
                              fillOpacity={0.15} 
                              strokeWidth={1} 
                            />
                            {/* 当前状态 - 主色动画 */}
                            <Radar 
                              name="当前" 
                              dataKey="current" 
                              stroke="#ec4899" 
                              fill="#ec4899" 
                              fillOpacity={0.5} 
                              strokeWidth={2}
                              isAnimationActive={true}
                              animationDuration={1000}
                              animationEasing="ease-out"
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        {/* 图例 */}
                        <div className="flex items-center justify-center gap-3 -mt-2 text-[9px]">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 border-t border-dashed border-gray-400" />
                            <span className="text-muted-foreground">Day 0 起点</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-1.5 bg-pink-500 rounded-sm" />
                            <span className="text-foreground font-medium">当前觉醒度 ↑</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={[
                              { name: '焦虑', score: emotionRadarData[0].baseline, key: 'anxiety' },
                              { name: '匮乏', score: emotionRadarData[1].baseline, key: 'scarcity' },
                              { name: '比较', score: emotionRadarData[2].baseline, key: 'comparison' },
                              { name: '羞耻', score: emotionRadarData[3].baseline, key: 'shame' },
                              { name: '内疚', score: emotionRadarData[4].baseline, key: 'guilt' },
                            ]} 
                            layout="vertical"
                          >
                            <XAxis type="number" domain={[0, 10]} hide />
                            <YAxis dataKey="name" type="category" width={30} tick={{ fontSize: 8, fill: 'hsl(var(--foreground))' }} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {(['anxiety', 'scarcity', 'comparison', 'shame', 'guilt'] as const).map((key) => (
                                <Cell key={key} fill={emotionColors[key]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 个性化情绪解读 */}
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200/50 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-pink-800 dark:text-pink-300">
                        <span>{dominantEmotionDim.emoji}</span>
                        <span>你的主要情绪模式：{dominantEmotionDim.label}</span>
                      </div>
                      <p className="text-[11px] text-pink-700 dark:text-pink-400 leading-relaxed">
                        {dominantEmotionDim.insight}
                      </p>
                      <p className="text-[10px] text-pink-600/80 dark:text-pink-300/70 italic">
                        {dominantEmotionDim.tip}
                      </p>
                    </div>

                    {/* 成长对比 - 统一星级显示 */}
                    <div className="p-2 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">📊 成长对比</span>
                        {emotionLayer && emotionLayer.growthStars > 0 && (
                          <span className="font-medium text-emerald-600">
                            +{emotionLayer.growthStars.toFixed(1)}★ 情绪舒缓
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Day 0: {emotionLayer?.baselineStars?.toFixed(1)}★</span>
                        <span>→</span>
                        <span className="font-medium text-pink-700 dark:text-pink-300">当前: {emotionLayer?.currentStars?.toFixed(1)}★</span>
                      </div>
                      {/* 可视化双进度条 */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-1.5 bg-muted rounded-full">
                            <div 
                              className="h-full bg-gray-300 rounded-full transition-all"
                              style={{ width: `${emotionLayer?.baselinePercent || 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Day 0 ({emotionLayer?.baselinePercent || 0}%)</p>
                        </div>
                        <span className="text-muted-foreground text-xs">→</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-muted rounded-full">
                            <div 
                              className="h-full bg-pink-500 rounded-full transition-all"
                              style={{ width: `${emotionLayer?.currentPercent || 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-pink-700 dark:text-pink-300 mt-0.5 font-medium">当前 ({emotionLayer?.currentPercent || 0}%)</p>
                        </div>
                      </div>
                    </div>

                    {/* 觉醒改善数据 */}
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200/50">
                      <h5 className="text-xs font-medium text-pink-800 dark:text-pink-300 flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3" />
                        觉醒改善
                      </h5>
                      <div className="space-y-1 text-[10px] text-pink-700 dark:text-pink-300">
                        <p>💗 情绪流动度：{emotionLayer?.currentStars?.toFixed(1)}★ (Day 0: {emotionLayer?.baselineStars?.toFixed(1)}★)</p>
                        {emotionLayer && emotionLayer.growthStars > 0 && (
                          <p className="text-emerald-600 font-medium">✨ 觉醒提升：+{emotionLayer.growthStars.toFixed(1)}★</p>
                        )}
                        <p className="text-muted-foreground mt-1">💡 财富的本质是心理能量的流动</p>
                      </div>
                    </div>

                    {/* 下一步行动 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8 text-pink-700 dark:text-pink-300 hover:text-pink-800 dark:hover:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-900/20"
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
                    <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border-l-4 border-violet-400">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{dominantBelief.emoji}</span>
                        <div>
                          <h4 className="font-bold text-sm text-violet-900 dark:text-violet-100">{dominantBelief.name}</h4>
                          <p className="text-violet-700/80 dark:text-violet-300/80 text-[10px]">{dominantBelief.description}</p>
                        </div>
                      </div>
                      <p className="text-violet-800 dark:text-violet-200 text-xs leading-relaxed mb-2">{dominantBelief.detail}</p>
                      
                      {/* 限制性信念标签 */}
                      <div className="mb-2">
                        <p className="text-violet-700/70 dark:text-violet-300/70 text-[10px] mb-1">限制性信念：</p>
                        <div className="flex flex-wrap gap-1">
                          {dominantBelief.coreBeliefs.map((belief, index) => (
                            <span key={index} className="bg-violet-100 dark:bg-violet-900/40 border border-violet-200/50 px-1.5 py-0.5 rounded text-[10px] text-violet-700 dark:text-violet-300">
                              "{belief}"
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg border border-violet-200/60">
                        <p className="text-xs text-violet-800 dark:text-violet-200">💡 突破方案：{dominantBelief.solution}</p>
                      </div>
                    </div>

                    {/* 雷达图和条形图 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={beliefRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#1f2937', fontSize: 7 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                            {/* Day 0 基线 - 灰色虚线 */}
                            <Radar 
                              name="Day 0 基线" 
                              dataKey="baseline" 
                              stroke="#9ca3af" 
                              strokeDasharray="3 3"
                              fill="#9ca3af" 
                              fillOpacity={0.15} 
                              strokeWidth={1} 
                            />
                            {/* 当前状态 - 主色动画 */}
                            <Radar 
                              name="当前" 
                              dataKey="current" 
                              stroke="#8b5cf6" 
                              fill="#8b5cf6" 
                              fillOpacity={0.5} 
                              strokeWidth={2}
                              isAnimationActive={true}
                              animationDuration={1000}
                              animationEasing="ease-out"
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        {/* 图例 */}
                        <div className="flex items-center justify-center gap-3 -mt-2 text-[9px]">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 border-t border-dashed border-gray-400" />
                            <span className="text-muted-foreground">Day 0 起点</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-1.5 bg-violet-500 rounded-sm" />
                            <span className="text-foreground font-medium">当前觉醒度 ↑</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={[
                              { name: '匮乏', score: beliefRadarData[0].baseline, key: 'lack' },
                              { name: '线性', score: beliefRadarData[1].baseline, key: 'linear' },
                              { name: '污名', score: beliefRadarData[2].baseline, key: 'stigma' },
                              { name: '不配', score: beliefRadarData[3].baseline, key: 'unworthy' },
                              { name: '关系', score: beliefRadarData[4].baseline, key: 'relationship' },
                            ]} 
                            layout="vertical"
                          >
                            <XAxis type="number" domain={[0, 10]} hide />
                            <YAxis dataKey="name" type="category" width={30} tick={{ fontSize: 8, fill: 'hsl(var(--foreground))' }} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {(['lack', 'linear', 'stigma', 'unworthy', 'relationship'] as const).map((key) => (
                                <Cell key={key} fill={beliefColors[key]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 成长对比 - 统一星级显示 */}
                    <div className="p-2 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">📊 成长对比</span>
                        {beliefLayer && beliefLayer.growthStars > 0 && (
                          <span className="font-medium text-emerald-600">
                            +{beliefLayer.growthStars.toFixed(1)}★ 信念松动
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Day 0: {beliefLayer?.baselineStars?.toFixed(1)}★</span>
                        <span>→</span>
                        <span className="font-medium text-violet-700 dark:text-violet-300">当前: {beliefLayer?.currentStars?.toFixed(1)}★</span>
                      </div>
                      {/* 可视化双进度条 */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-1.5 bg-muted rounded-full">
                            <div 
                              className="h-full bg-gray-300 rounded-full transition-all"
                              style={{ width: `${beliefLayer?.baselinePercent || 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Day 0 ({beliefLayer?.baselinePercent || 0}%)</p>
                        </div>
                        <span className="text-muted-foreground text-xs">→</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-muted rounded-full">
                            <div 
                              className="h-full bg-violet-500 rounded-full transition-all"
                              style={{ width: `${beliefLayer?.currentPercent || 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-violet-700 dark:text-violet-300 mt-0.5 font-medium">当前 ({beliefLayer?.currentPercent || 0}%)</p>
                        </div>
                      </div>
                    </div>

                    {/* 新信念收集嵌入 */}
                    {stats?.uniqueNewBeliefs && stats.uniqueNewBeliefs.length > 0 && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50">
                        <h5 className="text-xs font-medium text-green-800 dark:text-green-300 flex items-center gap-1 mb-2">
                          <Sparkles className="w-3 h-3" />
                          我的新信念收集 
                          <span className="text-green-600 dark:text-green-400">({stats.uniqueNewBeliefs.length}条)</span>
                        </h5>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {stats.uniqueNewBeliefs.map((belief, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-green-700 dark:text-green-300">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                              <span className="truncate">"{belief}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                      className="w-full text-xs h-8 text-violet-700 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-900/20"
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
        </div>

        {/* 底部核心洞见 */}
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
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-2">
              行为模式是冰山一角，背后是情绪与信念的驱动。改变行为，需先看见行为背后的能量模式。
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-100"
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

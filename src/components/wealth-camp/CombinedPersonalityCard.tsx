import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Target, 
  Heart, 
  Brain, 
  ChevronDown, 
  ExternalLink,
  Sparkles,
  Zap,
  Star,
  Gift,
  CheckCircle2
} from "lucide-react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [patternExpanded, setPatternExpanded] = useState(false);
  
  const isLoading = layersLoading || baselineLoading || patternLoading;
  
  // Get milestone message based on transformation rate
  const getMilestoneMessage = (rate: number) => {
    if (rate >= 100) return { emoji: "🎊", text: "完美蜕变！你已完成模式转化", color: "text-emerald-300" };
    if (rate >= 75) return { emoji: "🌟", text: "即将突破！再接再厉", color: "text-amber-300" };
    if (rate >= 50) return { emoji: "💪", text: "突破半程！继续保持", color: "text-sky-300" };
    if (rate >= 25) return { emoji: "🌱", text: "初见成效！觉醒正在发生", color: "text-green-300" };
    return { emoji: "🚀", text: "觉醒启程，每一步都算数", color: "text-white/80" };
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
  const behaviorGrowthFactor = (behaviorLayer?.currentStars || 0) / 5; // 0-1 scale
  const fourPoorRadarData = [
    { subject: '嘴穷', baseline: baseline.mouth_score || 0, current: Math.max(0, (baseline.mouth_score || 0) * (1 - behaviorGrowthFactor * 0.3)), fullMark: 15 },
    { subject: '手穷', baseline: baseline.hand_score || 0, current: Math.max(0, (baseline.hand_score || 0) * (1 - behaviorGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '眼穷', baseline: baseline.eye_score || 0, current: Math.max(0, (baseline.eye_score || 0) * (1 - behaviorGrowthFactor * 0.3)), fullMark: 15 },
    { subject: '心穷', baseline: baseline.heart_score || 0, current: Math.max(0, (baseline.heart_score || 0) * (1 - behaviorGrowthFactor * 0.3)), fullMark: 10 },
  ];

  // Emotion radar - approximate from baseline with growth
  const emotionGrowthFactor = (emotionLayer?.currentStars || 0) / 5;
  const emotionRadarData = [
    { subject: '金钱焦虑', baseline: Math.round((baseline.emotion_score || 25) / 5), current: Math.max(0, Math.round((baseline.emotion_score || 25) / 5) * (1 - emotionGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '匮乏恐惧', baseline: Math.round((baseline.emotion_score || 25) / 5), current: Math.max(0, Math.round((baseline.emotion_score || 25) / 5) * (1 - emotionGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '比较自卑', baseline: Math.round((baseline.emotion_score || 25) / 6), current: Math.max(0, Math.round((baseline.emotion_score || 25) / 6) * (1 - emotionGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '羞耻厌恶', baseline: Math.round((baseline.emotion_score || 25) / 6), current: Math.max(0, Math.round((baseline.emotion_score || 25) / 6) * (1 - emotionGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '消费内疚', baseline: Math.round((baseline.emotion_score || 25) / 7), current: Math.max(0, Math.round((baseline.emotion_score || 25) / 7) * (1 - emotionGrowthFactor * 0.3)), fullMark: 10 },
  ];

  // Belief radar - approximate from baseline with growth
  const beliefGrowthFactor = (beliefLayer?.currentStars || 0) / 5;
  const beliefRadarData = [
    { subject: '匮乏感', baseline: Math.round((baseline.belief_score || 20) / 5), current: Math.max(0, Math.round((baseline.belief_score || 20) / 5) * (1 - beliefGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '线性思维', baseline: Math.round((baseline.belief_score || 20) / 5), current: Math.max(0, Math.round((baseline.belief_score || 20) / 5) * (1 - beliefGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '金钱污名', baseline: Math.round((baseline.belief_score || 20) / 5), current: Math.max(0, Math.round((baseline.belief_score || 20) / 5) * (1 - beliefGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '不配得感', baseline: Math.round((baseline.belief_score || 20) / 6), current: Math.max(0, Math.round((baseline.belief_score || 20) / 6) * (1 - beliefGrowthFactor * 0.3)), fullMark: 10 },
    { subject: '关系恐惧', baseline: Math.round((baseline.belief_score || 20) / 7), current: Math.max(0, Math.round((baseline.belief_score || 20) / 7) * (1 - beliefGrowthFactor * 0.3)), fullMark: 10 },
  ];

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
          <div 
            className={cn("rounded-xl overflow-hidden cursor-pointer transition-all", pattern.color)}
            onClick={() => setPatternExpanded(!patternExpanded)}
          >
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
                <ChevronDown className={cn(
                  "w-5 h-5 text-white/70 transition-transform duration-300",
                  patternExpanded && "rotate-180"
                )} />
              </div>
              
              {/* 说明文字 */}
              <div className="p-2 bg-white/15 rounded-lg mb-2">
                <p className="text-white/95 text-xs leading-relaxed">
                  📌 这不是性格，而是你在面对<span className="font-semibold">钱、机会、价格</span>时的自动反应。
                </p>
              </div>
              
              {/* 展开区域 - 详细解读 */}
              <Collapsible open={patternExpanded}>
                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 mb-3"
                  >
                    {/* 模式深度解读 */}
                    <div className="p-2.5 bg-white/10 rounded-lg border border-white/20">
                      <h5 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" />
                        模式深度解读
                      </h5>
                      <p className="text-[11px] text-white/90 leading-relaxed">
                        {pattern.interpretation}
                      </p>
                    </div>
                    
                    {/* 转化路径说明 */}
                    <div className="p-2.5 bg-white/10 rounded-lg border border-white/20">
                      <h5 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        转化路径
                      </h5>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/15 rounded-full">
                          <span>{pattern.emoji}</span>
                          <span className="text-[10px]">{pattern.name}</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-white/40 via-white/60 to-white/40 relative">
                          <motion.div 
                            className="absolute inset-y-0 left-0 bg-white/80"
                            style={{ width: `${transformationRate}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${transformationRate}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/30 rounded-full border border-emerald-400/50">
                          <span>{safePatternConfig.transformation.toEmoji}</span>
                          <span className="text-[10px]">{safePatternConfig.transformation.toName}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        从{pattern.name}转化为{safePatternConfig.transformation.toName}，需要持续的觉察和练习。每一次情绪记录、每一个新信念，都是转化的一步。
                      </p>
                    </div>
                    
                    {/* 你的状态 */}
                    <div className="p-2.5 bg-white/10 rounded-lg border border-white/20">
                      <h5 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        💬 你的状态标签
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {pattern.state.map((item, index) => (
                          <span key={index} className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/95">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* 转化进度 - 增强版 */}
              <div className="pt-2 border-t border-white/20">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/80">🎯 转化进度</span>
                  <span className="flex items-center gap-2">
                    <span className="text-white/60">{safePatternConfig.transformation.from}</span>
                    <span>→</span>
                    <span className="font-semibold">{safePatternConfig.transformation.toName} {safePatternConfig.transformation.toEmoji}</span>
                  </span>
                </div>
                
                {/* 里程碑进度条 */}
                <div className="relative">
                  {/* 里程碑标记 */}
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
                            ? "bg-white border-white shadow-[0_0_6px_rgba(255,255,255,0.6)]" 
                            : "bg-white/30 border-white/50"
                        )}>
                          {transformationRate >= milestone && milestone > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 rounded-full bg-white/30"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 进度条 */}
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mt-3">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-white/60 via-white/80 to-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, transformationRate)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  
                  {/* 里程碑数字 */}
                  <div className="flex justify-between text-[8px] text-white/50 mt-0.5 px-0">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                {/* 动态祝贺提示 */}
                <motion.div 
                  className={cn("flex items-center justify-center gap-1.5 mt-2 py-1.5 rounded-lg bg-white/10", milestoneMessage.color)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span>{milestoneMessage.emoji}</span>
                  <span className="text-[11px] font-medium">{milestoneMessage.text}</span>
                  <span className="text-white font-bold ml-1">{transformationRate}%</span>
                </motion.div>
              </div>
              
              {/* 收起时显示的状态标签 */}
              {!patternExpanded && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  {pattern.state.slice(0, 3).map((item, index) => (
                    <span key={index} className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/95">
                      {item}
                    </span>
                  ))}
                  {pattern.state.length > 3 && (
                    <span className="text-[10px] text-white/60">+{pattern.state.length - 3}</span>
                  )}
                  <span className="text-[10px] text-white/60 ml-auto">点击展开详情</span>
                </div>
              )}
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
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="60%" data={fourPoorRadarData}>
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
                            <span className="text-muted-foreground">Day 0</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-1.5 bg-amber-500 rounded-sm" />
                            <span className="text-foreground font-medium">当前</span>
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
                        <span className="font-medium text-amber-700">当前: {behaviorLayer?.currentStars?.toFixed(1)}★</span>
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
                          <p className="text-[9px] text-amber-700 mt-0.5 font-medium">当前 ({behaviorLayer?.currentPercent || 0}%)</p>
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
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="60%" data={emotionRadarData}>
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
                            <span className="text-muted-foreground">Day 0</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-1.5 bg-pink-500 rounded-sm" />
                            <span className="text-foreground font-medium">当前</span>
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
                        <span className="font-medium text-pink-700">当前: {emotionLayer?.currentStars?.toFixed(1)}★</span>
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
                          <p className="text-[9px] text-pink-700 mt-0.5 font-medium">当前 ({emotionLayer?.currentPercent || 0}%)</p>
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
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="60%" data={beliefRadarData}>
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
                            <span className="text-muted-foreground">Day 0</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-1.5 bg-violet-500 rounded-sm" />
                            <span className="text-foreground font-medium">当前</span>
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
                        <span className="font-medium text-violet-700">当前: {beliefLayer?.currentStars?.toFixed(1)}★</span>
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
                          <p className="text-[9px] text-violet-700 mt-0.5 font-medium">当前 ({beliefLayer?.currentPercent || 0}%)</p>
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

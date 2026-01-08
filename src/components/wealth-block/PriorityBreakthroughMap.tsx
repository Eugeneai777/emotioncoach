import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fourPoorInfo, 
  emotionBlockInfo, 
  beliefBlockInfo,
  FourPoorType,
  EmotionBlockType,
  BeliefBlockType
} from "./wealthBlockData";

interface BlockItem {
  key: string;
  name: string;
  emoji: string;
  score: number;
  maxScore: number;
  category: 'behavior' | 'emotion' | 'belief';
}

interface PriorityBreakthroughMapProps {
  mouthScore: number;
  handScore: number;
  eyeScore: number;
  heartScore: number;
  anxietyScore: number;
  scarcityScore: number;
  comparisonScore: number;
  shameScore: number;
  guiltScore: number;
  lackScore: number;
  linearScore: number;
  stigmaScore: number;
  unworthyScore: number;
  relationshipScore: number;
}

const getSeverity = (score: number, maxScore: number): { level: 'low' | 'medium' | 'high' | 'critical'; color: string; label: string } => {
  const percentage = (score / maxScore) * 100;
  if (percentage <= 30) return { level: 'low', color: 'text-emerald-500', label: '健康' };
  if (percentage <= 50) return { level: 'medium', color: 'text-amber-500', label: '轻度' };
  if (percentage <= 75) return { level: 'high', color: 'text-orange-500', label: '中度' };
  return { level: 'critical', color: 'text-rose-500', label: '需关注' };
};

const getProgressPotential = (score: number, maxScore: number): number => {
  return maxScore - score;
};

export function PriorityBreakthroughMap({
  mouthScore, handScore, eyeScore, heartScore,
  anxietyScore, scarcityScore, comparisonScore, shameScore, guiltScore,
  lackScore, linearScore, stigmaScore, unworthyScore, relationshipScore
}: PriorityBreakthroughMapProps) {
  // Build all blocks with scores
  const allBlocks: BlockItem[] = [
    // Behavior layer
    { key: 'mouth', name: fourPoorInfo.mouth.name, emoji: fourPoorInfo.mouth.emoji, score: mouthScore, maxScore: 15, category: 'behavior' },
    { key: 'hand', name: fourPoorInfo.hand.name, emoji: fourPoorInfo.hand.emoji, score: handScore, maxScore: 10, category: 'behavior' },
    { key: 'eye', name: fourPoorInfo.eye.name, emoji: fourPoorInfo.eye.emoji, score: eyeScore, maxScore: 15, category: 'behavior' },
    { key: 'heart', name: fourPoorInfo.heart.name, emoji: fourPoorInfo.heart.emoji, score: heartScore, maxScore: 10, category: 'behavior' },
    // Emotion layer
    { key: 'anxiety', name: emotionBlockInfo.anxiety.name, emoji: emotionBlockInfo.anxiety.emoji, score: anxietyScore, maxScore: 10, category: 'emotion' },
    { key: 'scarcity', name: emotionBlockInfo.scarcity.name, emoji: emotionBlockInfo.scarcity.emoji, score: scarcityScore, maxScore: 10, category: 'emotion' },
    { key: 'comparison', name: emotionBlockInfo.comparison.name, emoji: emotionBlockInfo.comparison.emoji, score: comparisonScore, maxScore: 10, category: 'emotion' },
    { key: 'shame', name: emotionBlockInfo.shame.name, emoji: emotionBlockInfo.shame.emoji, score: shameScore, maxScore: 10, category: 'emotion' },
    { key: 'guilt', name: emotionBlockInfo.guilt.name, emoji: emotionBlockInfo.guilt.emoji, score: guiltScore, maxScore: 10, category: 'emotion' },
    // Belief layer
    { key: 'lack', name: beliefBlockInfo.lack.name, emoji: beliefBlockInfo.lack.emoji, score: lackScore, maxScore: 10, category: 'belief' },
    { key: 'linear', name: beliefBlockInfo.linear.name, emoji: beliefBlockInfo.linear.emoji, score: linearScore, maxScore: 10, category: 'belief' },
    { key: 'stigma', name: beliefBlockInfo.stigma.name, emoji: beliefBlockInfo.stigma.emoji, score: stigmaScore, maxScore: 10, category: 'belief' },
    { key: 'unworthy', name: beliefBlockInfo.unworthy.name, emoji: beliefBlockInfo.unworthy.emoji, score: unworthyScore, maxScore: 10, category: 'belief' },
    { key: 'relationship', name: beliefBlockInfo.relationship.name, emoji: beliefBlockInfo.relationship.emoji, score: relationshipScore, maxScore: 10, category: 'belief' },
  ];

  // Sort by severity (score percentage)
  const sortedBlocks = [...allBlocks].sort((a, b) => {
    const aPercentage = (a.score / a.maxScore);
    const bPercentage = (b.score / b.maxScore);
    return bPercentage - aPercentage;
  });

  // Only show Top 3 priority blocks (simplified)
  const topPriority = sortedBlocks.slice(0, 3);

  const categoryColors = {
    behavior: 'bg-amber-500/10 border-amber-500/30',
    emotion: 'bg-pink-500/10 border-pink-500/30',
    belief: 'bg-purple-500/10 border-purple-500/30'
  };

  const categoryLabels = {
    behavior: '行为',
    emotion: '情绪',
    belief: '信念'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>🗺️</span>
            <span>你的突破优先级</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top 3 Priority */}
          <div className="space-y-2">
            {topPriority.map((block, index) => {
              const severity = getSeverity(block.score, block.maxScore);
              const progressPotential = getProgressPotential(block.score, block.maxScore);
              return (
                <motion.div
                  key={block.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={cn(
                    "p-3 rounded-xl border",
                    categoryColors[block.category]
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-xl">{block.emoji}</span>
                      <div>
                        <span className="font-medium">{block.name}</span>
                        <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded", severity.color, "bg-current/10")}>
                          {severity.label}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{block.score}/{block.maxScore}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{categoryLabels[block.category]}层</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      进步空间 {progressPotential}分
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        severity.level === 'critical' ? "bg-rose-500" :
                        severity.level === 'high' ? "bg-orange-500" :
                        severity.level === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${(block.score / block.maxScore) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Tip */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/50">
            <p className="text-xs text-amber-700 text-center">
              💡 这是你最需要关注的 <span className="font-semibold">Top 3 卡点</span>，训练营将重点突破
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

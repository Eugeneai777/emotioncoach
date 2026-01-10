import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useSmartAchievementRecommendation, SmartAchievementRecommendation } from '@/hooks/useSmartAchievementRecommendation';
import { Target, Zap, TrendingUp, ArrowRight, Sparkles, Clock, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AchievementMilestoneHintProps {
  campId?: string;
  currentDay?: number;
  className?: string;
}

export function AchievementMilestoneHint({ campId, currentDay = 1, className }: AchievementMilestoneHintProps) {
  const { recommendations, topRecommendation, isLoading } = useSmartAchievementRecommendation({
    campId,
    currentDay,
    maxRecommendations: 2,
  });

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'milestone': return 'from-amber-400 to-orange-500';
      case 'streak': return 'from-orange-400 to-red-500';
      case 'growth': return 'from-violet-400 to-purple-500';
      case 'social': return 'from-emerald-400 to-teal-500';
      default: return 'from-amber-400 to-orange-500';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'milestone': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'streak': return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
      case 'growth': return 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800';
      case 'social': return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    }
  };

  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'milestone': return 'text-amber-700 dark:text-amber-300';
      case 'streak': return 'text-orange-700 dark:text-orange-300';
      case 'growth': return 'text-violet-700 dark:text-violet-300';
      case 'social': return 'text-emerald-700 dark:text-emerald-300';
      default: return 'text-amber-700 dark:text-amber-300';
    }
  };

  const getDifficultyLabel = (score: number) => {
    if (score <= 20) return { text: '很容易', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
    if (score <= 40) return { text: '较容易', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300' };
    if (score <= 60) return { text: '中等', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
    if (score <= 80) return { text: '较难', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' };
    return { text: '挑战', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  };

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      {/* Header with smart recommendation indicator */}
      <div className="px-3 py-2 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-rose-950/30 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-200">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              🎯
            </motion.span>
            智能推荐
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>基于你的进度动态调整</span>
          </div>
        </div>
      </div>

      <CardContent className="p-2.5 space-y-2">
        <AnimatePresence>
          {recommendations.map((achievement, index) => {
            const difficultyInfo = getDifficultyLabel(achievement.difficultyScore);
            const isTop = index === 0;

            return (
              <motion.div
                key={achievement.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative p-2.5 rounded-lg border transition-all",
                  getCategoryBg(achievement.category),
                  isTop && "ring-1 ring-amber-300 dark:ring-amber-700"
                )}
              >
                {/* Priority badge for top recommendation */}
                {isTop && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold shadow-sm"
                    >
                      TOP 1
                    </motion.div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  {/* Animated icon with glow */}
                  <motion.div
                    className={cn(
                      "relative w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0",
                      "bg-gradient-to-br shadow-md",
                      getCategoryColor(achievement.category)
                    )}
                    animate={isTop ? { scale: [1, 1.08, 1] } : undefined}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isTop && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-white/30"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    <span className="relative z-10">{achievement.icon}</span>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    {/* Title row with difficulty and probability */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{achievement.name}</span>
                        <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", difficultyInfo.color)}>
                          {difficultyInfo.text}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Percent className="w-2.5 h-2.5" />
                        <span className={cn("font-medium", getCategoryTextColor(achievement.category))}>
                          {achievement.unlockProbability}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar with gradient */}
                    <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden mb-1.5">
                      <motion.div
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                          getCategoryColor(achievement.category)
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progressPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium", getCategoryTextColor(achievement.category))}>
                          {achievement.currentProgress}/{achievement.targetProgress}{achievement.unit}
                        </span>
                        {achievement.estimatedDays < 999 && (
                          <span className="flex items-center gap-0.5 text-muted-foreground">
                            <Clock className="w-2.5 h-2.5" />
                            约{achievement.estimatedDays}天
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground italic">
                        {achievement.priorityReason}
                      </span>
                    </div>

                    {/* Action guidance */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Zap className="w-2.5 h-2.5 text-amber-500" />
                      <span>{achievement.primaryAction}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                      <span className={cn("font-medium", getCategoryTextColor(achievement.category))}>
                        {achievement.motivationalText}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

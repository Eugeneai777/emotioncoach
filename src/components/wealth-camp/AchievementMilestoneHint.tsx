import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useWealthJournalEntries } from '@/hooks/useWealthJournalEntries';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { Target, Flame, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementProgress {
  key: string;
  name: string;
  icon: string;
  description: string;
  progress: number; // 0-100
  current: number;
  target: number;
  unit: string;
  category: 'milestone' | 'streak' | 'growth' | 'social';
  remainingText: string;
  actionHint: string;
  impactPreview: string;
}

interface AchievementMilestoneHintProps {
  campId?: string;
  currentDay?: number;
  className?: string;
}

export function AchievementMilestoneHint({ campId, currentDay = 1, className }: AchievementMilestoneHintProps) {
  const { hasAchievement, isLoading } = useUserAchievements();
  const { stats } = useWealthJournalEntries({ campId });
  const { progress: awakeningProgress } = useAwakeningProgress();

  // Calculate streak from stats
  const currentStreak = stats?.totalDays || 0;
  const currentAwakening = awakeningProgress?.current_awakening || 0;

  // Find achievements that are close to being unlocked (progress >= 50%)
  const getNearbyAchievements = (): AchievementProgress[] => {
    const nearby: AchievementProgress[] = [];

    // Check milestone achievements
    if (!hasAchievement('day1_complete') && currentDay >= 1) {
      nearby.push({
        key: 'day1_complete',
        name: '第一步',
        icon: '👣',
        description: '完成Day 1训练',
        progress: 80,
        current: 0,
        target: 1,
        unit: '天',
        category: 'milestone',
        remainingText: '即刻可解锁',
        actionHint: '完成今日教练梳理',
        impactPreview: '解锁 +1 成就',
      });
    }

    if (!hasAchievement('day3_halfway') && currentDay >= 2 && currentDay < 4) {
      const remaining = 3 - currentDay;
      nearby.push({
        key: 'day3_halfway',
        name: '中途不弃',
        icon: '💪',
        description: '完成Day 3训练',
        progress: Math.round((currentDay / 3) * 100),
        current: currentDay,
        target: 3,
        unit: '天',
        category: 'milestone',
        remainingText: `还差 ${remaining} 天`,
        actionHint: '坚持完成每日打卡',
        impactPreview: `→ 进度 ${Math.round((1/3)*100)}%`,
      });
    }

    if (!hasAchievement('camp_graduate') && currentDay >= 4 && currentDay < 8) {
      const remaining = 7 - currentDay;
      nearby.push({
        key: 'camp_graduate',
        name: '7天觉醒者',
        icon: '🎓',
        description: '完成财富觉醒训练营',
        progress: Math.round((currentDay / 7) * 100),
        current: currentDay,
        target: 7,
        unit: '天',
        category: 'milestone',
        remainingText: `还差 ${remaining} 天`,
        actionHint: '继续完成训练营',
        impactPreview: `→ 进度 ${Math.round((1/7)*100)}%`,
      });
    }

    // Check streak achievements
    if (!hasAchievement('streak_3') && currentStreak >= 1 && currentStreak < 3) {
      const remaining = 3 - currentStreak;
      nearby.push({
        key: 'streak_3',
        name: '三日坚持',
        icon: '🔥',
        description: '连续打卡3天',
        progress: Math.round((currentStreak / 3) * 100),
        current: currentStreak,
        target: 3,
        unit: '天',
        category: 'streak',
        remainingText: `还差 ${remaining} 天`,
        actionHint: '今日继续打卡',
        impactPreview: `→ 连续 +1 天`,
      });
    }

    if (!hasAchievement('streak_7') && hasAchievement('streak_3') && currentStreak >= 4 && currentStreak < 7) {
      const remaining = 7 - currentStreak;
      nearby.push({
        key: 'streak_7',
        name: '周周精进',
        icon: '🔥',
        description: '连续打卡7天',
        progress: Math.round((currentStreak / 7) * 100),
        current: currentStreak,
        target: 7,
        unit: '天',
        category: 'streak',
        remainingText: `还差 ${remaining} 天`,
        actionHint: '保持连续打卡',
        impactPreview: `→ 连续 +1 天`,
      });
    }

    // Check awakening achievement
    if (!hasAchievement('awakening_80') && currentAwakening >= 50 && currentAwakening < 80) {
      const remaining = Math.round(80 - currentAwakening);
      nearby.push({
        key: 'awakening_80',
        name: '高度觉醒',
        icon: '🌈',
        description: '觉醒指数达到80+',
        progress: Math.round((currentAwakening / 80) * 100),
        current: Math.round(currentAwakening),
        target: 80,
        unit: '',
        category: 'growth',
        remainingText: `还差 ${remaining} 点`,
        actionHint: '提升每日三层评分',
        impactPreview: `→ 觉醒 +${Math.min(10, remaining)} 点`,
      });
    }

    // Sort by progress (highest first) and take top 2
    return nearby.sort((a, b) => b.progress - a.progress).slice(0, 2);
  };

  const nearbyAchievements = getNearbyAchievements();

  if (isLoading || nearbyAchievements.length === 0) {
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

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b">
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-200">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            🎯
          </motion.span>
          即将解锁
        </div>
      </div>
      <CardContent className="p-2.5 space-y-2">
        <AnimatePresence>
          {nearbyAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-2.5 rounded-lg border",
                getCategoryBg(achievement.category)
              )}
            >
              <div className="flex items-start gap-2.5">
                {/* Animated icon */}
                <motion.div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0",
                    "bg-gradient-to-br shadow-sm",
                    getCategoryColor(achievement.category)
                  )}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {achievement.icon}
                </motion.div>

                <div className="flex-1 min-w-0">
                  {/* Title + progress */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{achievement.name}</span>
                    <span className={cn("text-xs font-medium", getCategoryTextColor(achievement.category))}>
                      {achievement.current}/{achievement.target}{achievement.unit}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mb-1.5">
                    <motion.div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        getCategoryColor(achievement.category)
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${achievement.progress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>

                  {/* Action hint with specific info */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={cn("font-medium", getCategoryTextColor(achievement.category))}>
                      💡 {achievement.remainingText}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      {achievement.actionHint}
                      <ArrowRight className="w-2.5 h-2.5" />
                      <span className={getCategoryTextColor(achievement.category)}>
                        {achievement.impactPreview}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

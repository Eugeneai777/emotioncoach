import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useWealthJournalEntries } from '@/hooks/useWealthJournalEntries';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { Target, Flame, TrendingUp, Sparkles } from 'lucide-react';
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
      // Already at day 1, just need to complete it
      nearby.push({
        key: 'day1_complete',
        name: '第一步',
        icon: '👣',
        description: '完成今日教练梳理',
        progress: 80,
        current: 0,
        target: 1,
        unit: '天',
        category: 'milestone',
      });
    }

    if (!hasAchievement('day3_halfway') && currentDay >= 2 && currentDay < 4) {
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
      });
    }

    if (!hasAchievement('camp_graduate') && currentDay >= 5 && currentDay < 8) {
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
      });
    }

    // Check streak achievements
    if (!hasAchievement('streak_3') && currentStreak >= 1 && currentStreak < 3) {
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
      });
    }

    if (!hasAchievement('streak_7') && hasAchievement('streak_3') && currentStreak >= 4 && currentStreak < 7) {
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
      });
    }

    // Check awakening achievement
    if (!hasAchievement('awakening_80') && currentAwakening >= 60 && currentAwakening < 80) {
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'milestone': return <Target className="w-3 h-3" />;
      case 'streak': return <Flame className="w-3 h-3" />;
      case 'growth': return <TrendingUp className="w-3 h-3" />;
      case 'social': return <Sparkles className="w-3 h-3" />;
      default: return <Target className="w-3 h-3" />;
    }
  };

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🏆
          </motion.div>
          即将解锁的成就
        </div>
      </div>
      <CardContent className="p-3 space-y-2">
        <AnimatePresence>
          {nearbyAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-xl border",
                getCategoryBg(achievement.category)
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon with pulse animation */}
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                    "bg-gradient-to-br shadow-md",
                    getCategoryColor(achievement.category)
                  )}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {achievement.icon}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{achievement.name}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1",
                      achievement.category === 'milestone' && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                      achievement.category === 'streak' && "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
                      achievement.category === 'growth' && "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
                      achievement.category === 'social' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                    )}>
                      {getCategoryIcon(achievement.category)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {achievement.description}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r",
                          getCategoryColor(achievement.category)
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {achievement.current}/{achievement.target}{achievement.unit}
                      </span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {achievement.progress}%
                      </span>
                    </div>
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

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock, Sparkles } from 'lucide-react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AchievementBadgeWallProps {
  showUnlocked?: boolean;
  compact?: boolean;
}

export function AchievementBadgeWall({ showUnlocked = true, compact = false }: AchievementBadgeWallProps) {
  const { getAchievementsWithStatus, getAchievementsByCategory, earnedCount, totalCount, isLoading } = useUserAchievements();

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const byCategory = getAchievementsByCategory();
  const earnedAchievements = getAchievementsWithStatus().filter(a => a.earned);

  const categoryConfig = {
    milestone: { label: '里程碑', icon: '🏆', color: 'from-amber-500 to-orange-500' },
    streak: { label: '连续打卡', icon: '🔥', color: 'from-orange-500 to-red-500' },
    growth: { label: '成长突破', icon: '🌟', color: 'from-violet-500 to-purple-500' },
    social: { label: '社交影响', icon: '💫', color: 'from-emerald-500 to-teal-500' },
  };

  const renderAchievementItem = (achievement: ReturnType<typeof getAchievementsWithStatus>[0], index: number) => {
    const isEarned = achievement.earned;
    
    return (
      <motion.div
        key={achievement.key}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="relative group"
      >
        <div
          className={`
            aspect-square rounded-xl flex flex-col items-center justify-center p-2
            transition-all duration-300 cursor-pointer
            ${isEarned
              ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-300 shadow-md hover:shadow-lg hover:scale-105'
              : 'bg-slate-100 border border-slate-200 opacity-40'
            }
          `}
        >
          {isEarned ? (
            <>
              <motion.span 
                className="text-2xl mb-1"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {achievement.icon}
              </motion.span>
              <span className="text-xs text-amber-700 font-medium text-center line-clamp-1 px-1">
                {achievement.name}
              </span>
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 text-slate-400 mb-1" />
              <span className="text-xs text-slate-400 text-center line-clamp-1 px-1">
                {achievement.name}
              </span>
            </>
          )}
        </div>

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none transform group-hover:translate-y-0 translate-y-1">
          <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap min-w-[120px]">
            <div className="font-semibold mb-1 flex items-center gap-1">
              <span>{achievement.icon}</span>
              <span>{achievement.name}</span>
            </div>
            <div className="text-slate-300 text-[11px]">{achievement.description}</div>
            {isEarned && achievement.earnedAt && (
              <div className="text-amber-400 text-[10px] mt-1.5 pt-1.5 border-t border-slate-700">
                ✓ {format(new Date(achievement.earnedAt), 'yyyy年M月d日获得', { locale: zhCN })}
              </div>
            )}
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </div>
      </motion.div>
    );
  };

  if (compact) {
    // Compact mode: only show earned achievements in a row
    if (earnedAchievements.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {earnedAchievements.slice(0, 8).map((ach, i) => (
          <motion.div
            key={ach.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg border border-amber-200 shadow-sm"
          >
            <span className="text-base">{ach.icon}</span>
            <span className="text-xs font-medium text-amber-700">{ach.name}</span>
          </motion.div>
        ))}
        {earnedAchievements.length > 8 && (
          <div className="px-2.5 py-1.5 bg-slate-100 rounded-lg">
            <span className="text-xs text-slate-500">+{earnedAchievements.length - 8}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">成就徽章墙</h3>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            {earnedCount}/{totalCount}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Categories */}
        {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((category) => {
          const config = categoryConfig[category];
          const categoryAchievements = byCategory[category];
          const earnedInCategory = categoryAchievements.filter(a => a.earned).length;

          if (!showUnlocked && earnedInCategory === 0) return null;

          return (
            <div key={category}>
              {/* Category header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {earnedInCategory}/{categoryAchievements.length}
                </span>
              </div>

              {/* Achievement grid */}
              <div className="grid grid-cols-4 gap-3">
                {categoryAchievements
                  .filter(a => showUnlocked || a.earned)
                  .map((achievement, index) => renderAchievementItem(achievement, index))}
              </div>
            </div>
          );
        })}

        {earnedCount === 0 && (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-muted-foreground text-sm">完成训练营任务，解锁专属成就徽章！</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

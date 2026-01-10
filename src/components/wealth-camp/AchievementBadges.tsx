import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Award, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AchievementBadgesProps {
  showLocked?: boolean;
  category?: 'milestone' | 'streak' | 'growth' | 'social' | 'all';
  maxDisplay?: number;
}

export const AchievementBadges = ({ 
  showLocked = false, 
  category = 'all',
  maxDisplay 
}: AchievementBadgesProps) => {
  const { getAchievementsWithStatus, getAchievementsByCategory, earnedCount, totalCount, isLoading } = useUserAchievements();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 bg-muted rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allAchievements = getAchievementsWithStatus();
  const byCategory = getAchievementsByCategory();

  let displayAchievements = category === 'all' 
    ? allAchievements 
    : byCategory[category] || [];

  // 过滤未解锁的
  if (!showLocked) {
    displayAchievements = displayAchievements.filter(a => a.earned);
  }

  // 限制显示数量
  if (maxDisplay) {
    displayAchievements = displayAchievements.slice(0, maxDisplay);
  }

  const categoryLabels = {
    milestone: '里程碑',
    streak: '连续打卡',
    growth: '成长突破',
    social: '社交影响',
    all: '全部',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <span>成就徽章</span>
            {category !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {categoryLabels[category]}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground font-normal">
            {earnedCount}/{totalCount}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-4">
        {displayAchievements.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {showLocked ? '暂无成就' : '完成任务解锁成就'}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {displayAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div 
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center
                    transition-all duration-200
                    ${achievement.earned 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-300 shadow-sm' 
                      : 'bg-slate-100 border border-slate-200 opacity-50'
                    }
                  `}
                >
                  <span className="text-2xl mb-0.5">
                    {achievement.earned ? achievement.icon : <Lock className="h-5 w-5 text-slate-400" />}
                  </span>
                  <span className={`text-xs text-center px-1 line-clamp-1 ${achievement.earned ? 'text-amber-700' : 'text-slate-400'}`}>
                    {achievement.name}
                  </span>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <div className="font-medium mb-1">{achievement.name}</div>
                    <div className="text-slate-300">{achievement.description}</div>
                    {achievement.earned && achievement.earnedAt && (
                      <div className="text-slate-400 text-[10px] mt-1">
                        {format(new Date(achievement.earnedAt), 'yyyy年M月d日获得', { locale: zhCN })}
                      </div>
                    )}
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 查看更多按钮 */}
        {maxDisplay && allAchievements.filter(a => showLocked || a.earned).length > maxDisplay && (
          <div className="text-center mt-3">
            <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              查看全部 {earnedCount} 个成就 →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

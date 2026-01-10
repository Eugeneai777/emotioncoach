import React, { forwardRef } from 'react';
import { Trophy, Sparkles, Award } from 'lucide-react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { cn } from '@/lib/utils';

// Category color mapping
const categoryGradients: Record<string, string> = {
  milestone: 'from-amber-400 to-orange-500',
  streak: 'from-orange-400 to-red-500',
  growth: 'from-violet-400 to-purple-500',
  social: 'from-emerald-400 to-teal-500',
};

const categoryBg: Record<string, string> = {
  milestone: 'bg-gradient-to-br from-amber-100 to-orange-100',
  streak: 'bg-gradient-to-br from-orange-100 to-red-100',
  growth: 'bg-gradient-to-br from-violet-100 to-purple-100',
  social: 'bg-gradient-to-br from-emerald-100 to-teal-100',
};

interface AchievementShareCardProps {
  avatarUrl?: string;
  displayName?: string;
  className?: string;
}

const AchievementShareCard = forwardRef<HTMLDivElement, AchievementShareCardProps>(
  ({ avatarUrl, displayName = '财富觉醒者', className }, ref) => {
    const { getAchievementsWithStatus, earnedCount, totalCount } = useUserAchievements();
    const allAchievements = getAchievementsWithStatus();
    const earnedAchievements = allAchievements.filter(a => a.earned);
    
    // Group by category for display
    const byCategory = {
      milestone: earnedAchievements.filter(a => a.category === 'milestone'),
      streak: earnedAchievements.filter(a => a.category === 'streak'),
      growth: earnedAchievements.filter(a => a.category === 'growth'),
      social: earnedAchievements.filter(a => a.category === 'social'),
    };

    const categoryLabels: Record<string, string> = {
      milestone: '里程碑',
      streak: '坚持',
      growth: '成长',
      social: '社交',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-[340px] rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "shadow-2xl",
          className
        )}
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4">
          {/* Decorative sparkles */}
          <div className="absolute top-3 right-3 text-amber-400/30 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute top-8 right-8 text-purple-400/20 animate-pulse" style={{ animationDelay: '0.5s' }}>
            <Sparkles className="w-4 h-4" />
          </div>
          
          {/* User info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 p-0.5">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-xl">
                  👤
                </div>
              )}
            </div>
            <div>
              <div className="text-white font-bold">{displayName}</div>
              <div className="text-amber-400/80 text-sm flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                财富觉醒成就墙
              </div>
            </div>
          </div>

          {/* Progress stats */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {earnedCount}
              </div>
              <div className="text-xs text-slate-400">已解锁</div>
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-slate-300">{totalCount}</div>
              <div className="text-xs text-slate-400">全部成就</div>
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-400">完成度</div>
            </div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="px-5 pb-4">
          {earnedCount === 0 ? (
            <div className="py-6 text-center">
              <div className="text-4xl mb-2">🌱</div>
              <div className="text-slate-400 text-sm">觉醒之旅刚刚开始</div>
              <div className="text-slate-500 text-xs mt-1">完成任务解锁成就徽章</div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(byCategory).map(([category, achievements]) => {
                if (achievements.length === 0) return null;
                return (
                  <div key={category}>
                    <div className={cn(
                      "text-xs font-medium mb-2 flex items-center gap-1.5",
                      category === 'milestone' && "text-amber-400",
                      category === 'streak' && "text-orange-400",
                      category === 'growth' && "text-purple-400",
                      category === 'social' && "text-emerald-400",
                    )}>
                      <Award className="w-3 h-3" />
                      {categoryLabels[category]}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {achievements.map((ach) => (
                        <div
                          key={ach.key}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg flex items-center gap-1.5",
                            categoryBg[ach.category]
                          )}
                        >
                          <span className="text-base">{ach.icon}</span>
                          <span className="text-xs font-medium text-slate-700">{ach.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 px-5 py-3 flex items-center justify-between border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-xs">💰</span>
            </div>
            <span className="text-slate-300 text-sm font-medium">有劲AI · 财富教练</span>
          </div>
          <div className="text-slate-500 text-xs">扫码开启觉醒之旅</div>
        </div>
      </div>
    );
  }
);

AchievementShareCard.displayName = 'AchievementShareCard';

export default AchievementShareCard;

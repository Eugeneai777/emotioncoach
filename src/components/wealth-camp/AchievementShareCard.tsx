import React, { forwardRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { achievements as allAchievementsDef } from '@/config/awakeningLevelConfig';
import { cn } from '@/lib/utils';

// Journey map: key milestones in order
const journeyMilestones = [
  { key: 'first_awakening', icon: '🎯', name: '觉醒起点' },
  { key: 'day1_complete', icon: '👣', name: '第一步' },
  { key: 'day3_halfway', icon: '💪', name: '中途不弃' },
  { key: 'camp_graduate', icon: '🎓', name: '7天觉醒者' },
  { key: 'became_partner', icon: '🤝', name: '觉醒引路人' },
];

// Category styling
const categoryStyles: Record<string, { bg: string; border: string }> = {
  milestone: { bg: 'from-amber-400/90 to-orange-400/90', border: 'border-amber-300/50' },
  streak: { bg: 'from-orange-400/90 to-red-400/90', border: 'border-orange-300/50' },
  growth: { bg: 'from-violet-400/90 to-purple-400/90', border: 'border-violet-300/50' },
  social: { bg: 'from-emerald-400/90 to-teal-400/90', border: 'border-emerald-300/50' },
};

const categoryLabels: Record<string, string> = {
  milestone: '里程碑',
  streak: '坚持',
  growth: '成长',
  social: '社交',
};

interface AchievementShareCardProps {
  avatarUrl?: string;
  displayName?: string;
  className?: string;
}

const AchievementShareCard = forwardRef<HTMLDivElement, AchievementShareCardProps>(
  ({ avatarUrl, displayName = '财富觉醒者', className }, ref) => {
    const { getAchievementsWithStatus, earnedCount, totalCount, getAchievementsByCategory } = useUserAchievements();
    const allAchievements = getAchievementsWithStatus();
    const byCategory = getAchievementsByCategory();
    
    // Find next milestone to unlock
    const nextMilestone = journeyMilestones.find(m => {
      const achievement = allAchievements.find(a => a.key === m.key);
      return achievement && !achievement.earned;
    });

    // Check if user has no achievements
    const hasNoAchievements = earnedCount === 0;

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
          <div className="absolute top-3 right-3 text-amber-400/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          
          {/* User info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 p-0.5">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-lg">
                  👤
                </div>
              )}
            </div>
            <div>
              <div className="text-white font-bold text-sm">{displayName}</div>
              <div className="text-amber-400/80 text-xs flex items-center gap-1">
                🏆 财富觉醒成就墙
              </div>
            </div>
          </div>

          {/* Progress stats */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {earnedCount}
              </div>
              <div className="text-[10px] text-slate-400">已解锁</div>
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-slate-300">{totalCount}</div>
              <div className="text-[10px] text-slate-400">全部</div>
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
              </div>
              <div className="text-[10px] text-slate-400">完成度</div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-5 pb-4">
          {hasNoAchievements ? (
            // Journey Map Mode (when no achievements)
            <div className="space-y-3">
              <div className="text-center text-slate-400 text-xs mb-3">
                🌱 觉醒之旅即将开始
              </div>
              
              {/* Visual journey path */}
              <div className="relative py-3">
                <div className="flex items-center justify-between relative">
                  {journeyMilestones.map((milestone, index) => (
                    <div key={milestone.key} className="relative flex flex-col items-center">
                      {/* Connector line */}
                      {index < journeyMilestones.length - 1 && (
                        <div className="absolute top-4 left-[50%] w-[calc(100%+8px)] h-[2px] border-t-2 border-dashed border-slate-600/50" />
                      )}
                      
                      {/* Milestone dot */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-base relative z-10",
                        "bg-slate-700/80 border-2 border-dashed border-slate-500/50"
                      )}>
                        <span className="grayscale opacity-50">{milestone.icon}</span>
                      </div>
                      
                      {/* Label */}
                      <div className="mt-1.5 text-[9px] text-slate-500 text-center w-12 leading-tight">
                        {milestone.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next step hint */}
              {nextMilestone && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-amber-400 text-xs">
                    🎯 下一步：{nextMilestone.name}
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Achievement Display Mode (when has achievements)
            <div className="space-y-2.5">
              {(['milestone', 'streak', 'growth', 'social'] as const).map((category) => {
                const achievements = byCategory[category];
                const earnedInCategory = achievements.filter(a => a.earned);
                
                if (earnedInCategory.length === 0) return null;
                
                const styles = categoryStyles[category];
                
                return (
                  <div key={category}>
                    <div className="text-[10px] text-slate-400 mb-1.5 flex items-center gap-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full bg-gradient-to-r",
                        styles.bg
                      )} />
                      {categoryLabels[category]} ({earnedInCategory.length}/{achievements.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {earnedInCategory.map((ach) => (
                        <div
                          key={ach.key}
                          className={cn(
                            "px-2 py-1 rounded-md flex items-center gap-1",
                            "bg-gradient-to-r",
                            styles.bg,
                            "border",
                            styles.border
                          )}
                        >
                          <span className="text-sm">{ach.icon}</span>
                          <span className="text-[10px] font-medium text-white/90">{ach.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Next goal if not all complete */}
              {earnedCount < totalCount && nextMilestone && (
                <div className="mt-2 p-2 rounded-lg bg-slate-700/30 border border-slate-600/30 text-center">
                  <span className="text-slate-400 text-[10px]">
                    🎯 下一个目标：
                    <span className="text-amber-400 ml-1">{nextMilestone.icon} {nextMilestone.name}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 px-5 py-2.5 flex items-center justify-between border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-[10px]">💰</span>
            </div>
            <span className="text-slate-300 text-xs font-medium">有劲AI · 财富教练</span>
          </div>
          <div className="text-slate-500 text-[10px]">扫码开启觉醒之旅</div>
        </div>
      </div>
    );
  }
);

AchievementShareCard.displayName = 'AchievementShareCard';

export default AchievementShareCard;

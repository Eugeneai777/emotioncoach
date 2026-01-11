import React, { forwardRef, useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useAchievementProgress } from '@/hooks/useAchievementProgress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Path theme colors for share card
const pathThemes = {
  milestone: { 
    bg: 'from-amber-400/90 to-orange-400/90', 
    border: 'border-amber-300/50',
    icon: '🎯',
    name: '里程碑之路'
  },
  streak: { 
    bg: 'from-orange-400/90 to-red-400/90', 
    border: 'border-orange-300/50',
    icon: '🔥',
    name: '坚持之路'
  },
  growth: { 
    bg: 'from-violet-400/90 to-purple-400/90', 
    border: 'border-violet-300/50',
    icon: '🌟',
    name: '成长之路'
  },
  social: { 
    bg: 'from-emerald-400/90 to-teal-400/90', 
    border: 'border-emerald-300/50',
    icon: '💫',
    name: '社交之路'
  },
};

interface AchievementShareCardProps {
  avatarUrl?: string;
  displayName?: string;
  className?: string;
  selectedPath?: string | null; // 'milestone' | 'streak' | 'growth' | 'social' | null (all)
  onPathChange?: (path: string | null) => void;
  showPathSelector?: boolean;
}

const AchievementShareCard = forwardRef<HTMLDivElement, AchievementShareCardProps>(
  ({ avatarUrl, displayName = '财富觉醒者', className, selectedPath = null, onPathChange, showPathSelector = false }, ref) => {
    const { paths, totalEarned, totalCount, overallProgress, globalNextAchievement } = useAchievementProgress();
    
    // 根据选择的路径过滤成就
    const filteredPaths = selectedPath 
      ? paths.filter(p => p.key === selectedPath)
      : paths;
    
    const displayEarnedCount = selectedPath 
      ? filteredPaths[0]?.earnedCount || 0 
      : totalEarned;
    
    const displayTotalCount = selectedPath 
      ? filteredPaths[0]?.totalCount || 0 
      : totalCount;
    
    const displayProgress = displayTotalCount > 0 
      ? Math.round((displayEarnedCount / displayTotalCount) * 100) 
      : 0;

    // Check if user has no achievements
    const hasNoAchievements = totalEarned === 0;

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
          <motion.div 
            className="absolute top-3 right-3 text-amber-400/30"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          
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
                🏅 {selectedPath ? pathThemes[selectedPath as keyof typeof pathThemes]?.name : '财富觉醒成就墙'}
              </div>
            </div>
          </div>

          {/* Progress stats */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {displayEarnedCount}
              </div>
              <div className="text-[10px] text-slate-400">已解锁</div>
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-slate-300">{displayTotalCount}</div>
              <div className="text-[10px] text-slate-400">全部</div>
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {displayProgress}%
              </div>
              <div className="text-[10px] text-slate-400">完成度</div>
            </div>
          </div>
        </div>

        {/* Path Selector (only show in edit mode, not in final render) */}
        {showPathSelector && onPathChange && (
          <div className="px-5 pb-3">
            <div className="text-[10px] text-slate-400 mb-2">选择展示路径：</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onPathChange(null)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] transition-all",
                  !selectedPath 
                    ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white" 
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                )}
              >
                全部成就
              </button>
              {Object.entries(pathThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => onPathChange(key)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] transition-all flex items-center gap-1",
                    selectedPath === key 
                      ? `bg-gradient-to-r ${theme.bg} text-white` 
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                  )}
                >
                  {theme.icon} {theme.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
                <div className="grid grid-cols-5 gap-1">
                  {paths[0]?.achievements.slice(0, 5).map((ach, index) => (
                    <div key={ach.key} className="relative flex flex-col items-center">
                      {/* Connector line */}
                      {index < 4 && (
                        <div className="absolute top-4 left-[50%] w-full h-[2px] border-t-2 border-dashed border-slate-600/50" />
                      )}
                      
                      {/* Milestone dot */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-base relative z-10",
                        "bg-slate-700/80 border-2 border-dashed border-slate-500/50"
                      )}>
                        <span className="grayscale opacity-50">{ach.icon}</span>
                      </div>
                      
                      {/* Label */}
                      <div className="mt-1.5 text-[8px] text-slate-500 text-center w-12 leading-tight truncate">
                        {ach.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next step hint */}
              {globalNextAchievement && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-amber-400 text-xs">
                    🎯 下一步：{globalNextAchievement.achievement.icon} {globalNextAchievement.achievement.name}
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Achievement Display Mode (when has achievements)
            <div className="space-y-2.5">
              {filteredPaths.map((path) => {
                const earnedAchievements = path.achievements.filter(a => a.earned);
                
                if (earnedAchievements.length === 0) return null;
                
                const theme = pathThemes[path.key as keyof typeof pathThemes];
                
                return (
                  <div key={path.key}>
                    <div className="text-[10px] text-slate-400 mb-1.5 flex items-center gap-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full bg-gradient-to-r",
                        theme.bg
                      )} />
                      {theme.name} ({earnedAchievements.length}/{path.totalCount})
                    </div>
                    
                    {/* Progress dots */}
                    <div className="flex items-center gap-0.5 mb-2">
                      {path.achievements.map((ach, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            ach.earned 
                              ? `bg-gradient-to-r ${theme.bg}` 
                              : "bg-slate-700/50 border border-slate-600/50"
                          )}
                        />
                      ))}
                    </div>
                    
                    {/* Earned achievements */}
                    <div className="flex flex-wrap gap-1.5">
                      {earnedAchievements.map((ach) => (
                        <div
                          key={ach.key}
                          className={cn(
                            "px-2 py-1 rounded-md flex items-center gap-1",
                            "bg-gradient-to-r",
                            theme.bg,
                            "border",
                            theme.border
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
              {totalEarned < totalCount && globalNextAchievement && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-2.5 rounded-lg bg-slate-700/30 border border-slate-600/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">🎯 下一个目标：</span>
                      <span className="text-amber-400 text-xs font-medium">
                        {globalNextAchievement.achievement.icon} {globalNextAchievement.achievement.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </div>
                  {/* Mini progress */}
                  <div className="mt-1.5 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${globalNextAchievement.progress}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[9px] text-slate-500 text-right">
                    {globalNextAchievement.remainingText}
                  </div>
                </motion.div>
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

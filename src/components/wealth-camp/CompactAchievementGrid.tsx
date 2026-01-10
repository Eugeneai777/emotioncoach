import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Share2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import WealthInviteCardDialog from './WealthInviteCardDialog';

// Category configuration with colors and labels
const categoryConfig: Record<string, { 
  label: string; 
  bgUnlocked: string;
  bgLocked: string;
  border: string;
  text: string;
  gradient: string;
}> = {
  milestone: { 
    label: '里程碑',
    bgUnlocked: 'bg-gradient-to-br from-amber-100 to-orange-100',
    bgLocked: 'bg-amber-50/50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    gradient: 'from-amber-400 to-orange-500'
  },
  streak: { 
    label: '坚持',
    bgUnlocked: 'bg-gradient-to-br from-orange-100 to-red-100',
    bgLocked: 'bg-orange-50/50',
    border: 'border-orange-200',
    text: 'text-orange-600',
    gradient: 'from-orange-400 to-red-500'
  },
  growth: { 
    label: '成长',
    bgUnlocked: 'bg-gradient-to-br from-violet-100 to-purple-100',
    bgLocked: 'bg-violet-50/50',
    border: 'border-violet-200',
    text: 'text-violet-600',
    gradient: 'from-violet-400 to-purple-500'
  },
  social: { 
    label: '社交',
    bgUnlocked: 'bg-gradient-to-br from-emerald-100 to-teal-100',
    bgLocked: 'bg-emerald-50/50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    gradient: 'from-emerald-400 to-teal-500'
  },
};

interface CompactAchievementGridProps {
  className?: string;
}

export function CompactAchievementGrid({ className }: CompactAchievementGridProps) {
  const { getAchievementsByCategory, earnedCount, totalCount, isLoading } = useUserAchievements();
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const achievementsByCategory = getAchievementsByCategory();
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <Card className={cn("shadow-sm overflow-hidden", className)}>
        <div className="p-4 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
          </motion.div>
        </div>
      </Card>
    );
  }

  const categories = ['milestone', 'streak', 'growth', 'social'] as const;

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      {/* Header with rainbow progress bar */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-amber-50/80 via-pink-50/80 to-violet-50/80 border-b">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-sm flex items-center gap-1.5">
            🏅 成就徽章
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                {earnedCount}
              </span>
              <span className="text-xs text-muted-foreground">/ {totalCount}</span>
              <span className="text-xs text-muted-foreground ml-1">({progressPercent}%)</span>
            </div>
            {earnedCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
        {/* Rainbow gradient progress bar */}
        <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <CardContent className="p-2.5 space-y-2">
        <TooltipProvider delayDuration={100}>
          {/* Categorized horizontal rows */}
          {categories.map((categoryKey) => {
            const config = categoryConfig[categoryKey];
            const achievements = achievementsByCategory[categoryKey];
            const earnedInCategory = achievements.filter(a => a.earned).length;

            return (
              <div key={categoryKey} className="flex items-center gap-2">
                {/* Category label with count */}
                <div className={cn(
                  "shrink-0 w-[52px] text-[10px] font-medium flex flex-col items-center",
                  config.text
                )}>
                  <span>{config.label}</span>
                  <span className="text-[9px] opacity-70">{earnedInCategory}/{achievements.length}</span>
                </div>

                {/* Achievement icons row */}
                <div className="flex gap-1.5 flex-1">
                  {achievements.map((achievement, index) => {
                    const isEarned = achievement.earned;

                    return (
                      <Tooltip key={achievement.key}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.02 }}
                            whileHover={{ scale: 1.15, y: -2 }}
                            className="relative cursor-pointer"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-base relative overflow-hidden",
                              "transition-all duration-200 border",
                              isEarned ? [
                                config.bgUnlocked,
                                config.border,
                                "shadow-sm",
                              ] : [
                                config.bgLocked,
                                "border-dashed",
                                config.border,
                              ]
                            )}>
                              {/* Shimmer effect for earned */}
                              {isEarned && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-tr from-white/50 via-transparent to-transparent"
                                  animate={{ x: ['0%', '100%'] }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                />
                              )}
                              
                              {/* Icon with conditional styling */}
                              <span className={cn(
                                "relative z-10 drop-shadow-sm transition-all duration-200",
                                !isEarned && "grayscale opacity-40 hover:grayscale-0 hover:opacity-70"
                              )}>
                                {achievement.icon}
                              </span>
                            </div>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className={cn(
                            "px-2.5 py-1.5 max-w-[160px]",
                            isEarned 
                              ? `bg-gradient-to-r ${config.gradient} text-white border-0` 
                              : "bg-slate-800 text-white border-0"
                          )}
                        >
                          <div className="text-center">
                            <div className="font-medium text-xs flex items-center justify-center gap-1">
                              {achievement.icon} {achievement.name}
                            </div>
                            <div className="text-[10px] opacity-90 mt-0.5">
                              {achievement.description}
                            </div>
                            {isEarned ? (
                              <div className="text-[10px] opacity-75 mt-1 pt-1 border-t border-white/20">
                                ✓ 已解锁
                              </div>
                            ) : (
                              <div className="text-[10px] opacity-75 mt-1 pt-1 border-t border-white/20">
                                🔒 待解锁
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TooltipProvider>

        {/* Celebration message when all earned */}
        <AnimatePresence>
          {earnedCount === totalCount && totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 py-2 rounded-lg bg-gradient-to-r from-amber-100 via-pink-100 to-violet-100 text-center"
            >
              <span className="text-xs font-medium bg-gradient-to-r from-amber-600 via-pink-600 to-violet-600 bg-clip-text text-transparent">
                🎉 全部成就已解锁！
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {/* Share Dialog */}
      <WealthInviteCardDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        defaultTab="achievement"
      />
    </Card>
  );
}

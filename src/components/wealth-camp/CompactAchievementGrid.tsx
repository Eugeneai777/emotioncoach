import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Trophy, Lock, Sparkles, Target, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import WealthInviteCardDialog from './WealthInviteCardDialog';

// Category color mapping for unlocked achievements
const categoryStyles: Record<string, { bg: string; border: string; gradient: string }> = {
  milestone: { 
    bg: 'bg-gradient-to-br from-amber-100 to-orange-100', 
    border: 'border-amber-300',
    gradient: 'from-amber-400 to-orange-500'
  },
  streak: { 
    bg: 'bg-gradient-to-br from-orange-100 to-red-100', 
    border: 'border-orange-300',
    gradient: 'from-orange-400 to-red-500'
  },
  growth: { 
    bg: 'bg-gradient-to-br from-violet-100 to-purple-100', 
    border: 'border-violet-300',
    gradient: 'from-violet-400 to-purple-500'
  },
  social: { 
    bg: 'bg-gradient-to-br from-emerald-100 to-teal-100', 
    border: 'border-emerald-300',
    gradient: 'from-emerald-400 to-teal-500'
  },
};

// Priority order for next goal suggestion
const goalPriority = [
  'day1_complete', 'day3_halfway', 'camp_graduate',
  'streak_3', 'streak_7',
  'behavior_breakthrough', 'emotion_breakthrough', 'belief_breakthrough',
  'became_partner', 'first_invite',
  'streak_14', 'all_layer_master', 'awakening_80',
  'first_share', 'team_5', 'team_10', 'streak_30'
];

interface CompactAchievementGridProps {
  className?: string;
}

export function CompactAchievementGrid({ className }: CompactAchievementGridProps) {
  const { getAchievementsWithStatus, earnedCount, totalCount, isLoading } = useUserAchievements();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const allAchievements = getAchievementsWithStatus();
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;
  
  // Find next goal based on priority
  const nextGoal = goalPriority
    .map(key => allAchievements.find(a => a.key === key))
    .find(a => a && !a.earned);

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

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      {/* Header with rainbow progress bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50/80 via-pink-50/80 to-violet-50/80">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            成就徽章
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                {earnedCount}
              </span>
              <span className="text-xs text-muted-foreground">/ {totalCount}</span>
            </div>
            {earnedCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
        {/* Rainbow gradient progress bar */}
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              backgroundSize: '200% 100%',
              animation: 'rainbow-flow 3s ease infinite',
            }}
          />
        </div>
      </div>

      <CardContent className="p-3">
        <TooltipProvider delayDuration={200}>
          {/* Compact 6-column grid */}
          <div className="grid grid-cols-6 gap-2">
            {allAchievements.map((achievement, index) => {
              const styles = categoryStyles[achievement.category] || categoryStyles.milestone;
              const isEarned = achievement.earned;
              const isHovered = hoveredKey === achievement.key;

              return (
                <Tooltip key={achievement.key}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: index * 0.03,
                        type: 'spring',
                        stiffness: 300,
                        damping: 20
                      }}
                      whileHover={{ scale: 1.15 }}
                      onHoverStart={() => setHoveredKey(achievement.key)}
                      onHoverEnd={() => setHoveredKey(null)}
                      className="relative cursor-pointer"
                    >
                      <div className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-xl relative overflow-hidden",
                        "transition-all duration-300 border-2",
                        isEarned ? [
                          styles.bg,
                          styles.border,
                          "shadow-md",
                        ] : [
                          "bg-slate-100/80 dark:bg-slate-800/50",
                          "border-slate-200/50 dark:border-slate-700/50",
                        ]
                      )}>
                        {/* Sparkle effect for earned */}
                        {isEarned && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent"
                            animate={{ 
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                        
                        {/* Icon */}
                        <span className={cn(
                          "relative z-10 drop-shadow-sm",
                          !isEarned && "grayscale opacity-50"
                        )}>
                          {achievement.icon}
                        </span>
                        
                        {/* Lock indicator for unearned */}
                        {!isEarned && (
                          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-300/80 dark:bg-slate-600/80 flex items-center justify-center">
                            <Lock className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                          </div>
                        )}
                        
                        {/* Pulse ring for earned achievements */}
                        {isEarned && isHovered && (
                          <motion.div
                            className={cn(
                              "absolute inset-0 rounded-xl border-2",
                              styles.border
                            )}
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.8, 0, 0.8]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className={cn(
                      "px-3 py-2 max-w-[180px]",
                      isEarned 
                        ? `bg-gradient-to-r ${styles.gradient} text-white border-0` 
                        : "bg-slate-800 text-white border-0"
                    )}
                  >
                    <div className="text-center">
                      <div className="font-semibold text-sm flex items-center justify-center gap-1">
                        {achievement.icon} {achievement.name}
                      </div>
                      <div className="text-xs opacity-90 mt-0.5">
                        {achievement.description}
                      </div>
                      {isEarned && achievement.earnedAt && (
                        <div className="text-xs opacity-75 mt-1 border-t border-white/20 pt-1">
                          ✓ 已解锁
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Next goal highlight */}
        <AnimatePresence>
          {nextGoal && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.5 }}
              className="mt-3"
            >
              <div className={cn(
                "p-2.5 rounded-xl border",
                "bg-gradient-to-r from-amber-50/80 to-orange-50/80",
                "border-amber-200/50"
              )}>
                <div className="flex items-center gap-2.5">
                  {/* Animated target icon */}
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-md"
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {nextGoal.icon}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-amber-900 truncate">
                      {nextGoal.name}
                    </div>
                    <div className="text-xs text-amber-700/80 truncate">
                      {nextGoal.description}
                    </div>
                  </div>
                  
                  <Badge className="shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm">
                    <Target className="w-3 h-3 mr-1" />
                    下一个
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration message when all earned */}
        {earnedCount === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-100 via-pink-100 to-violet-100 text-center"
          >
            <div className="text-lg mb-1">🎉</div>
            <div className="font-semibold text-sm bg-gradient-to-r from-amber-600 via-pink-600 to-violet-600 bg-clip-text text-transparent">
              恭喜！全部成就已解锁！
            </div>
          </motion.div>
        )}
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

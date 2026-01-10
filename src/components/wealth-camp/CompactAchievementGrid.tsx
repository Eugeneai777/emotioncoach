import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Share2, ChevronRight, Sparkles, Target, Crown } from 'lucide-react';
import { useAchievementProgress, AchievementProgressNode } from '@/hooks/useAchievementProgress';
import WealthInviteCardDialog from './WealthInviteCardDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CompactAchievementGridProps {
  className?: string;
}

// 成就节点组件
function AchievementNodeItem({ 
  achievement, 
  index,
  theme,
  showLevel = false,
}: { 
  achievement: AchievementProgressNode;
  index: number;
  theme: {
    gradient: string;
    bgActive: string;
    bgLocked: string;
    border: string;
    text: string;
  };
  showLevel?: boolean;
}) {
  const isEarned = achievement.earned;
  const isNext = achievement.isNext;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative"
        >
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-lg relative overflow-hidden transition-all duration-300",
              isEarned && [theme.bgActive, 'border', theme.border, 'shadow-sm'],
              !isEarned && !isNext && [theme.bgLocked, 'border border-dashed border-muted-foreground/30'],
              isNext && ['border-2 border-dashed', theme.border, 'bg-gradient-to-br from-white/50 to-white/30 dark:from-slate-800/50 dark:to-slate-700/30']
            )}
          >
            {/* 已完成的光效 */}
            {isEarned && (
              <motion.div
                className={cn("absolute inset-0 bg-gradient-to-tr opacity-30", theme.gradient)}
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            {/* 下一个目标的脉冲效果 */}
            {isNext && (
              <>
                <motion.div
                  className={cn("absolute inset-0 rounded-xl bg-gradient-to-tr", theme.gradient)}
                  animate={{ opacity: [0.1, 0.25, 0.1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className={cn("absolute -inset-1 rounded-xl bg-gradient-to-tr opacity-20", theme.gradient)}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </>
            )}

            {/* 图标 */}
            <span className={cn(
              "relative z-10 transition-all duration-300",
              !isEarned && !isNext && "grayscale opacity-40",
              isNext && "grayscale-0 opacity-80"
            )}>
              {achievement.icon}
            </span>

            {/* 已完成徽章 */}
            {isEarned && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm"
              >
                <span className="text-[8px] text-white">✓</span>
              </motion.div>
            )}

            {/* 等级标签 */}
            {showLevel && achievement.mappedLevel && (
              <div className={cn(
                "absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 rounded",
                isEarned ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                L{achievement.mappedLevel}
              </div>
            )}
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{achievement.icon}</span>
            <span className="font-semibold text-sm">{achievement.name}</span>
            {achievement.mappedLevel && (
              <span className="text-[10px] px-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                Lv{achievement.mappedLevel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
          <div className="pt-1 border-t border-border/50">
            {isEarned ? (
              <span className="text-xs text-emerald-500 font-medium">✓ 已解锁</span>
            ) : (
              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className={cn("font-medium", theme.text)}>{achievement.remainingText}</span>
                  <span className="text-muted-foreground">{achievement.current}/{achievement.target}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full bg-gradient-to-r", theme.gradient)}
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">💡 {achievement.dailyTaskHint}</p>
              </div>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// 连接线组件
function ConnectionLine({ isActive, theme }: { isActive: boolean; theme: { gradient: string } }) {
  return (
    <div className="relative w-3 flex items-center justify-center">
      <div className={cn(
        "w-full h-0.5 rounded-full",
        isActive ? cn("bg-gradient-to-r", theme.gradient) : "bg-muted-foreground/20 border-t border-dashed border-muted-foreground/30"
      )} />
      {isActive && (
        <motion.div
          className={cn("absolute inset-0 rounded-full bg-gradient-to-r opacity-50", theme.gradient)}
          animate={{ x: [-12, 12, -12] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: '4px', height: '2px' }}
        />
      )}
    </div>
  );
}

export function CompactAchievementGrid({ className }: CompactAchievementGridProps) {
  const { paths, isLoading, totalEarned, totalCount, overallProgress, ultimateGoalProgress } = useAchievementProgress();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardContent className="p-4 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      {/* 头部：标题 + 进度 + 分享 */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-border/50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-base"
            >
              🏅
            </motion.span>
            <span className="font-semibold text-sm">成就之路</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {totalEarned}/{totalCount}
            </span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              overallProgress >= 80 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
              overallProgress >= 50 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
              "bg-muted text-muted-foreground"
            )}>
              {overallProgress}%
            </span>
            {totalEarned > 0 && (
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
        
        {/* 彩虹进度条 */}
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 via-violet-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      <CardContent className="p-2.5 space-y-2">
        <TooltipProvider delayDuration={100}>
          {paths.map((path) => {
            const isExpanded = expandedPath === path.key;
            
            return (
              <motion.div
                key={path.key}
                layout
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isExpanded ? path.theme.bgActive : "hover:bg-muted/30"
                )}
              >
                {/* 路径标题行 */}
                <div 
                  className="flex items-center justify-between mb-1.5 cursor-pointer"
                  onClick={() => setExpandedPath(isExpanded ? null : path.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{path.icon}</span>
                    <span className="text-xs font-medium">{path.title}</span>
                    <span className={cn("text-[10px] font-medium", path.theme.text)}>
                      {path.earnedCount}/{path.totalCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Target className="w-2.5 h-2.5" />
                      {path.ultimateGoal.icon} {path.ultimateGoal.name}
                    </span>
                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                </div>

                {/* 成就路径 */}
                <div className="flex items-center gap-0.5 overflow-x-auto pb-1 scrollbar-hide">
                  {path.achievements.map((achievement, index) => (
                    <div key={achievement.key} className="flex items-center shrink-0">
                      <AchievementNodeItem
                        achievement={achievement}
                        index={index}
                        theme={path.theme}
                        showLevel={path.key === 'milestone'}
                      />
                      {index < path.achievements.length - 1 && (
                        <ConnectionLine 
                          isActive={achievement.earned}
                          theme={path.theme}
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* 终极目标图标 */}
                  <div className="flex items-center shrink-0">
                    <ConnectionLine 
                      isActive={path.earnedCount === path.totalCount}
                      theme={path.theme}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-lg border-2 border-dashed relative",
                          path.earnedCount === path.totalCount 
                            ? [path.theme.bgActive, path.theme.border]
                            : "border-muted-foreground/20 bg-muted/30"
                        )}>
                          <span className={cn(
                            "transition-all",
                            path.earnedCount === path.totalCount ? "" : "grayscale opacity-30"
                          )}>
                            {path.ultimateGoal.icon}
                          </span>
                          {path.earnedCount === path.totalCount && (
                            <motion.div
                              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-sm"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Crown className="w-2 h-2 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-semibold">{path.ultimateGoal.name}</p>
                          <p className="text-xs text-muted-foreground">{path.ultimateGoal.description}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* 展开时显示下一步行动提示 */}
                <AnimatePresence>
                  {isExpanded && path.nextAchievement && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        "mt-2 p-2 rounded-lg text-xs",
                        path.theme.bgActive
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-1">
                            <span>{path.nextAchievement.icon}</span>
                            {path.nextAchievement.name}
                          </span>
                          <span className={cn("font-semibold", path.theme.text)}>
                            {path.nextAchievement.remainingText}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/50 dark:bg-slate-900/50 rounded-full overflow-hidden mb-1">
                          <motion.div
                            className={cn("h-full bg-gradient-to-r", path.theme.gradient)}
                            initial={{ width: 0 }}
                            animate={{ width: `${path.nextAchievement.progress}%` }}
                          />
                        </div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          💡 <span>{path.nextAchievement.dailyTaskHint}</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </TooltipProvider>

        {/* Lv6 终极目标卡片 */}
        <motion.div
          className="mt-2 p-3 rounded-xl bg-gradient-to-br from-amber-100/80 via-orange-100/80 to-rose-100/80 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-rose-900/30 border border-amber-200/50 dark:border-amber-700/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.span
                className="text-xl"
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                👑
              </motion.span>
              <div>
                <p className="font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Lv6 觉醒大师
                </p>
                <p className="text-[10px] text-muted-foreground">终极目标</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {ultimateGoalProgress.students.current}/{ultimateGoalProgress.students.target} 学员毕业
              </p>
              <p className="text-[10px] text-muted-foreground">
                {ultimateGoalProgress.points.current}/{ultimateGoalProgress.points.target} 积分
              </p>
            </div>
          </div>
          
          {/* 双进度条 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-8 text-muted-foreground">学员</span>
              <div className="flex-1 h-1.5 bg-white/50 dark:bg-slate-900/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${ultimateGoalProgress.students.progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-8 text-muted-foreground">积分</span>
              <div className="flex-1 h-1.5 bg-white/50 dark:bg-slate-900/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-400 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${ultimateGoalProgress.points.progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 全部完成庆祝 */}
        {totalEarned === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-2"
          >
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              🎉 恭喜！你已成为觉醒大师！
            </p>
          </motion.div>
        )}
      </CardContent>

      <WealthInviteCardDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        defaultTab="achievement"
      />
    </Card>
  );
}

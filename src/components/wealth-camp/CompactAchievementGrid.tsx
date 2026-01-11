import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Share2, ChevronRight, Sparkles, Target, ChevronDown, Eye, Medal } from 'lucide-react';
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

// 进度点组件 - 简化展示
function ProgressDotsSimple({ 
  earnedCount, 
  totalCount, 
  theme,
  size = 'sm'
}: { 
  earnedCount: number; 
  totalCount: number; 
  theme: { gradient: string };
  size?: 'sm' | 'md';
}) {
  const dotSize = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5';
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: totalCount }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.02 }}
          className={cn(
            dotSize, "rounded-full transition-all duration-300",
            i < earnedCount 
              ? cn("bg-gradient-to-r shadow-sm", theme.gradient) 
              : "bg-muted-foreground/20 border border-muted-foreground/10"
          )}
        />
      ))}
    </div>
  );
}

// 成就节点组件 - 详细展示
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
          transition={{ delay: index * 0.03 }}
          className="relative"
        >
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-sm relative overflow-hidden transition-all duration-300",
              isEarned && [theme.bgActive, 'border', theme.border, 'shadow-sm'],
              !isEarned && !isNext && [theme.bgLocked, 'border border-dashed border-muted-foreground/20'],
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
              <motion.div
                className={cn("absolute inset-0 rounded-lg bg-gradient-to-tr", theme.gradient)}
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* 图标 */}
            <span className={cn(
              "relative z-10 transition-all duration-300 text-xs",
              !isEarned && !isNext && "grayscale opacity-30",
              isNext && "grayscale-0 opacity-80"
            )}>
              {achievement.icon}
            </span>

            {/* 已完成徽章 */}
            {isEarned && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm"
              >
                <span className="text-[6px] text-white">✓</span>
              </motion.div>
            )}

            {/* 等级标签 */}
            {showLevel && achievement.mappedLevel && (
              <div className={cn(
                "absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[6px] font-bold px-0.5 rounded",
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

export function CompactAchievementGrid({ className }: CompactAchievementGridProps) {
  const { paths, isLoading, totalEarned, totalCount, overallProgress, globalNextAchievement } = useAchievementProgress();
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

  // 获取下一个目标的路径主题
  const nextPath = globalNextAchievement 
    ? paths.find(p => p.key === globalNextAchievement.pathKey) 
    : null;

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      {/* 头部：标题 + 进度 */}
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
        {/* 🎯 下一个目标卡片 */}
        {globalNextAchievement && nextPath && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-3 rounded-xl border-2",
              nextPath.theme.bgActive,
              nextPath.theme.border
            )}
          >
            <div className="flex items-start gap-3">
              {/* 大图标 */}
              <motion.div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                  "bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-700/40",
                  "border-2", nextPath.theme.border
                )}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {globalNextAchievement.achievement.icon}
              </motion.div>
              
              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">下一个目标</span>
                </div>
                <p className="font-bold text-sm truncate">
                  {globalNextAchievement.achievement.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {globalNextAchievement.achievement.description}
                </p>
                
                {/* 进度条 */}
                <div className="mt-2 space-y-1">
                  <div className="h-2 bg-white/50 dark:bg-slate-900/50 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full bg-gradient-to-r", nextPath.theme.gradient)}
                      initial={{ width: 0 }}
                      animate={{ width: `${globalNextAchievement.progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn("font-semibold", nextPath.theme.text)}>
                      {globalNextAchievement.remainingText}
                    </span>
                    <span className="text-muted-foreground">
                      {globalNextAchievement.progress}%
                    </span>
                  </div>
                </div>
                
                {/* 行动提示 */}
                <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                  💡 {globalNextAchievement.achievement.dailyTaskHint}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 分享按钮 */}
        <Button
          onClick={() => setShowShareDialog(true)}
          className={cn(
            "w-full h-auto py-3 px-4",
            "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500",
            "hover:from-amber-600 hover:via-orange-600 hover:to-rose-600",
            "text-white shadow-md hover:shadow-lg transition-all"
          )}
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <div className="text-left">
              <p className="font-semibold text-sm">分享我的成就之路</p>
              <p className="text-[10px] opacity-80">生成专属海报，记录你的成长历程</p>
            </div>
          </div>
        </Button>

        {/* 四条路径 - 简化展示 */}
        <TooltipProvider delayDuration={100}>
          {paths.map((path) => {
            const isExpanded = expandedPath === path.key;
            
            return (
              <motion.div
                key={path.key}
                layout
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  isExpanded ? path.theme.bgActive : "hover:bg-muted/30"
                )}
                onClick={() => setExpandedPath(isExpanded ? null : path.key)}
              >
                {/* 路径标题行 - 简化版 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{path.icon}</span>
                    <span className="text-xs font-medium">{path.title}</span>
                    <ProgressDotsSimple 
                      earnedCount={path.earnedCount} 
                      totalCount={path.totalCount} 
                      theme={path.theme}
                    />
                    <span className={cn("text-[10px] font-medium", path.theme.text)}>
                      {path.earnedCount}/{path.totalCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {path.nextAchievement && (
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        下一个: {path.nextAchievement.name}
                      </span>
                    )}
                    <ChevronDown className={cn(
                      "w-3.5 h-3.5 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                </div>

                {/* 展开时显示全部成就 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 mt-2 border-t border-border/30">
                        {/* 成就网格 */}
                        <div className="flex flex-wrap gap-1">
                          {path.achievements.map((achievement, index) => (
                            <AchievementNodeItem
                              key={achievement.key}
                              achievement={achievement}
                              index={index}
                              theme={path.theme}
                              showLevel={path.key === 'milestone'}
                            />
                          ))}
                        </div>
                        
                        {/* 下一步提示 */}
                        {path.nextAchievement && (
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
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </TooltipProvider>

        {/* 全部完成庆祝 */}
        {totalEarned === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3 bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg"
          >
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              🎉 恭喜！你已获得全部成就！
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

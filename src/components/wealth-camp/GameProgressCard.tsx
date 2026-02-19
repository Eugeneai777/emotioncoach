import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useEnsureAwakeningProgress } from '@/hooks/useEnsureAwakeningProgress';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { awakeningLevels } from '@/config/awakeningLevelConfig';
import { cardBaseStyles } from '@/config/cardStyleConfig';
import { Gamepad2, Loader2, ArrowRight, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AwakeningRulesDialog from './AwakeningRulesDialog';
import { LevelMilestoneTooltip } from './LevelMilestoneTooltip';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GameProgressCardProps {
  currentDayNumber?: number;
  streak?: number;
}

// 觉醒状态定义（高对比度版本，适配白色背景）
const awakeningStates = [
  { emoji: '🔴', label: '觉醒起步', minScore: 0, maxScore: 39, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700/50' },
  { emoji: '🟠', label: '初步觉醒', minScore: 40, maxScore: 59, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700/50' },
  { emoji: '🟡', label: '稳步觉醒', minScore: 60, maxScore: 79, color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-200 border-amber-400 dark:bg-amber-900/40 dark:border-amber-600/50' },
  { emoji: '🟢', label: '高度觉醒', minScore: 80, maxScore: 100, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700/50' },
];

const getAwakeningState = (score: number) => {
  return awakeningStates.find(s => score >= s.minScore && score <= s.maxScore) || awakeningStates[0];
};

export const GameProgressCard = ({ currentDayNumber = 1, streak = 0 }: GameProgressCardProps) => {
  const navigate = useNavigate();
  const { progress, currentLevel, nextLevel, levelProgress, pointsToNext, awakeningGrowth } = useAwakeningProgress();
  const { isSyncing } = useEnsureAwakeningProgress();
  const { baseline } = useAssessmentBaseline();
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  // 正在同步中
  if (isSyncing) {
    return (
      <Card className="bg-gradient-to-br from-amber-50/80 to-yellow-50/30 dark:from-amber-950/30 dark:to-slate-900/80 border border-amber-200/50 dark:border-amber-800/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>正在同步你的觉醒数据...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 没有进度数据
  if (!progress) {
    if (baseline) {
      return (
        <Card className="bg-gradient-to-br from-amber-50/80 to-yellow-50/30 dark:from-amber-950/30 dark:to-slate-900/80 border border-amber-200/50 dark:border-amber-800/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="text-muted-foreground">数据同步中，请稍后...</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="bg-gradient-to-br from-amber-50/80 to-yellow-50/30 dark:from-amber-950/30 dark:to-slate-900/80 border border-amber-200/50 dark:border-amber-800/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">完成财富测评开启你的觉醒之旅</div>
            <Button 
              onClick={() => navigate('/wealth-block')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              开始测评
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentState = getAwakeningState(progress.current_awakening);

  // 计算等级进度线的位置
  const getLevelTrackProgress = () => {
    if (!currentLevel) return 0;
    const currentIndex = currentLevel.level - 1;
    const baseProgress = (currentIndex / (awakeningLevels.length - 1)) * 100;
    const levelContribution = (levelProgress / 100) * (1 / (awakeningLevels.length - 1)) * 100;
    return Math.min(100, baseProgress + levelContribution);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn(
        cardBaseStyles.container,
        "bg-white/95 dark:bg-gray-900/90 border border-amber-300/70 dark:border-amber-700/50 overflow-hidden relative"
      )}>
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
        
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="flex items-center justify-between text-lg text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              我的财富觉醒之旅
            </div>
            <AwakeningRulesDialog 
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600/60 hover:text-amber-700 dark:text-amber-400/60 dark:hover:text-amber-300">
                  <Info className="h-4 w-4" />
                </Button>
              }
            />
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-5 relative z-10">
          {/* 区块1：核心数据 — 觉醒状态 + 分数 + 成长 */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* 状态 badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${currentState.bg}`}>
              <span>{currentState.emoji}</span>
              <span className={currentState.color}>{currentState.label}</span>
            </div>
            
            {/* 分数 + 成长 */}
            <div className="flex items-baseline gap-2">
              <motion.span
                key={progress.current_awakening}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-3xl font-black text-amber-900 dark:text-amber-100"
              >
                {progress.current_awakening}
              </motion.span>
              <span className="text-xs text-muted-foreground">分</span>
              {awakeningGrowth !== 0 && (
                <span className={`text-xs font-medium ${awakeningGrowth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  ({awakeningGrowth > 0 ? '+' : ''}{awakeningGrowth})
                </span>
              )}
            </div>
          </motion.div>

          {/* 区块2：7天觉醒目标（个性化） */}
          {(() => {
            const baselineScore = progress.baseline_awakening;
            const currentScore = progress.current_awakening;
            const day7Target = Math.min(baselineScore + 20, 95);
            const range = day7Target - baselineScore;
            const gained = currentScore - baselineScore;
            const goalProgress = range > 0 ? Math.min(100, Math.round((gained / range) * 100)) : 100;
            const isAchieved = currentScore >= day7Target;
            const remaining = day7Target - currentScore;
            
            return (
              <motion.div
                className="rounded-lg bg-amber-100/60 border border-amber-300/50 dark:bg-amber-900/20 dark:border-amber-700/30 px-3 py-2.5 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    🎯 7天觉醒目标：<span className="text-amber-600 dark:text-amber-400 font-bold">{day7Target} 分</span>
                  </span>
                  {isAchieved ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                      <Check className="h-3 w-3" /> 已达成
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      起点 <span className="text-foreground font-medium">{baselineScore}</span>
                    </span>
                  )}
                </div>
                
                <div className="h-1.5 w-full rounded-full bg-amber-200/60 dark:bg-amber-950/50 overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isAchieved 
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                        : "bg-gradient-to-r from-amber-500 to-orange-400"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                  />
                </div>

                <div className="text-[10px]">
                  {isAchieved ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">🎉 已达成 7 天觉醒目标！</span>
                  ) : (
                    <span className="text-muted-foreground">
                      距目标还差 <span className="text-amber-600 dark:text-amber-400 font-bold">{remaining}</span> 分
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {/* 区块3：等级图标轨道 */}
          <TooltipProvider>
            <div className="space-y-3">
              {/* 里程碑图标行 + 进度线 */}
              <div className="relative flex justify-between items-start px-1 sm:px-2">
                {awakeningLevels.map((level, index) => {
                  const isActive = currentLevel && level.level <= currentLevel.level;
                  const isCurrent = currentLevel && level.level === currentLevel.level;
                  const isNext = nextLevel && level.level === nextLevel.level;
                  
                  return (
                    <div 
                      key={level.level} 
                      className="flex flex-col items-center gap-1 relative z-10"
                      onMouseEnter={() => setHoveredLevel(level.level)}
                      onMouseLeave={() => setHoveredLevel(null)}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            className={cn(
                              "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-xl cursor-pointer transition-all duration-200 relative",
                              isCurrent 
                                ? 'bg-amber-500 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 dark:ring-amber-600' 
                                : isActive 
                                  ? 'bg-emerald-500/80' 
                                  : 'bg-white border border-amber-200 dark:bg-amber-950/40 dark:border-amber-700/50 hover:border-amber-300'
                            )}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: isCurrent ? 1.1 : 1, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.08, type: 'spring', stiffness: 300 }}
                            whileHover={{ scale: 1.15 }}
                          >
                            <span className="text-sm sm:text-base">{level.icon}</span>
                            
                            {isActive && !isCurrent && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center"
                              >
                                <Check className="h-2 w-2 text-white" />
                              </motion.div>
                            )}
                            
                            {isCurrent && (
                              <motion.div
                                className="absolute inset-0 rounded-full bg-amber-400/30"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-0 bg-transparent border-0">
                          <LevelMilestoneTooltip
                            level={level}
                            currentPoints={progress.total_points}
                            isActive={isActive || false}
                            isCurrent={isCurrent || false}
                            isNext={isNext || false}
                          />
                        </TooltipContent>
                      </Tooltip>
                      
                      {/* 等级名称（简短）*/}
                      <motion.div
                        className="flex flex-col items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                      >
                        <span className={cn(
                          "text-[8px] sm:text-[9px] font-medium leading-tight text-center max-w-[40px] sm:max-w-[48px] break-words",
                          isCurrent 
                            ? "text-amber-600 dark:text-amber-400 font-bold" 
                            : isActive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                        )}>
                          {level.name}
                        </span>
                        <span className="text-[8px] text-muted-foreground/70 leading-tight">
                          {level.minPoints === 0 ? '0分' : `${level.minPoints}分`}
                        </span>
                      </motion.div>
                    </div>
                  );
                })}
                
                {/* 进度条背景 */}
                <div className="absolute top-[18px] sm:top-5 left-5 right-5 h-0.5 bg-amber-200/70 dark:bg-amber-900/40 -z-0" />
                
                {/* 进度条填充 */}
                <motion.div 
                  className="absolute top-[18px] sm:top-5 left-5 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${getLevelTrackProgress()}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                  style={{ maxWidth: 'calc(100% - 2.5rem)' }}
                />
              </div>

              {/* 距下一等级提示 */}
              {nextLevel && pointsToNext > 0 && (
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <span className="text-xs text-muted-foreground">
                    距 <span className="text-amber-600 dark:text-amber-400 font-medium">Lv.{nextLevel.level} {nextLevel.name}</span> 还需 
                    <span className="text-amber-600 dark:text-amber-400 font-bold mx-1">{pointsToNext}</span>积分
                    {nextLevel.unlockCondition && (
                      <span className="text-muted-foreground/60 ml-1">· {nextLevel.unlockCondition}</span>
                    )}
                  </span>
                </motion.div>
              )}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </motion.div>
  );
};

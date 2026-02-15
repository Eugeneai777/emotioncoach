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

// 觉醒状态定义
const awakeningStates = [
  { emoji: '🔴', label: '觉醒起步', minScore: 0, maxScore: 39, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/50' },
  { emoji: '🟠', label: '初步觉醒', minScore: 40, maxScore: 59, color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/50' },
  { emoji: '🟡', label: '稳步觉醒', minScore: 60, maxScore: 79, color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/50' },
  { emoji: '🟢', label: '高度觉醒', minScore: 80, maxScore: 100, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/50' },
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
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-slate-400">
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
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="text-slate-400">数据同步中，请稍后...</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                刷新页面
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-slate-300">完成财富测评开启你的觉醒之旅</div>
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
  const nextState = awakeningStates.find(s => s.minScore > progress.current_awakening);
  const pointsToNextState = nextState ? nextState.minScore - progress.current_awakening : 0;

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
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 overflow-hidden relative"
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-amber-400" />
              我的财富觉醒之旅
            </div>
            <AwakeningRulesDialog 
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700">
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
                className={`text-2xl font-bold ${currentState.color}`}
              >
                {progress.current_awakening}
              </motion.span>
              <span className="text-xs text-slate-400">分</span>
              {awakeningGrowth !== 0 && (
                <span className={`text-xs font-medium ${awakeningGrowth > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({awakeningGrowth > 0 ? '+' : ''}{awakeningGrowth})
                </span>
              )}
            </div>
          </motion.div>

          {/* 距下一觉醒状态提示 */}
          {nextState && (
            <motion.div 
              className="text-xs text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              距 <span className={`font-medium ${nextState.color}`}>{nextState.emoji} {nextState.label}</span> 还差 
              <span className="text-amber-400 font-bold mx-0.5">{pointsToNextState}</span>分
            </motion.div>
          )}
          {!nextState && (
            <motion.div 
              className="text-xs text-emerald-400 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              🎉 已达成高度觉醒
            </motion.div>
          )}

          {/* 区块2：等级图标轨道 */}
          <TooltipProvider>
            <div className="space-y-2">
              <div className="relative flex justify-between items-center px-1 sm:px-2">
                {awakeningLevels.map((level, index) => {
                  const isActive = currentLevel && level.level <= currentLevel.level;
                  const isCurrent = currentLevel && level.level === currentLevel.level;
                  const isNext = nextLevel && level.level === nextLevel.level;
                  
                  return (
                    <div 
                      key={level.level} 
                      className="flex flex-col items-center relative z-10"
                      onMouseEnter={() => setHoveredLevel(level.level)}
                      onMouseLeave={() => setHoveredLevel(null)}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            className={cn(
                              "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-lg cursor-pointer transition-all duration-200 relative",
                              isCurrent 
                                ? 'bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300' 
                                : isActive 
                                  ? 'bg-emerald-500/80' 
                                  : 'bg-slate-700 hover:bg-slate-600'
                            )}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: isCurrent ? 1.1 : 1, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.08, type: 'spring', stiffness: 300 }}
                            whileHover={{ scale: 1.2 }}
                          >
                            {level.icon}
                            
                            {isActive && !isCurrent && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full flex items-center justify-center"
                              >
                                <Check className="h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 text-white" />
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
                      
                      {isCurrent && (
                        <motion.div 
                          className="text-[10px] sm:text-xs text-amber-400 mt-0.5 sm:mt-1 font-medium whitespace-nowrap"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          {level.name}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
                
                {/* 进度条背景 */}
                <div className="absolute top-3 sm:top-4 left-4 right-4 sm:left-6 sm:right-6 h-0.5 bg-slate-700 -z-0" />
                
                {/* 进度条填充 */}
                <motion.div 
                  className="absolute top-3 sm:top-4 left-4 sm:left-6 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${getLevelTrackProgress()}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                  style={{ maxWidth: 'calc(100% - 2rem)' }}
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
                  <span className="text-xs text-slate-400">
                    距 <span className="text-amber-400 font-medium">Lv.{nextLevel.level} {nextLevel.name}</span> 还需 
                    <span className="text-amber-400 font-bold mx-1">{pointsToNext}</span>积分
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

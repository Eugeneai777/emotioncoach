import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useEnsureAwakeningProgress } from '@/hooks/useEnsureAwakeningProgress';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { awakeningLevels, calculateDailyPotentialPoints } from '@/config/awakeningLevelConfig';
import { Gamepad2, TrendingUp, Loader2, ArrowRight, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AwakeningRulesDialog from './AwakeningRulesDialog';
import { LevelMilestoneTooltip } from './LevelMilestoneTooltip';
import { GoalCarousel } from './GoalCarousel';
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

// 数字跳动动画组件
const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.3, y: -5 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={className}
    >
      {value}
    </motion.span>
  );
};

export const GameProgressCard = ({ currentDayNumber = 1, streak = 0 }: GameProgressCardProps) => {
  const navigate = useNavigate();
  const { progress, currentLevel, nextLevel, levelProgress, pointsToNext, awakeningGrowth } = useAwakeningProgress();
  const { isSyncing, syncComplete } = useEnsureAwakeningProgress();
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
    // 检查是否有测评数据
    if (baseline) {
      // 有测评但没有进度，等待同步或刷新
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
    
    // 没有测评，引导去做测评
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-slate-300">
              完成财富测评开启你的觉醒之旅
            </div>
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

  const dailyPotential = calculateDailyPotentialPoints(currentDayNumber);
  
  // 根据觉醒值确定状态
  const getAwakeningStatus = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: '高度觉醒', emoji: '🟢' };
    if (score >= 60) return { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: '稳步觉醒', emoji: '🟡' };
    if (score >= 40) return { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: '初步觉醒', emoji: '🟠' };
    return { color: 'text-rose-400', bgColor: 'bg-rose-500/20', label: '觉醒起步', emoji: '🔴' };
  };
  
  const currentStatus = getAwakeningStatus(progress.current_awakening);

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
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 overflow-hidden relative">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="flex items-center justify-between text-lg">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Gamepad2 className="h-5 w-5 text-amber-400" />
              我的财富觉醒之旅
            </motion.div>
            <AwakeningRulesDialog 
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700">
                  <Info className="h-4 w-4" />
                </Button>
              }
            />
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 relative z-10">
          {/* 精简标签 - 只保留2个核心 */}
          <TooltipProvider>
            <motion.div 
              className="flex items-center gap-2 flex-wrap"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${awakeningGrowth >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    📈 成长 {awakeningGrowth >= 0 ? '+' : ''}{awakeningGrowth}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">从觉醒起点 {progress.baseline_awakening} 提升到当前 {progress.current_awakening}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400">
                    🎯 目标 80+
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">达到80分即为高度觉醒状态</p>
                </TooltipContent>
              </Tooltip>

              {/* 当前状态用颜色直接体现 */}
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${currentStatus.bgColor} ${currentStatus.color}`}>
                {currentStatus.emoji} {currentStatus.label}
              </div>
            </motion.div>
          </TooltipProvider>
          
          {/* 觉醒起点 vs 当前觉醒 - 带数字动画 */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">觉醒起点 (Day 0)</div>
              <div className="text-2xl font-bold text-slate-300">{progress.baseline_awakening}</div>
            </div>
            
            <div className="flex-1 px-4 flex items-center justify-center">
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                <motion.div 
                  className="h-0.5 w-8 bg-gradient-to-r from-slate-600 to-amber-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </motion.div>
                <motion.div 
                  className="h-0.5 w-8 bg-gradient-to-r from-amber-500 to-emerald-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                />
              </motion.div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">当前觉醒</div>
              <div className="flex items-baseline gap-1">
                <AnimatedNumber 
                  value={progress.current_awakening} 
                  className={`text-3xl font-bold ${currentStatus.color}`}
                />
                {awakeningGrowth > 0 && (
                  <motion.span 
                    className="text-sm text-amber-400"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    (+{awakeningGrowth}🔥)
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>

          {/* 等级进度条 - 可交互 */}
          <div className="space-y-3">
            {/* 等级图标轨道 */}
            <div className="relative flex justify-between items-center px-2">
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
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-lg cursor-pointer
                            transition-all duration-200 relative
                            ${isCurrent 
                              ? 'bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300' 
                              : isActive 
                                ? 'bg-emerald-500/80' 
                                : 'bg-slate-700 hover:bg-slate-600'
                            }
                          `}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: isCurrent ? 1.1 : 1,
                            opacity: 1
                          }}
                          transition={{ 
                            delay: 0.4 + index * 0.1,
                            type: 'spring', 
                            stiffness: 300 
                          }}
                          whileHover={{ scale: 1.2 }}
                        >
                          {level.icon}
                          
                          {/* 已完成徽章 */}
                          {isActive && !isCurrent && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="h-2.5 w-2.5 text-white" />
                            </motion.div>
                          )}
                          
                          {/* 当前等级脉冲 */}
                          {isCurrent && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-amber-400/30"
                              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          
                          {/* 下一等级微闪烁 */}
                          {isNext && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-slate-400/30"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
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
                        className="text-xs text-amber-400 mt-1 font-medium whitespace-nowrap"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        {level.name}
                      </motion.div>
                    )}
                  </div>
                );
              })}
              
              {/* 进度条背景 */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-700 -z-0" />
              
              {/* 进度条填充 - 带流光动画 */}
              <motion.div 
                className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${getLevelTrackProgress()}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                style={{ maxWidth: 'calc(100% - 3rem)' }}
              >
                {/* 流光效果 */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.div>
            </div>

            {/* 当前等级进度 */}
            {nextLevel && (
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">
                    Lv.{currentLevel?.level} → Lv.{nextLevel.level} {nextLevel.name}
                  </span>
                  <span className="text-amber-400 font-medium">{levelProgress}%</span>
                </div>
                <div className="relative">
                  <Progress 
                    value={levelProgress} 
                    className="h-1.5 bg-slate-700"
                  />
                  {/* 进度条流光 */}
                  <motion.div
                    className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: `${levelProgress}%` }}
                    transition={{ duration: 1, delay: 1 }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* 目标里程碑卡片 */}
          <GoalCarousel
            currentPoints={progress.total_points}
            currentAwakening={progress.current_awakening}
            streak={streak}
            currentLevel={currentLevel || awakeningLevels[0]}
            nextLevel={nextLevel}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useEnsureAwakeningProgress } from '@/hooks/useEnsureAwakeningProgress';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { awakeningLevels, calculateDailyPotentialPoints } from '@/config/awakeningLevelConfig';
import { Gamepad2, TrendingUp, Zap, Target, Loader2, ArrowRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AwakeningRulesDialog from './AwakeningRulesDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GameProgressCardProps {
  currentDayNumber?: number;
}

export const GameProgressCard = ({ currentDayNumber = 1 }: GameProgressCardProps) => {
  const navigate = useNavigate();
  const { progress, currentLevel, nextLevel, levelProgress, pointsToNext, awakeningGrowth } = useAwakeningProgress();
  const { isSyncing, syncComplete } = useEnsureAwakeningProgress();
  const { baseline } = useAssessmentBaseline();

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
    if (score >= 80) return { color: 'text-emerald-400', label: '高度觉醒', emoji: '🟢' };
    if (score >= 60) return { color: 'text-amber-400', label: '稳步觉醒', emoji: '🟡' };
    if (score >= 40) return { color: 'text-orange-400', label: '初步觉醒', emoji: '🟠' };
    return { color: 'text-rose-400', label: '觉醒起步', emoji: '🔴' };
  };
  
  const currentStatus = getAwakeningStatus(progress.current_awakening);

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
        
        <CardContent className="space-y-4 relative z-10">
          {/* 快捷数据标签 */}
          <TooltipProvider>
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${awakeningGrowth >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    📈 成长 {awakeningGrowth >= 0 ? '+' : ''}{awakeningGrowth}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">从觉醒起点 {progress.baseline_awakening} 提升到当前 {progress.current_awakening}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                    🔥 今日 +{dailyPotential}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">完成今日所有任务可获得的积分</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400">
                    🎯 目标 80+
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">达到80分即为高度觉醒状态</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 ${currentStatus.color}`}>
                    {currentStatus.emoji} {currentStatus.label}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">当前觉醒状态: {progress.current_awakening} 分</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          
          {/* 觉醒起点 vs 当前觉醒 */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">觉醒起点 (Day 0)</div>
              <div className="text-2xl font-bold text-slate-300">{progress.baseline_awakening}</div>
            </div>
            
            <div className="flex-1 px-4 flex items-center justify-center">
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="h-0.5 w-8 bg-gradient-to-r from-slate-600 to-amber-500" />
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <div className="h-0.5 w-8 bg-gradient-to-r from-amber-500 to-emerald-500" />
              </motion.div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">当前觉醒</div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${currentStatus.color}`}>{progress.current_awakening}</span>
                {awakeningGrowth > 0 && (
                  <span className="text-sm text-amber-400">(+{awakeningGrowth}🔥)</span>
                )}
              </div>
            </div>
          </div>

          {/* 等级进度条 */}
          <div className="space-y-3">
            {/* 等级图标轨道 */}
            <div className="relative flex justify-between items-center px-2">
              {awakeningLevels.map((level, index) => {
                const isActive = currentLevel && level.level <= currentLevel.level;
                const isCurrent = currentLevel && level.level === currentLevel.level;
                
                return (
                  <div 
                    key={level.level} 
                    className="flex flex-col items-center relative z-10"
                  >
                    <motion.div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-lg
                        ${isCurrent 
                          ? 'bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300' 
                          : isActive 
                            ? 'bg-emerald-500/80' 
                            : 'bg-slate-700'
                        }
                      `}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isCurrent ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {level.icon}
                    </motion.div>
                    {isCurrent && (
                      <div className="text-xs text-amber-400 mt-1 font-medium whitespace-nowrap">
                        {level.name}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* 进度条背景 */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-700 -z-0" />
              {/* 进度条填充 */}
              <motion.div 
                className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((currentLevel?.level || 1) - 1) / (awakeningLevels.length - 1) * 100}%` 
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ maxWidth: 'calc(100% - 3rem)' }}
              />
            </div>

            {/* 当前等级进度 */}
            {nextLevel && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">
                    Lv.{currentLevel?.level} → Lv.{nextLevel.level}
                  </span>
                  <span className="text-amber-400">{levelProgress}%</span>
                </div>
                <Progress 
                  value={levelProgress} 
                  className="h-1.5 bg-slate-700"
                />
              </div>
            )}
          </div>

          {/* 底部信息 */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-slate-400" />
              <span className="text-slate-400">
                距离「{nextLevel?.name || '觉醒大师'}」: 
              </span>
              <span className="text-amber-400 font-medium">
                {pointsToNext > 0 ? `还需 ${pointsToNext} 积分` : '已达成'}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-slate-400">今日潜力:</span>
              <span className="text-yellow-400 font-medium">+{dailyPotential}分</span>
            </div>
          </div>
          
          {/* 当前等级解锁条件 */}
          {currentLevel?.unlockCondition && (
            <div className="pt-2 border-t border-slate-700/50">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <span className="text-amber-400">✓</span>
                <span>已达成: {currentLevel.unlockCondition}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

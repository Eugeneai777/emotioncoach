import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useEnsureAwakeningProgress } from '@/hooks/useEnsureAwakeningProgress';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { awakeningLevels, calculateDailyPotentialPoints } from '@/config/awakeningLevelConfig';
import { TrendingUp, Flame, Loader2, ArrowRight, Info, Calendar, Target, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AwakeningRulesDialog from './AwakeningRulesDialog';

interface AwakeningDashboardProps {
  currentDay: number;
  totalDays: number;
  completedDays: number[];
  makeupDays: number[];
  streak: number;
  onMakeupClick: (dayNumber: number) => void;
  activeMakeupDay?: number | null;
}

export const AwakeningDashboard = ({
  currentDay,
  totalDays,
  completedDays,
  makeupDays,
  streak,
  onMakeupClick,
  activeMakeupDay,
}: AwakeningDashboardProps) => {
  const navigate = useNavigate();
  const { progress, currentLevel, nextLevel, levelProgress, pointsToNext, awakeningGrowth } = useAwakeningProgress();
  const { isSyncing } = useEnsureAwakeningProgress();
  const { baseline } = useAssessmentBaseline();

  const dailyPotential = calculateDailyPotentialPoints(currentDay);
  const completedCount = completedDays.length;

  // 根据觉醒值确定状态
  const getAwakeningStatus = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: '高度觉醒', emoji: '🟢' };
    if (score >= 60) return { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: '稳步觉醒', emoji: '🟡' };
    if (score >= 40) return { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: '初步觉醒', emoji: '🟠' };
    return { color: 'text-rose-400', bgColor: 'bg-rose-500/20', label: '觉醒起步', emoji: '🔴' };
  };

  // 正在同步中
  if (isSyncing) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">正在同步觉醒数据...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 没有进度数据
  if (!progress) {
    if (baseline) {
      return (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0">
          <CardContent className="p-4 text-center">
            <div className="text-slate-400 text-sm mb-2">数据同步中...</div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              刷新页面
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0">
        <CardContent className="p-4 text-center">
          <div className="text-slate-300 text-sm mb-3">完成财富测评开启觉醒之旅</div>
          <Button 
            onClick={() => navigate('/wealth-block')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            size="sm"
          >
            开始测评 <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = getAwakeningStatus(progress.current_awakening);
  const targetScore = 80;
  const graduationProgress = Math.min(100, (progress.current_awakening / targetScore) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 overflow-hidden relative">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        
        <CardContent className="p-4 relative z-10 space-y-4">
          {/* 第一行：我在哪 + 目标在哪 */}
          <div className="flex items-center justify-between">
            {/* 起点 → 当前 */}
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400">起点</div>
                      <div className="text-lg font-bold text-slate-400">{progress.baseline_awakening}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">来自 Day 0 财富测评</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-1">
                <div className="h-0.5 w-4 bg-gradient-to-r from-slate-600 to-amber-500" />
                <TrendingUp className="h-3 w-3 text-amber-400" />
                <div className="h-0.5 w-4 bg-gradient-to-r from-amber-500 to-emerald-500" />
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400">当前</div>
                      <div className={cn("text-2xl font-bold", currentStatus.color)}>
                        {progress.current_awakening}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">成长 +{awakeningGrowth} 分</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* 目标 80 毕业 */}
            <div className="flex-1 max-w-[140px] mx-4">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>目标: 80+ 毕业</span>
                <span>{Math.round(graduationProgress)}%</span>
              </div>
              <Progress 
                value={graduationProgress} 
                className="h-1.5 bg-slate-700"
              />
            </div>

            {/* 规则按钮 */}
            <AwakeningRulesDialog 
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700">
                  <Info className="h-4 w-4" />
                </Button>
              }
            />
          </div>

          {/* 第二行：7天进度 + 连续打卡 */}
          <div className={cn(
            "rounded-lg p-3 transition-all",
            activeMakeupDay 
              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
              : "bg-slate-800/50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {activeMakeupDay ? `补打 Day ${activeMakeupDay}` : `Day ${currentDay}/${totalDays}`}
                </span>
                {!activeMakeupDay && streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400 text-xs">
                    <Flame className="w-3 h-3" />
                    <span>{streak}天连续</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-amber-400">
                ⭐ {completedCount}/{totalDays}
              </div>
            </div>

            {/* 进度点状图 */}
            <div className="flex justify-between gap-1">
              {Array.from({ length: totalDays }, (_, i) => {
                const dayNumber = i + 1;
                const isCompleted = completedDays.includes(dayNumber);
                const canMakeup = makeupDays.includes(dayNumber);
                const isCurrent = dayNumber === currentDay;
                const isFuture = dayNumber > currentDay;
                const isActiveMakeup = dayNumber === activeMakeupDay;

                return (
                  <div 
                    key={dayNumber}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-all",
                      isActiveMakeup && "ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 animate-pulse",
                      isCompleted && "bg-amber-500",
                      !isCompleted && canMakeup && "border-2 border-dashed border-amber-400/50 bg-amber-900/30",
                      !isCompleted && isCurrent && !activeMakeupDay && "bg-amber-300 ring-2 ring-amber-500 ring-offset-1 ring-offset-slate-900",
                      !isCompleted && isCurrent && activeMakeupDay && "bg-amber-200/40",
                      isFuture && "bg-slate-700/50",
                      !isCompleted && !canMakeup && !isCurrent && !isFuture && "bg-rose-900/40"
                    )}
                  />
                );
              })}
            </div>

            {/* 补卡入口 */}
            {!activeMakeupDay && makeupDays.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 px-2 text-xs text-amber-400 hover:bg-amber-900/30"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {makeupDays.length}天待补卡
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  {makeupDays.map((dayNumber) => (
                    <DropdownMenuItem
                      key={dayNumber}
                      onClick={() => onMakeupClick(dayNumber)}
                      className="cursor-pointer text-sm"
                    >
                      <Calendar className="w-3 h-3 mr-2 text-amber-500" />
                      补打 Day {dayNumber}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 第三行：等级 + 今日可获积分 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              {/* 当前等级图标 */}
              <div className="flex items-center gap-1">
                {awakeningLevels.slice(0, 4).map((level) => {
                  const isActive = currentLevel && level.level <= currentLevel.level;
                  const isCurrent = currentLevel && level.level === currentLevel.level;
                  return (
                    <motion.div
                      key={level.level}
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-sm",
                        isCurrent 
                          ? "bg-amber-500 shadow-lg shadow-amber-500/50 ring-1 ring-amber-300" 
                          : isActive 
                            ? "bg-emerald-500/60" 
                            : "bg-slate-700"
                      )}
                    >
                      {level.icon}
                    </motion.div>
                  );
                })}
                {awakeningLevels.length > 4 && (
                  <span className="text-xs text-slate-500">+{awakeningLevels.length - 4}</span>
                )}
              </div>
              
              {/* 等级名称 */}
              {currentLevel && (
                <span className="text-xs text-amber-400">{currentLevel.name}</span>
              )}
            </div>

            {/* 今日可获积分 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                    <Target className="w-3 h-3" />
                    今日 +{dailyPotential}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">完成今日所有任务可获得的积分</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

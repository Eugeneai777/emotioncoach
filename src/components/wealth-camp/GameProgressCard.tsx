import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { awakeningLevels, calculateDailyPotentialPoints } from '@/config/awakeningLevelConfig';
import { Gamepad2, TrendingUp, Zap, Target } from 'lucide-react';

interface GameProgressCardProps {
  currentDayNumber?: number;
}

export const GameProgressCard = ({ currentDayNumber = 1 }: GameProgressCardProps) => {
  const { progress, currentLevel, nextLevel, levelProgress, pointsToNext, awakeningGrowth } = useAwakeningProgress();

  if (!progress) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            完成财富测评开启你的觉醒之旅
          </div>
        </CardContent>
      </Card>
    );
  }

  const dailyPotential = calculateDailyPotentialPoints(currentDayNumber);

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
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gamepad2 className="h-5 w-5 text-amber-400" />
            我的财富觉醒之旅
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 relative z-10">
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
                <span className="text-3xl font-bold text-emerald-400">{progress.current_awakening}</span>
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
        </CardContent>
      </Card>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Check, Lock } from 'lucide-react';
import { AwakeningLevel } from '@/config/awakeningLevelConfig';

interface LevelMilestoneTooltipProps {
  level: AwakeningLevel;
  currentPoints: number;
  isActive: boolean;
  isCurrent: boolean;
  isNext: boolean;
}

export const LevelMilestoneTooltip = ({
  level,
  currentPoints,
  isActive,
  isCurrent,
  isNext,
}: LevelMilestoneTooltipProps) => {
  const progress = isActive 
    ? 100 
    : Math.min(100, Math.max(0, (currentPoints / level.minPoints) * 100));
  
  const pointsNeeded = Math.max(0, level.minPoints - currentPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      className="w-48 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{level.icon}</span>
        <div>
          <div className="text-sm font-medium text-white">
            Lv.{level.level} {level.name}
          </div>
          <div className="text-xs text-slate-400">
            需要 {level.minPoints} 积分
          </div>
        </div>
      </div>

      {/* 状态指示 */}
      {isActive ? (
        <div className="flex items-center gap-1 text-xs text-emerald-400 mb-2">
          <Check className="h-3 w-3" />
          <span>已达成</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <Lock className="h-3 w-3" />
          <span>还差 {pointsNeeded} 积分</span>
        </div>
      )}

      {/* 进度条 */}
      <div className="space-y-1">
        <Progress 
          value={progress} 
          className="h-1.5 bg-slate-700"
        />
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{currentPoints}</span>
          <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 解锁条件 */}
      <div className="mt-2 pt-2 border-t border-slate-700">
        <div className="text-xs text-slate-500">
          {isActive ? '✓ ' : '○ '}{level.unlockCondition}
        </div>
      </div>

      {/* 描述 */}
      <div className="mt-1 text-xs text-slate-400 italic">
        "{level.description}"
      </div>
    </motion.div>
  );
};

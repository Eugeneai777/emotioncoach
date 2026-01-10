import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Check, Lock, Star, Sparkles } from 'lucide-react';
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
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="w-52 p-4 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-600/50 rounded-xl shadow-2xl shadow-black/40 backdrop-blur-sm"
    >
      {/* 装饰性光晕 */}
      {isCurrent && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
      )}
      {isNext && (
        <motion.div 
          className="absolute -top-1 -right-1"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-3 h-3 text-violet-400" />
        </motion.div>
      )}
      
      {/* 标题区 */}
      <div className="flex items-center gap-3 mb-3">
        <motion.div 
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center text-xl
            ${isActive 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30' 
              : isCurrent 
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
                : isNext
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30'
                  : 'bg-slate-700'
            }
          `}
          animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {level.icon}
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white">
              Lv.{level.level}
            </span>
            <span className="text-sm font-medium text-slate-200">
              {level.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <Star className="h-3 w-3 text-amber-400" />
            <span>需要 {level.minPoints} 积分</span>
          </div>
        </div>
      </div>

      {/* 状态指示 */}
      <motion.div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg mb-3
          ${isActive 
            ? 'bg-emerald-500/20 border border-emerald-500/30' 
            : isNext 
              ? 'bg-violet-500/20 border border-violet-500/30'
              : 'bg-slate-700/50 border border-slate-600/30'
          }
        `}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isActive ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <Check className="h-4 w-4 text-emerald-400" />
            </motion.div>
            <span className="text-xs font-medium text-emerald-400">已达成此等级!</span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-300">
              还差 <span className="font-bold text-amber-400">{pointsNeeded}</span> 积分解锁
            </span>
          </>
        )}
      </motion.div>

      {/* 进度条 - 带动画 */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">当前进度</span>
          <motion.span 
            className={isActive ? 'text-emerald-400 font-medium' : 'text-slate-300'}
            key={progress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {progress.toFixed(0)}%
          </motion.span>
        </div>
        
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            className={`
              absolute inset-y-0 left-0 rounded-full
              ${isActive 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }
            `}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
          
          {/* 流光效果 */}
          {!isActive && progress > 0 && (
            <motion.div
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              initial={{ left: '-2rem' }}
              animate={{ left: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            />
          )}
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>{currentPoints} 积分</span>
          <span>{level.minPoints} 积分</span>
        </div>
      </div>

      {/* 解锁条件 */}
      <motion.div 
        className="mt-3 pt-3 border-t border-slate-700/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-xs text-slate-400 flex items-start gap-1.5">
          <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>
            {isActive ? '✓' : '○'}
          </span>
          <span>{level.unlockCondition}</span>
        </div>
      </motion.div>

      {/* 描述 */}
      <motion.div 
        className="mt-2 text-xs text-slate-500 italic leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        "{level.description}"
      </motion.div>
    </motion.div>
  );
};

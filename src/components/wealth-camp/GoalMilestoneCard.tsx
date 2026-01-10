import { motion } from 'framer-motion';
import { Check, TrendingUp } from 'lucide-react';

interface GoalMilestoneCardProps {
  icon: string;
  title: string;
  subtitle: string;
  current: number;
  target: number;
  unit?: string;
  colorClass?: string;
  index?: number;
}

export const GoalMilestoneCard = ({
  icon,
  title,
  subtitle,
  current,
  target,
  unit = '分',
  colorClass = 'text-amber-400',
  index = 0,
}: GoalMilestoneCardProps) => {
  const progress = Math.min(100, (current / target) * 100);
  const remaining = Math.max(0, target - current);
  const isCompleted = current >= target;
  const isNearComplete = progress >= 80 && !isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: 0.6 + index * 0.1, 
        duration: 0.4,
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
      whileHover={{ scale: 1.03, y: -2 }}
      className={`
        flex-shrink-0 w-32 p-3.5 rounded-xl border relative overflow-hidden
        transition-shadow duration-300
        ${isCompleted 
          ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
          : isNearComplete
            ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600/70'
        }
      `}
    >
      {/* 完成时的装饰 */}
      {isCompleted && (
        <motion.div
          className="absolute top-1.5 right-1.5"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
        >
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <Check className="h-3 w-3 text-white" />
          </div>
        </motion.div>
      )}

      {/* 接近完成的闪烁提示 */}
      {isNearComplete && (
        <motion.div
          className="absolute top-1.5 right-1.5"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <TrendingUp className="h-4 w-4 text-amber-400" />
        </motion.div>
      )}
      
      {/* 图标 - 带入场动画 */}
      <motion.div 
        className="text-2xl mb-1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          delay: 0.7 + index * 0.1, 
          type: 'spring', 
          stiffness: 400 
        }}
      >
        {icon}
      </motion.div>
      
      {/* 标题 */}
      <div className={`text-xs font-semibold ${isCompleted ? 'text-emerald-400' : colorClass}`}>
        {title}
      </div>
      
      {/* 副标题 */}
      <div className="text-xs text-slate-400 truncate mt-0.5">
        {subtitle}
      </div>
      
      {/* 剩余/完成状态 - 数字动画 */}
      <motion.div 
        className={`text-xs mt-2 font-medium ${isCompleted ? 'text-emerald-400' : 'text-slate-200'}`}
        key={remaining}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
      >
        {isCompleted ? (
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" /> 已达成
          </span>
        ) : (
          <span>
            还差 <span className="text-amber-400 font-bold">{remaining}</span> {unit}
          </span>
        )}
      </motion.div>
      
      {/* 进度条 - 带流光动画 */}
      <div className="mt-2.5 relative">
        <div className={`h-1.5 rounded-full overflow-hidden ${isCompleted ? 'bg-emerald-900/40' : 'bg-slate-700'}`}>
          <motion.div 
            className={`
              h-full rounded-full relative
              ${isCompleted 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                : isNearComplete
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-gradient-to-r from-slate-500 to-slate-400'
              }
            `}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ 
              duration: 1, 
              ease: 'easeOut',
              delay: 0.8 + index * 0.1
            }}
          >
            {/* 流光效果 */}
            {!isCompleted && (
              <motion.div
                className="absolute inset-y-0 w-6 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatDelay: 2,
                  delay: 1 + index * 0.2
                }}
              />
            )}
          </motion.div>
        </div>
        
        {/* 百分比 */}
        <motion.div 
          className={`text-xs text-right mt-1 font-medium ${isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 + index * 0.1 }}
        >
          {progress.toFixed(0)}%
        </motion.div>
      </div>

      {/* 背景装饰 */}
      {isCompleted && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
      )}
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      className={`
        flex-shrink-0 w-28 p-3 rounded-xl border
        ${isCompleted 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-slate-800/50 border-slate-700/50'
        }
      `}
    >
      {/* 图标 */}
      <div className="text-2xl mb-1">{icon}</div>
      
      {/* 标题 */}
      <div className={`text-xs font-medium ${isCompleted ? 'text-emerald-400' : colorClass}`}>
        {title}
      </div>
      
      {/* 副标题 */}
      <div className="text-xs text-slate-400 truncate">
        {subtitle}
      </div>
      
      {/* 剩余/完成状态 */}
      <div className={`text-xs mt-1 font-medium ${isCompleted ? 'text-emerald-400' : 'text-slate-300'}`}>
        {isCompleted ? '✓ 已达成' : `还差${remaining}${unit}`}
      </div>
      
      {/* 进度条 */}
      <div className="mt-2">
        <Progress 
          value={progress} 
          className={`h-1 ${isCompleted ? 'bg-emerald-900/50' : 'bg-slate-700'}`}
        />
        <div className={`text-xs text-right mt-0.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
          {progress.toFixed(0)}%
        </div>
      </div>
    </motion.div>
  );
};

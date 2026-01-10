import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GoalMilestoneCard } from './GoalMilestoneCard';
import { AwakeningLevel, awakeningLevels } from '@/config/awakeningLevelConfig';
import { ChevronRight, Target } from 'lucide-react';

interface GoalCarouselProps {
  currentPoints: number;
  currentAwakening: number;
  streak: number;
  currentLevel: AwakeningLevel;
  nextLevel: AwakeningLevel | null;
}

export const GoalCarousel = ({
  currentPoints,
  currentAwakening,
  streak,
  currentLevel,
  nextLevel,
}: GoalCarouselProps) => {
  // 构建目标列表
  const goals = [];

  // 1. 下一等级目标
  if (nextLevel) {
    goals.push({
      icon: nextLevel.icon,
      title: `Lv.${nextLevel.level} ${nextLevel.name}`,
      subtitle: '成长等级',
      current: currentPoints,
      target: nextLevel.minPoints,
      unit: '积分',
      colorClass: 'text-amber-400',
    });
  }

  // 2. 觉醒指数目标
  if (currentAwakening < 80) {
    goals.push({
      icon: '🎯',
      title: '高度觉醒',
      subtitle: '觉醒指数 80+',
      current: currentAwakening,
      target: 80,
      unit: '分',
      colorClass: 'text-violet-400',
    });
  }

  // 3. 连续打卡目标
  const streakTargets = [3, 7, 14, 21, 30];
  const nextStreakTarget = streakTargets.find(t => t > streak);
  if (nextStreakTarget) {
    goals.push({
      icon: '🔥',
      title: `${nextStreakTarget}天连续`,
      subtitle: '打卡成就',
      current: streak,
      target: nextStreakTarget,
      unit: '天',
      colorClass: 'text-orange-400',
    });
  }

  // 4. 更远的等级目标 (如果有)
  if (nextLevel && nextLevel.level < 6) {
    const futureLevelData = awakeningLevels.find(l => l.level === nextLevel.level + 1);
    if (futureLevelData) {
      goals.push({
        icon: futureLevelData.icon,
        title: `Lv.${futureLevelData.level} ${futureLevelData.name}`,
        subtitle: '远期目标',
        current: currentPoints,
        target: futureLevelData.minPoints,
        unit: '积分',
        colorClass: 'text-slate-400',
      });
    }
  }

  if (goals.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="space-y-2"
    >
      {/* 标题 - 带动画 */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.55 }}
      >
        <div className="flex items-center gap-2 text-xs">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Target className="h-3.5 w-3.5 text-amber-400" />
          </motion.div>
          <span className="text-slate-300 font-medium">下一目标</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-500">{goals.length} 个待完成</span>
        </div>
        <motion.div 
          className="flex items-center gap-0.5 text-xs text-slate-500"
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <span>滑动</span>
          <ChevronRight className="h-3 w-3" />
        </motion.div>
      </motion.div>

      {/* 可滚动目标卡片 */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2 pr-4">
          {goals.map((goal, index) => (
            <GoalMilestoneCard
              key={`${goal.title}-${index}`}
              icon={goal.icon}
              title={goal.title}
              subtitle={goal.subtitle}
              current={goal.current}
              target={goal.target}
              unit={goal.unit}
              colorClass={goal.colorClass}
              index={index}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1 bg-slate-700/50" />
      </ScrollArea>
    </motion.div>
  );
};

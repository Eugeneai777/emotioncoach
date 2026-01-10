import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GoalMilestoneCard } from './GoalMilestoneCard';
import { AwakeningLevel } from '@/config/awakeningLevelConfig';
import { ChevronRight } from 'lucide-react';

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
    const futureLevel = {
      4: { level: 4, name: '信念转化者', icon: '⭐', minPoints: 700 },
      5: { level: 5, name: '财富觉醒师', icon: '🌟', minPoints: 1500 },
      6: { level: 6, name: '觉醒大师', icon: '👑', minPoints: 5000 },
    }[nextLevel.level + 1];
    
    if (futureLevel) {
      goals.push({
        icon: futureLevel.icon,
        title: `Lv.${futureLevel.level} ${futureLevel.name}`,
        subtitle: '远期目标',
        current: currentPoints,
        target: futureLevel.minPoints,
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="space-y-2"
    >
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-amber-400">📍</span>
          <span>下一目标</span>
        </div>
        <div className="flex items-center gap-0.5 text-xs text-slate-500">
          <span>滑动查看</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>

      {/* 可滚动目标卡片 */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
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
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </motion.div>
  );
};

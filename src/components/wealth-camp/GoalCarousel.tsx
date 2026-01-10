import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GoalMilestoneCard } from './GoalMilestoneCard';
import { AwakeningLevel, awakeningLevels } from '@/config/awakeningLevelConfig';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // 构建目标列表 - 使用 useMemo 确保在函数中引用前已定义
  const goals = useMemo(() => {
    const result: Array<{
      icon: string;
      title: string;
      subtitle: string;
      current: number;
      target: number;
      unit: string;
      colorClass: string;
    }> = [];

    // 1. 下一等级目标
    if (nextLevel) {
      result.push({
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
      result.push({
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
      result.push({
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
        result.push({
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

    return result;
  }, [currentPoints, currentAwakening, streak, nextLevel]);

  // 滚动到指定卡片
  const scrollToCard = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? Math.min(currentCardIndex + 1, goals.length - 1)
      : Math.max(currentCardIndex - 1, 0);
    
    if (cardRefs.current[newIndex]) {
      cardRefs.current[newIndex]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'start'
      });
      setCurrentCardIndex(newIndex);
    }
  }, [currentCardIndex, goals.length]);

  // 监听滚动更新当前索引
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = 160; // 大约每个卡片宽度
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentCardIndex(Math.min(newIndex, goals.length - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [goals.length]);

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
      {/* 标题 - 带可点击箭头 */}
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
        
        {/* 可点击的左右箭头按钮 */}
        <div className="flex items-center gap-1">
          <motion.button
            onClick={() => scrollToCard('prev')}
            className={`p-1 rounded-full transition-colors ${
              currentCardIndex > 0 
                ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                : 'text-slate-600 cursor-not-allowed'
            }`}
            whileHover={currentCardIndex > 0 ? { scale: 1.1 } : {}}
            whileTap={currentCardIndex > 0 ? { scale: 0.95 } : {}}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <span className="text-xs text-slate-500 min-w-[2rem] text-center">
            {currentCardIndex + 1}/{goals.length}
          </span>
          <motion.button
            onClick={() => scrollToCard('next')}
            className={`p-1 rounded-full transition-colors ${
              currentCardIndex < goals.length - 1 
                ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                : 'text-slate-600 cursor-not-allowed'
            }`}
            whileHover={currentCardIndex < goals.length - 1 ? { scale: 1.1 } : {}}
            whileTap={currentCardIndex < goals.length - 1 ? { scale: 0.95 } : {}}
            disabled={currentCardIndex >= goals.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* 可滚动目标卡片 */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 pb-2 pr-4"
        >
          {goals.map((goal, index) => (
            <div
              key={`${goal.title}-${index}`}
              ref={(el) => { cardRefs.current[index] = el; }}
            >
              <GoalMilestoneCard
                icon={goal.icon}
                title={goal.title}
                subtitle={goal.subtitle}
                current={goal.current}
                target={goal.target}
                unit={goal.unit}
                colorClass={goal.colorClass}
                index={index}
              />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1 bg-slate-700/50" />
      </ScrollArea>
    </motion.div>
  );
};

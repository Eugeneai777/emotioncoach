import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Target, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { GoalMilestoneCard } from './GoalMilestoneCard';
import { awakeningLevels } from '@/config/awakeningLevelConfig';
import { useMemo } from 'react';

interface GraduateContinueCardProps {
  awakeningGrowth?: number;
  isPartner?: boolean;
}

export function GraduateContinueCard({ awakeningGrowth = 0, isPartner = false }: GraduateContinueCardProps) {
  const navigate = useNavigate();
  const { progress, currentLevel, nextLevel, pointsToNext } = useAwakeningProgress();

  const currentAwakening = progress?.current_awakening ?? 0;
  const currentPoints = progress?.total_points ?? 0;
  const streak = progress?.consecutive_days ?? 0;

  // Build next goals list
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

    // 1. Next level target
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

    // 2. Awakening index target (80+)
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

    // 3. Streak target
    const streakTargets = [7, 14, 21, 30];
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

    return result.slice(0, 3); // Max 3 goals
  }, [currentPoints, currentAwakening, streak, nextLevel]);

  // Generate unlock condition hint
  const getUnlockHint = () => {
    if (isPartner) {
      return '你已是觉醒引路人，继续帮助更多人觉醒';
    }
    if (nextLevel && nextLevel.level >= 5) {
      return `解锁 Lv.${nextLevel.level} 需要：成为合伙人 + 完成更多挑战`;
    }
    if (currentAwakening < 80) {
      return '达成 80+ 高度觉醒，解锁专属成就徽章 🌈';
    }
    return '继续每日打卡，巩固你的财富觉醒成果';
  };

  return (
    <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
      
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>
          <h3 className="font-semibold text-lg text-white">你的觉醒之旅仍在继续</h3>
        </motion.div>

        {/* Current status badges */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          {currentLevel && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">
              <span className="mr-1">{currentLevel.icon}</span>
              Lv.{currentLevel.level} {currentLevel.name}
            </Badge>
          )}
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30">
            🎯 觉醒 {currentAwakening}
            {awakeningGrowth !== 0 && (
              <span className={awakeningGrowth > 0 ? 'text-emerald-400 ml-1' : 'text-rose-400 ml-1'}>
                ({awakeningGrowth > 0 ? '+' : ''}{awakeningGrowth})
              </span>
            )}
          </Badge>
          {streak > 0 && (
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30">
              🔥 {streak}天连续
            </Badge>
          )}
        </motion.div>

        {/* Intro text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 text-sm"
        >
          7天只是起点。你已踏上财富觉醒之路，继续前行解锁更高成就。
        </motion.p>

        {/* Next goals section */}
        {goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium">你的下一个目标</span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {goals.map((goal, index) => (
                <div key={`${goal.title}-${index}`} className="flex-shrink-0">
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
          </motion.div>
        )}

        {/* Unlock hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
        >
          <span className="text-amber-400">💡</span>
          <p className="text-sm text-slate-300">{getUnlockHint()}</p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3"
        >
          <Button
            onClick={() => navigate('/wealth-camp-checkin')}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
          >
            继续觉醒之旅
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          {!isPartner && (
            <Button
              variant="outline"
              onClick={() => navigate('/partner/youjin-plan')}
              className="w-full h-11 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <Crown className="w-4 h-4 mr-2" />
              了解合伙人计划 · 加速觉醒
            </Button>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';

interface GraduateContinueCardProps {
  awakeningGrowth?: number;
  isPartner?: boolean;
}

export function GraduateContinueCard({ awakeningGrowth = 0, isPartner = false }: GraduateContinueCardProps) {
  const navigate = useNavigate();
  const { progress, currentLevel } = useAwakeningProgress();

  const currentAwakening = progress?.current_awakening ?? 0;
  const streak = progress?.consecutive_days ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-amber-200/50 dark:border-amber-800/40 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20">
        {/* 顶部装饰条 */}
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        
        <CardContent className="p-4 space-y-3">
          {/* 标题行 */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              恭喜完成训练营
            </h3>
          </div>
          
          {/* 状态徽章 */}
          <div className="flex flex-wrap gap-2">
            {currentLevel && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
                <span className="mr-1">{currentLevel.icon}</span>
                Lv.{currentLevel.level}
              </Badge>
            )}
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700">
              🎯 觉醒 {currentAwakening}
              {awakeningGrowth !== 0 && (
                <span className={awakeningGrowth > 0 ? 'text-emerald-600 dark:text-emerald-400 ml-1' : 'text-rose-600 dark:text-rose-400 ml-1'}>
                  ({awakeningGrowth > 0 ? '+' : ''}{awakeningGrowth})
                </span>
              )}
            </Badge>
            {streak > 0 && (
              <Badge className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700">
                🔥 {streak}天
              </Badge>
            )}
          </div>
          
          {/* 简短引导文案 */}
          <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
            {isPartner 
              ? '继续每日打卡，帮助更多人觉醒' 
              : '继续每日打卡，巩固财富觉醒成果'}
          </p>
          
          {/* 主按钮 */}
          <Button
            onClick={() => navigate('/wealth-camp-checkin')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            继续觉醒之旅
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

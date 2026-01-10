import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckInCelebrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consecutiveDays: number;
  totalDays: number;
  onShare: () => void;
  onInvite: () => void;
  todayIndex?: number;
  yesterdayIndex?: number;
}

export function CheckInCelebrationDialog({
  open,
  onOpenChange,
  consecutiveDays,
  totalDays,
  onShare,
  onInvite,
  todayIndex,
  yesterdayIndex,
}: CheckInCelebrationDialogProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && !showConfetti) {
      setShowConfetti(true);
      // 触发彩带动画
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [open, showConfetti]);

  useEffect(() => {
    if (!open) {
      setShowConfetti(false);
    }
  }, [open]);

  const getMilestoneMessage = () => {
    if (consecutiveDays === 7) return '👑 财富觉醒训练营完美毕业！';
    if (consecutiveDays === 5) return '🏆 中程里程碑达成！';
    if (consecutiveDays === 3) return '🎉 3天坚持达成！';
    if (consecutiveDays === 1) return '🎉 开启觉醒之旅！';
    return '🌟 今日打卡成功！';
  };

  const trendChange = todayIndex !== undefined && yesterdayIndex !== undefined 
    ? todayIndex - yesterdayIndex 
    : null;

  const getEncouragement = () => {
    if (consecutiveDays === 1) return '迈出改变的第一步，你已经超越了99%的人！';
    if (consecutiveDays <= 3) return '坚持的力量正在积累，继续加油！';
    if (consecutiveDays <= 5) return '你的财富思维正在重塑！';
    if (consecutiveDays <= 7) return '7天的蜕变，你已经成为全新的自己！';
    return '训练营完成，继续保持觉察！';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          {/* 动态大图标 */}
          <div className="relative">
            <div className="text-7xl animate-bounce">
              {consecutiveDays >= 7 ? '👑' : consecutiveDays >= 3 ? '🏆' : '🌟'}
            </div>
            <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Day {consecutiveDays}
            </div>
          </div>

          {/* 里程碑消息 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {getMilestoneMessage()}
            </h2>
            <p className="text-muted-foreground">
              {getEncouragement()}
            </p>
          </div>

          {/* Today vs Yesterday Comparison */}
          {todayIndex !== undefined && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">昨日觉醒</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {yesterdayIndex ?? '--'}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">今日觉醒</p>
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {todayIndex}
                  </p>
                  {trendChange !== null && trendChange !== 0 && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      trendChange > 0 
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {trendChange > 0 ? '+' : ''}{trendChange}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 连续打卡天数 */}
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-2xl px-8 py-3 space-y-1">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {consecutiveDays}
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300">
              连续打卡天数
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>训练进度</span>
              <span>{consecutiveDays}/{totalDays} 天</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-1000"
                style={{ width: `${(consecutiveDays / totalDays) * 100}%` }}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300"
              onClick={() => {
                onShare();
                onOpenChange(false);
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享成就
            </Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                onInvite();
                onOpenChange(false);
              }}
            >
              <Gift className="w-4 h-4 mr-2" />
              邀请好友
            </Button>
          </div>

          {/* 关闭提示 */}
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            继续探索
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { motion } from 'framer-motion';
import { Check, Lock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StepConfig {
  step: number;
  icon: string;
  title: string;
  description: string;
  completed: boolean;
  locked: boolean;
  action?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
}

interface WaterfallStepsProps {
  meditationCompleted: boolean;
  coachingCompleted: boolean;
  shareCompleted: boolean;
  inviteCompleted: boolean;
  onCoachingClick: () => void;
  onShareClick: () => void;
  onInviteClick: () => void;
  meditationPlayer: React.ReactNode;
  isMakeupMode?: boolean;
}

export function WaterfallSteps({
  meditationCompleted,
  coachingCompleted,
  shareCompleted,
  inviteCompleted,
  onCoachingClick,
  onShareClick,
  onInviteClick,
  meditationPlayer,
  isMakeupMode = false,
}: WaterfallStepsProps) {
  const allCompleted = meditationCompleted && coachingCompleted && shareCompleted && inviteCompleted;

  const steps: StepConfig[] = [
    {
      step: 1,
      icon: '🧘',
      title: '冥想课程',
      description: '开启今日觉醒',
      completed: meditationCompleted,
      locked: false,
      children: meditationPlayer,
    },
    {
      step: 2,
      icon: '💬',
      title: '教练梳理',
      description: '深度财富对话',
      completed: coachingCompleted,
      locked: !meditationCompleted,
      action: onCoachingClick,
      actionLabel: '开始对话',
    },
    ...(isMakeupMode
      ? []
      : [
          {
            step: 3,
            icon: '📢',
            title: '打卡分享',
            description: '记录成长时刻',
            completed: shareCompleted,
            locked: !meditationCompleted,
            action: onShareClick,
            actionLabel: '去分享',
          },
          {
            step: 4,
            icon: '🎁',
            title: '邀请好友',
            description: '分享觉醒之旅',
            completed: inviteCompleted,
            locked: false,
            action: onInviteClick,
            actionLabel: '邀请好友',
          },
        ]),
  ];

  return (
    <div className="space-y-0">
      {/* 全部完成庆祝横幅 */}
      {allCompleted && !isMakeupMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-300 dark:border-emerald-700 text-center"
        >
          <span className="text-2xl">🎉</span>
          <p className="font-semibold text-emerald-800 dark:text-emerald-200 mt-1">
            今日任务全部完成！
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            坚持每日觉醒，财富能量持续积累
          </p>
        </motion.div>
      )}

      {/* 瀑布流步骤 */}
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.step} className="relative">
            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div className="absolute left-[23px] top-[60px] bottom-0 w-0.5 z-0">
                <div
                  className={cn(
                    'w-full h-full',
                    step.completed
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-300 dark:from-emerald-500 dark:to-emerald-600'
                      : 'bg-gradient-to-b from-amber-300/60 to-amber-200/40 dark:from-amber-600/40 dark:to-amber-700/30'
                  )}
                />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={cn('relative flex gap-3 pb-4', index === steps.length - 1 && 'pb-0')}
            >
              {/* 序号圆圈 */}
              <div className="relative z-10 flex-shrink-0 mt-3">
                <div
                  className={cn(
                    'w-[46px] h-[46px] rounded-full flex items-center justify-center text-lg font-bold shadow-md transition-all duration-300',
                    step.completed
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-200/50 dark:shadow-emerald-800/50'
                      : step.locked
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-200/50 dark:shadow-amber-800/50'
                  )}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : step.locked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <span className="text-base">{step.icon}</span>
                  )}
                </div>
              </div>

              {/* 卡片内容 */}
              <div className="flex-1 min-w-0">
                <Card
                  className={cn(
                    'transition-all duration-300 overflow-hidden',
                    step.completed
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : step.locked
                        ? 'border-muted bg-muted/30 opacity-60'
                        : 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-white to-amber-50/30 dark:from-card dark:to-amber-950/10 shadow-md'
                  )}
                >
                  <CardContent className="p-3 sm:p-4">
                    {/* 标题行 */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {step.title}
                        </span>
                        {step.completed && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium">
                            已完成
                          </span>
                        )}
                        {step.locked && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            完成冥想后解锁
                          </span>
                        )}
                      </div>
                      {step.action && !step.locked && !step.completed && (
                        <Button
                          size="sm"
                          onClick={step.action}
                          className="h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1"
                        >
                          {step.actionLabel}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {step.action && step.completed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={step.action}
                          className="h-8 text-emerald-600 dark:text-emerald-400"
                        >
                          再次{step.actionLabel}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>

                    {/* 子内容（冥想播放器） */}
                    {step.children && (
                      <div className="mt-3">{step.children}</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

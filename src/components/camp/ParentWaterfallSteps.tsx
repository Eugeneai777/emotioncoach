import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ParentWaterfallStepsProps {
  coachingCompleted: boolean;
  shareCompleted: boolean;
  lessonCompleted: boolean;
  onCoachingClick: () => void;
  onShareClick: () => void;
  onLessonClick: () => void;
}

interface StepConfig {
  step: number;
  icon: string;
  title: string;
  description: string;
  completed: boolean;
  locked: boolean;
  action: () => void;
  actionLabel: string;
}

export function ParentWaterfallSteps({
  coachingCompleted,
  shareCompleted,
  lessonCompleted,
  onCoachingClick,
  onShareClick,
  onLessonClick,
}: ParentWaterfallStepsProps) {
  const allCompleted = coachingCompleted && shareCompleted && lessonCompleted;

  const steps: StepConfig[] = [
    {
      step: 1,
      icon: '🌿',
      title: '亲子教练对话',
      description: '和劲老师完成四部曲觉察旅程',
      completed: coachingCompleted,
      locked: false,
      action: onCoachingClick,
      actionLabel: '开始对话',
    },
    {
      step: 2,
      icon: '📢',
      title: '打卡分享',
      description: '记录成长心得，获得社区支持',
      completed: shareCompleted,
      locked: !coachingCompleted,
      action: onShareClick,
      actionLabel: '去分享',
    },
    {
      step: 3,
      icon: '📖',
      title: '今日课程',
      description: '观看推荐课程，加速成长',
      completed: lessonCompleted,
      locked: false,
      action: onLessonClick,
      actionLabel: '查看课程',
    },
  ];

  return (
    <div className="space-y-0">
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-300 dark:border-purple-700 text-center"
        >
          <span className="text-2xl">🎉</span>
          <p className="font-semibold text-purple-800 dark:text-purple-200 mt-1">
            今日任务全部完成！
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            坚持每日觉察，亲子关系持续改善
          </p>
        </motion.div>
      )}

      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.step} className="relative">
            {index < steps.length - 1 && (
              <div className="absolute left-[23px] top-[60px] bottom-0 w-0.5 z-0">
                <div
                  className={cn(
                    'w-full h-full',
                    step.completed
                      ? 'bg-gradient-to-b from-purple-400 to-purple-300 dark:from-purple-500 dark:to-purple-600'
                      : 'bg-gradient-to-b from-purple-300/60 to-purple-200/40 dark:from-purple-600/40 dark:to-purple-700/30'
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
              <div className="relative z-10 flex-shrink-0 mt-3">
                <div
                  className={cn(
                    'w-[46px] h-[46px] rounded-full flex items-center justify-center text-lg font-bold shadow-md transition-all duration-300',
                    step.completed
                      ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-purple-200/50 dark:shadow-purple-800/50'
                      : step.locked
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-purple-200/50 dark:shadow-purple-800/50'
                  )}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-base">{step.icon}</span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <Card
                  className={cn(
                    'transition-all duration-300 overflow-hidden',
                    step.completed
                      ? 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20'
                      : step.locked
                        ? 'border-muted bg-muted/30 opacity-60'
                        : 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50/30 dark:from-card dark:to-purple-950/10 shadow-md'
                  )}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{step.title}</span>
                        {step.completed && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium">
                            已完成
                          </span>
                        )}
                        {step.locked && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            完成对话后解锁
                          </span>
                        )}
                      </div>
                      {!step.locked && !step.completed && (
                        <Button
                          size="sm"
                          onClick={step.action}
                          className="h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-1"
                        >
                          {step.actionLabel}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {step.completed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={step.action}
                          className="h-8 text-purple-600 dark:text-purple-400"
                        >
                          再次{step.actionLabel}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
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

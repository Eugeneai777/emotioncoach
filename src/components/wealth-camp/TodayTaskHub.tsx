import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Lock, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { taskCardStyles, cardBaseStyles } from '@/config/cardStyleConfig';

export type UserMode = 'active' | 'graduate' | 'partner';

interface Task {
  id: string;
  title: string;
  description?: string;
  icon: string;
  completed: boolean;
  locked?: boolean;
  lockReason?: string;
  points: number;
  action?: () => void;
  highlight?: boolean;
  optional?: boolean;
}

interface TodayTaskHubProps {
  meditationCompleted: boolean;
  coachingCompleted: boolean;
  shareCompleted: boolean;
  inviteCompleted: boolean;
  challengeCompleted?: boolean;
  actionCompleted?: boolean;
  onMeditationClick: () => void;
  onCoachingClick: () => void;
  onShareClick: () => void;
  onInviteClick: () => void;
  onChallengeClick?: () => void;
  onActionClick?: () => void;
  onGraduationClick?: () => void;
  hasChallenge?: boolean;
  hasAction?: boolean;
  className?: string;
  // New props for graduate/partner mode
  userMode?: UserMode;
  cycleWeek?: number;
  cycleMeditationDay?: number;
  // Graduation report
  currentDay?: number;
  hasGraduationReport?: boolean;
  graduationReportViewed?: boolean;
}

export function TodayTaskHub({
  meditationCompleted,
  coachingCompleted,
  shareCompleted,
  inviteCompleted,
  challengeCompleted = false,
  actionCompleted = false,
  onMeditationClick,
  onCoachingClick,
  onShareClick,
  onInviteClick,
  onChallengeClick,
  onActionClick,
  onGraduationClick,
  hasChallenge = false,
  hasAction = false,
  className,
  userMode = 'active',
  cycleWeek = 1,
  cycleMeditationDay = 1,
  currentDay = 1,
  hasGraduationReport = false,
  graduationReportViewed = false,
}: TodayTaskHubProps) {
  
  // Build tasks based on user mode
  const tasks: Task[] = buildTaskList({
    userMode,
    meditationCompleted,
    coachingCompleted,
    shareCompleted,
    inviteCompleted,
    challengeCompleted,
    actionCompleted,
    onMeditationClick,
    onCoachingClick,
    onShareClick,
    onInviteClick,
    onChallengeClick,
    onActionClick,
    onGraduationClick,
    hasChallenge,
    hasAction,
    cycleWeek,
    cycleMeditationDay,
    currentDay,
    hasGraduationReport,
    graduationReportViewed,
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);

  // Mode-specific header
  const getModeLabel = () => {
    switch (userMode) {
      case 'graduate':
        return '毕业生模式';
      case 'partner':
        return '合伙人模式';
      default:
        return null;
    }
  };

  const modeLabel = getModeLabel();

  return (
    <Card className={cn(
      cardBaseStyles.container,
      taskCardStyles.primary.container,
      className
    )}>
      {/* Header with gradient */}
      <div className={cn(
        "px-4 py-3 rounded-t-xl",
        taskCardStyles.primary.header,
        taskCardStyles.primary.headerBorder
      )}>
        <div className="flex items-center justify-between">
          <h3 className={cn("font-medium flex items-center gap-2", taskCardStyles.primary.headerText)}>
            <span>📋</span> 
            今日任务 
            <span className="text-sm opacity-70">
              ({completedCount}/{tasks.length})
            </span>
            {modeLabel && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                userMode === 'partner' 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" 
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              )}>
                {modeLabel}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1 text-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-medium">+{earnedPoints}</span>
            <span className="text-muted-foreground">/{totalPoints}分</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">

        {/* Task List */}
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                task.completed 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" 
                  : task.locked
                    ? "bg-muted/30 opacity-60"
                    : task.highlight
                      ? "bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-950/50"
                      : "bg-muted/50 cursor-pointer hover:bg-muted"
              )}
              onClick={task.locked ? undefined : task.action}
            >
              {/* Icon */}
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center text-lg",
                task.completed 
                  ? "bg-emerald-100 dark:bg-emerald-900/50" 
                  : task.highlight
                    ? "bg-amber-100 dark:bg-amber-900/50"
                    : "bg-background"
              )}>
                {task.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{task.title}</span>
                  {task.optional && (
                    <span className="text-xs text-muted-foreground">(可选)</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {task.locked ? task.lockReason : task.description}
                </div>
              </div>

              {/* Points Badge */}
              <div className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                task.completed 
                  ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              )}>
                +{task.points}分
              </div>

              {/* Status Icon */}
              {task.completed ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : task.locked ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Completion Message */}
        {completedCount === tasks.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-200 dark:border-emerald-700 text-center"
          >
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">
              🎉 今日任务全部完成！太棒了！
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to build task list based on mode
function buildTaskList({
  userMode,
  meditationCompleted,
  coachingCompleted,
  shareCompleted,
  inviteCompleted,
  challengeCompleted,
  actionCompleted,
  onMeditationClick,
  onCoachingClick,
  onShareClick,
  onInviteClick,
  onChallengeClick,
  onActionClick,
  onGraduationClick,
  hasChallenge,
  hasAction,
  cycleWeek,
  cycleMeditationDay,
  currentDay,
  hasGraduationReport,
  graduationReportViewed,
}: {
  userMode: UserMode;
  meditationCompleted: boolean;
  coachingCompleted: boolean;
  shareCompleted: boolean;
  inviteCompleted: boolean;
  challengeCompleted: boolean;
  actionCompleted: boolean;
  onMeditationClick: () => void;
  onCoachingClick: () => void;
  onShareClick: () => void;
  onInviteClick: () => void;
  onChallengeClick?: () => void;
  onActionClick?: () => void;
  onGraduationClick?: () => void;
  hasChallenge: boolean;
  hasAction: boolean;
  cycleWeek: number;
  cycleMeditationDay: number;
  currentDay: number;
  hasGraduationReport: boolean;
  graduationReportViewed: boolean;
}): Task[] {
  // Active mode (7-day training camp)
  if (userMode === 'active') {
    const baseTasks: Task[] = [
      {
        id: 'meditation',
        title: '冥想课程',
        description: '开启今日觉醒',
        icon: '🧘',
        completed: meditationCompleted,
        points: 10,
        action: onMeditationClick,
      },
      {
        id: 'coaching',
        title: '教练梳理',
        description: '深度财富对话',
        icon: '💬',
        completed: coachingCompleted,
        locked: !meditationCompleted,
        lockReason: '完成冥想后解锁',
        points: 20,
        action: onCoachingClick,
        highlight: meditationCompleted && !coachingCompleted,
      },
      ...(hasChallenge ? [{
        id: 'challenge',
        title: '每日挑战',
        description: 'AI 定制成长任务',
        icon: '🎯',
        completed: challengeCompleted,
        locked: !coachingCompleted,
        lockReason: '完成教练后解锁',
        points: 15,
        action: onChallengeClick,
      }] : []),
      ...(hasAction ? [{
        id: 'action',
        title: '给予行动',
        description: '践行财富能量',
        icon: '💝',
        completed: actionCompleted,
        locked: !coachingCompleted,
        lockReason: '待教练梳理生成',
        points: 10,
        action: onActionClick,
      }] : []),
      {
        id: 'share',
        title: '打卡分享',
        description: '记录成长时刻',
        icon: '📢',
        completed: shareCompleted,
        locked: !coachingCompleted,
        lockReason: '完成教练后解锁',
        points: 5,
        action: onShareClick,
      },
      {
        id: 'invite',
        title: '邀请好友',
        description: '分享成长之旅',
        icon: '🎁',
        completed: inviteCompleted,
        points: 5,
        action: onInviteClick,
      },
    ];
    
    // Add graduation task at top when Day >= 7
    if (currentDay >= 7 && onGraduationClick) {
      const graduationTask: Task = {
        id: 'graduation',
        title: hasGraduationReport ? '查看毕业报告' : '🎓 生成毕业报告',
        description: hasGraduationReport ? '查看你的7天成长总结' : '完成训练营，生成专属成长报告',
        icon: '🎓',
        completed: graduationReportViewed,
        points: hasGraduationReport ? 0 : 30,
        action: onGraduationClick,
        highlight: !hasGraduationReport,
      };
      return [graduationTask, ...baseTasks];
    }
    
    return baseTasks;
  }

  // Graduate mode (completed camp, not partner)
  if (userMode === 'graduate') {
    return [
      {
        id: 'meditation',
        title: `循环冥想 Day ${cycleMeditationDay}`,
        description: `第${cycleWeek}周 · 第${cycleWeek}次聆听`,
        icon: '🧘',
        completed: meditationCompleted,
        points: 5,
        action: onMeditationClick,
        optional: true,
      },
      {
        id: 'challenge',
        title: '每日挑战',
        description: 'AI 定制觉醒任务',
        icon: '🎯',
        completed: challengeCompleted,
        points: 15,
        action: onChallengeClick,
        highlight: !challengeCompleted,
      },
      {
        id: 'share',
        title: '打卡分享',
        description: '记录持续成长',
        icon: '📢',
        completed: shareCompleted,
        points: 5,
        action: onShareClick,
      },
      {
        id: 'invite',
        title: '邀请好友',
        description: '分享觉醒之旅',
        icon: '🎁',
        completed: inviteCompleted,
        points: 5,
        action: onInviteClick,
      },
    ];
  }

  // Partner mode (completed camp + is partner)
  return [
    {
      id: 'meditation',
      title: `循环冥想 Day ${cycleMeditationDay}`,
      description: `第${cycleWeek}周 · 第${cycleWeek}次聆听`,
      icon: '🧘',
      completed: meditationCompleted,
      points: 5,
      action: onMeditationClick,
      optional: true,
    },
    {
      id: 'challenge',
      title: '每日挑战',
      description: 'AI 专属成长任务',
      icon: '🎯',
      completed: challengeCompleted,
      points: 20,
      action: onChallengeClick,
      highlight: !challengeCompleted,
    },
    ...(hasAction ? [{
      id: 'action',
      title: '给予行动',
      description: '践行财富能量',
      icon: '💝',
      completed: actionCompleted,
      points: 10,
      action: onActionClick,
    }] : []),
    {
      id: 'share',
      title: '打卡分享',
      description: '影响更多人',
      icon: '📢',
      completed: shareCompleted,
      points: 5,
      action: onShareClick,
    },
    {
      id: 'invite',
      title: '邀请好友',
      description: '发展你的团队',
      icon: '🎁',
      completed: inviteCompleted,
      points: 10,
      action: onInviteClick,
    },
  ];
}

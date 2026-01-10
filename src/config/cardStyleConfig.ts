// 今日任务区域统一卡片样式配置
// 基于 wealthStyleConfig.ts 的三层色彩系统扩展

export const taskCardStyles = {
  // 主任务卡片容器（TodayTaskHub）
  primary: {
    container: "bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-900/50 dark:to-slate-950/30 border-slate-200/60 dark:border-slate-700/40",
    header: "bg-gradient-to-r from-amber-100/60 to-orange-100/40 dark:from-amber-900/30 dark:to-orange-900/20",
    headerText: "text-amber-800 dark:text-amber-200",
    headerBorder: "border-b border-amber-200/30 dark:border-amber-800/30",
  },
  
  // 挑战卡片（DailyChallengeCard）- Amber/Orange
  challenge: {
    container: "bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/40",
    header: "bg-gradient-to-r from-amber-100/70 to-orange-100/50 dark:from-amber-900/40 dark:to-orange-900/30",
    headerText: "text-amber-800 dark:text-amber-200",
    headerBorder: "border-b border-amber-200/30 dark:border-amber-800/30",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500",
  },
  
  // 行动卡片（DailyActionCard）- Emerald/Teal
  action: {
    container: "bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/40",
    header: "bg-gradient-to-r from-emerald-100/70 to-teal-100/50 dark:from-emerald-900/40 dark:to-teal-900/30",
    headerText: "text-emerald-800 dark:text-emerald-200",
    headerBorder: "border-b border-emerald-200/30 dark:border-emerald-800/30",
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500",
  },
  
  // 邀请卡片（WealthCampInviteCard）- Violet/Purple
  invite: {
    container: "bg-gradient-to-br from-violet-50/70 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-200/50 dark:border-violet-800/40",
    header: "bg-gradient-to-r from-violet-100/70 to-purple-100/50 dark:from-violet-900/40 dark:to-purple-900/30",
    headerText: "text-violet-800 dark:text-violet-200",
    headerBorder: "border-b border-violet-200/30 dark:border-violet-800/30",
    icon: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-500",
  },
};

// 完成状态统一样式
export const taskCompletionStyles = {
  completed: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
  inProgress: "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700",
  locked: "bg-muted/30 opacity-60",
  pending: "bg-amber-50 border-2 border-amber-400 dark:bg-amber-950/40 dark:border-amber-600",
};

// 积分徽章统一样式
export const pointsBadgeStyles = {
  completed: "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
};

// 统一动画配置
export const cardAnimationConfig = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

// 统一阴影和圆角
export const cardBaseStyles = {
  container: "rounded-xl shadow-sm hover:shadow-md transition-shadow",
  innerItem: "rounded-lg",
  badge: "rounded-full",
};

// 教练主题工具函数 - 动态生成教练特色背景和颜色

export const getCoachBackgroundGradient = (primaryColor: string): string => {
  const colorMap: Record<string, string> = {
    green: 'from-emerald-50/80 via-teal-50/50 to-green-50/30 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-green-950/10',
    blue: 'from-blue-50/80 via-indigo-50/50 to-violet-50/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-violet-950/10',
    purple: 'from-purple-50/80 via-pink-50/50 to-rose-50/30 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-rose-950/10',
    rose: 'from-rose-50/80 via-red-50/50 to-orange-50/30 dark:from-rose-950/20 dark:via-red-950/10 dark:to-orange-950/10',
    red: 'from-rose-50/80 via-red-50/50 to-orange-50/30 dark:from-rose-950/20 dark:via-red-950/10 dark:to-orange-950/10',
    teal: 'from-teal-50/80 via-cyan-50/50 to-blue-50/30 dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10',
    orange: 'from-orange-50/80 via-amber-50/50 to-yellow-50/30 dark:from-orange-950/20 dark:via-amber-950/10 dark:to-yellow-950/10',
    pink: 'from-pink-50/80 via-rose-50/50 to-fuchsia-50/30 dark:from-pink-950/20 dark:via-rose-950/10 dark:to-fuchsia-950/10',
  };
  return colorMap[primaryColor] || colorMap.teal;
};

export const getCoachLoaderColor = (primaryColor: string): string => {
  const colorMap: Record<string, string> = {
    green: 'text-emerald-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    rose: 'text-rose-500',
    red: 'text-rose-500',
    teal: 'text-teal-500',
    orange: 'text-orange-500',
    pink: 'text-pink-500',
  };
  return colorMap[primaryColor] || 'text-primary';
};

export const getCoachAccentColor = (primaryColor: string): string => {
  const colorMap: Record<string, string> = {
    green: 'emerald',
    blue: 'blue',
    purple: 'purple',
    rose: 'rose',
    red: 'rose',
    teal: 'teal',
    orange: 'orange',
    pink: 'pink',
  };
  return colorMap[primaryColor] || 'primary';
};

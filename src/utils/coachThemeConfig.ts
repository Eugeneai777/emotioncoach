// 统一教练主题色配置系统
// 优先从数据库读取 theme_config，回退到默认配置

export interface CoachThemeConfig {
  backgroundGradient?: {
    light: string;
    dark: string;
  };
  stepCard?: {
    light: string;
    dark: string;
  };
  stepIcon?: {
    light: string;
    dark: string;
  };
  loaderColor?: string;
  accentColor?: string;
}

// 默认主题配置（当数据库未配置时的回退）
const DEFAULT_THEMES: Record<string, CoachThemeConfig> = {
  green: {
    backgroundGradient: {
      light: 'from-emerald-50/80 via-teal-50/50 to-green-50/30',
      dark: 'from-emerald-950/20 via-teal-950/10 to-green-950/10'
    },
    stepCard: {
      light: 'bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-green-50/50 border-emerald-200/50',
      dark: 'from-emerald-950/30 via-teal-950/20 to-green-950/20 border-emerald-800/30'
    },
    stepIcon: {
      light: 'bg-emerald-100 text-emerald-600',
      dark: 'bg-emerald-900/50 text-emerald-400'
    },
    loaderColor: 'text-emerald-500',
    accentColor: 'emerald'
  },
  purple: {
    backgroundGradient: {
      light: 'from-purple-50/80 via-pink-50/50 to-rose-50/30',
      dark: 'from-purple-950/20 via-pink-950/10 to-rose-950/10'
    },
    stepCard: {
      light: 'bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-rose-50/50 border-purple-200/50',
      dark: 'from-purple-950/30 via-pink-950/20 to-rose-950/20 border-purple-800/30'
    },
    stepIcon: {
      light: 'bg-purple-100 text-purple-600',
      dark: 'bg-purple-900/50 text-purple-400'
    },
    loaderColor: 'text-purple-500',
    accentColor: 'purple'
  },
  blue: {
    backgroundGradient: {
      light: 'from-blue-50/80 via-indigo-50/50 to-violet-50/30',
      dark: 'from-blue-950/20 via-indigo-950/10 to-violet-950/10'
    },
    stepCard: {
      light: 'bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-violet-50/50 border-blue-200/50',
      dark: 'from-blue-950/30 via-indigo-950/20 to-violet-950/20 border-blue-800/30'
    },
    stepIcon: {
      light: 'bg-blue-100 text-blue-600',
      dark: 'bg-blue-900/50 text-blue-400'
    },
    loaderColor: 'text-blue-500',
    accentColor: 'blue'
  },
  pink: {
    backgroundGradient: {
      light: 'from-pink-50/80 via-rose-50/50 to-fuchsia-50/30',
      dark: 'from-pink-950/20 via-rose-950/10 to-fuchsia-950/10'
    },
    stepCard: {
      light: 'bg-gradient-to-br from-pink-50/80 via-rose-50/60 to-fuchsia-50/50 border-pink-200/50',
      dark: 'from-pink-950/30 via-rose-950/20 to-fuchsia-950/20 border-pink-800/30'
    },
    stepIcon: {
      light: 'bg-pink-100 text-pink-600',
      dark: 'bg-pink-900/50 text-pink-400'
    },
    loaderColor: 'text-pink-500',
    accentColor: 'pink'
  },
  teal: {
    backgroundGradient: {
      light: 'from-teal-50/80 via-cyan-50/50 to-blue-50/30',
      dark: 'from-teal-950/20 via-cyan-950/10 to-blue-950/10'
    },
    stepCard: {
      light: 'bg-gradient-to-br from-teal-50/80 via-cyan-50/60 to-blue-50/50 border-teal-200/50',
      dark: 'from-teal-950/30 via-cyan-950/20 to-blue-950/20 border-teal-800/30'
    },
    stepIcon: {
      light: 'bg-teal-100 text-teal-600',
      dark: 'bg-teal-900/50 text-teal-400'
    },
    loaderColor: 'text-teal-500',
    accentColor: 'teal'
  },
  orange: {
    backgroundGradient: {
      light: 'from-orange-50/80 via-amber-50/50 to-yellow-50/30',
      dark: 'from-orange-950/20 via-amber-950/10 to-yellow-950/10'
    },
    stepCard: {
      light: 'bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/50 border-orange-200/50',
      dark: 'from-orange-950/30 via-amber-950/20 to-yellow-950/20 border-orange-800/30'
    },
    stepIcon: {
      light: 'bg-orange-100 text-orange-600',
      dark: 'bg-orange-900/50 text-orange-400'
    },
    loaderColor: 'text-orange-500',
    accentColor: 'orange'
  },
  amber: {
    backgroundGradient: {
      light: 'from-amber-50/80 via-orange-50/50 to-yellow-50/30',
      dark: 'from-amber-950/20 via-orange-950/10 to-yellow-950/10'
    },
    stepCard: {
      light: 'bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/50 border-amber-200/50',
      dark: 'from-amber-950/30 via-orange-950/20 to-yellow-950/20 border-amber-800/30'
    },
    stepIcon: {
      light: 'bg-amber-100 text-amber-600',
      dark: 'bg-amber-900/50 text-amber-400'
    },
    loaderColor: 'text-amber-500',
    accentColor: 'amber'
  },
  rose: {
    backgroundGradient: {
      light: 'from-rose-50/80 via-red-50/50 to-orange-50/30',
      dark: 'from-rose-950/20 via-red-950/10 to-orange-950/10'
    },
    stepCard: {
      light: 'bg-gradient-to-br from-rose-50/80 via-red-50/60 to-orange-50/50 border-rose-200/50',
      dark: 'from-rose-950/30 via-red-950/20 to-orange-950/20 border-rose-800/30'
    },
    stepIcon: {
      light: 'bg-rose-100 text-rose-600',
      dark: 'bg-rose-900/50 text-rose-400'
    },
    loaderColor: 'text-rose-500',
    accentColor: 'rose'
  }
};

// 从教练模板获取主题配置（优先数据库，回退默认）
export const getCoachTheme = (
  primaryColor: string,
  themeConfig?: CoachThemeConfig | null
): CoachThemeConfig => {
  if (themeConfig && Object.keys(themeConfig).length > 0) {
    return themeConfig;
  }
  return DEFAULT_THEMES[primaryColor] || DEFAULT_THEMES.teal;
};

// 获取背景渐变
export const getThemeBackgroundGradient = (
  primaryColor: string,
  themeConfig?: CoachThemeConfig | null
): string => {
  const theme = getCoachTheme(primaryColor, themeConfig);
  // 合并 light 和 dark 模式
  const light = theme.backgroundGradient?.light || '';
  const dark = theme.backgroundGradient?.dark || '';
  return `${light} dark:${dark.split(' ').join(' dark:')}`;
};

// 获取步骤卡片样式
export const getThemeStepCardStyle = (
  primaryColor: string,
  themeConfig?: CoachThemeConfig | null
): string => {
  const theme = getCoachTheme(primaryColor, themeConfig);
  const light = theme.stepCard?.light || 'bg-background/50 border-border/50';
  const dark = theme.stepCard?.dark || '';
  if (dark) {
    return `${light} dark:${dark.split(' ').join(' dark:')}`;
  }
  return light;
};

// 获取步骤图标样式
export const getThemeStepIconStyle = (
  primaryColor: string,
  themeConfig?: CoachThemeConfig | null
): string => {
  const theme = getCoachTheme(primaryColor, themeConfig);
  const light = theme.stepIcon?.light || 'bg-primary/15 text-primary';
  const dark = theme.stepIcon?.dark || '';
  if (dark) {
    return `${light} dark:${dark.split(' ').join(' dark:')}`;
  }
  return light;
};

// 获取加载器颜色
export const getThemeLoaderColor = (
  primaryColor: string,
  themeConfig?: CoachThemeConfig | null
): string => {
  const theme = getCoachTheme(primaryColor, themeConfig);
  return theme.loaderColor || 'text-primary';
};

// 获取强调色
export const getThemeAccentColor = (
  primaryColor: string,
  themeConfig?: CoachThemeConfig | null
): string => {
  const theme = getCoachTheme(primaryColor, themeConfig);
  return theme.accentColor || 'primary';
};

// 获取文字颜色类名
export const getThemeTextColor = (
  primaryColor: string,
  themeConfig?: CoachThemeConfig | null
): string => {
  const accent = getThemeAccentColor(primaryColor, themeConfig);
  return `text-${accent}-800 dark:text-${accent}-200`;
};

// 获取次要文字颜色类名
export const getThemeSecondaryTextColor = (
  primaryColor: string,
  themeConfig?: CoachThemeConfig | null
): string => {
  const accent = getThemeAccentColor(primaryColor, themeConfig);
  return `text-${accent}-600 dark:text-${accent}-400`;
};

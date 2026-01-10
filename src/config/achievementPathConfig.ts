// 成就路径配置 - 与等级系统和每日任务对齐
import { awakeningLevels } from './awakeningLevelConfig';

export interface AchievementNode {
  key: string;
  name: string;
  icon: string;
  description: string;
  // 对应等级 (1-6)
  mappedLevel?: number;
  // 解锁条件
  unlockCondition: {
    type: 'journal_days' | 'streak_days' | 'score' | 'awakening' | 'referrals' | 'share';
    target: number;
    field?: 'behavior' | 'emotion' | 'belief' | 'all';
  };
  // 每日任务关联
  dailyTaskHint: string;
  // 解锁奖励积分
  rewardPoints: number;
}

export interface AchievementPath {
  key: 'milestone' | 'streak' | 'growth' | 'social';
  title: string;
  icon: string;
  ultimateGoal: {
    icon: string;
    name: string;
    description: string;
  };
  // 主题色 (与 cardStyleConfig 对齐)
  theme: {
    gradient: string;
    bgActive: string;
    bgLocked: string;
    border: string;
    text: string;
  };
  achievements: AchievementNode[];
}

// 获取等级图标
const getLevelIcon = (level: number): string => {
  const levelData = awakeningLevels.find(l => l.level === level);
  return levelData?.icon || '🌱';
};

export const achievementPaths: AchievementPath[] = [
  {
    key: 'milestone',
    title: '里程碑之路',
    icon: '🎯',
    ultimateGoal: {
      icon: '👑',
      name: 'Lv6 觉醒大师',
      description: '邀请5位学员完成训练营',
    },
    theme: {
      gradient: 'from-amber-500 to-orange-500',
      bgActive: 'bg-amber-500/20',
      bgLocked: 'bg-slate-100 dark:bg-slate-800/50',
      border: 'border-amber-400/50',
      text: 'text-amber-600 dark:text-amber-400',
    },
    achievements: [
      {
        key: 'first_awakening',
        name: '觉醒起点',
        icon: '🎯',
        description: '完成财富测评，开启觉醒之旅',
        mappedLevel: 1,
        unlockCondition: { type: 'journal_days', target: 0 },
        dailyTaskHint: '完成财富测评',
        rewardPoints: 10,
      },
      {
        key: 'day1_complete',
        name: '第一步',
        icon: '👣',
        description: '完成 Day 1 打卡',
        mappedLevel: 2,
        unlockCondition: { type: 'journal_days', target: 1 },
        dailyTaskHint: '冥想 + 教练梳理',
        rewardPoints: 20,
      },
      {
        key: 'day3_complete',
        name: '中途不弃',
        icon: '💪',
        description: '完成 Day 3 打卡',
        mappedLevel: 3,
        unlockCondition: { type: 'journal_days', target: 3 },
        dailyTaskHint: '坚持每日打卡',
        rewardPoints: 30,
      },
      {
        key: 'camp_graduate',
        name: '7天觉醒者',
        icon: '🎓',
        description: '完成训练营毕业',
        mappedLevel: 4,
        unlockCondition: { type: 'journal_days', target: 7 },
        dailyTaskHint: '完成全部7天打卡',
        rewardPoints: 50,
      },
      {
        key: 'become_partner',
        name: '觉醒引路人',
        icon: '🤝',
        description: '成为有劲合伙人',
        mappedLevel: 5,
        unlockCondition: { type: 'referrals', target: 1 },
        dailyTaskHint: '购买合伙人套餐',
        rewardPoints: 100,
      },
    ],
  },
  {
    key: 'streak',
    title: '坚持之路',
    icon: '🔥',
    ultimateGoal: {
      icon: '🔥',
      name: '月月觉醒',
      description: '连续30天打卡',
    },
    theme: {
      gradient: 'from-orange-500 to-red-500',
      bgActive: 'bg-orange-500/20',
      bgLocked: 'bg-slate-100 dark:bg-slate-800/50',
      border: 'border-orange-400/50',
      text: 'text-orange-600 dark:text-orange-400',
    },
    achievements: [
      {
        key: 'streak_3',
        name: '三日坚持',
        icon: '🔥',
        description: '连续打卡3天',
        unlockCondition: { type: 'streak_days', target: 3 },
        dailyTaskHint: '完成今日教练梳理',
        rewardPoints: 15,
      },
      {
        key: 'streak_7',
        name: '周周精进',
        icon: '🔥',
        description: '连续打卡7天',
        unlockCondition: { type: 'streak_days', target: 7 },
        dailyTaskHint: '保持每日打卡',
        rewardPoints: 30,
      },
      {
        key: 'streak_14',
        name: '两周如一',
        icon: '🔥',
        description: '连续打卡14天',
        unlockCondition: { type: 'streak_days', target: 14 },
        dailyTaskHint: '毕业后继续循环冥想',
        rewardPoints: 50,
      },
      {
        key: 'streak_30',
        name: '月月觉醒',
        icon: '🔥',
        description: '连续打卡30天',
        unlockCondition: { type: 'streak_days', target: 30 },
        dailyTaskHint: '坚持每日挑战任务',
        rewardPoints: 100,
      },
    ],
  },
  {
    key: 'growth',
    title: '成长之路',
    icon: '🌟',
    ultimateGoal: {
      icon: '🌈',
      name: '高度觉醒',
      description: '觉醒指数达到80+',
    },
    theme: {
      gradient: 'from-violet-500 to-purple-500',
      bgActive: 'bg-violet-500/20',
      bgLocked: 'bg-slate-100 dark:bg-slate-800/50',
      border: 'border-violet-400/50',
      text: 'text-violet-600 dark:text-violet-400',
    },
    achievements: [
      {
        key: 'behavior_breakthrough',
        name: '行为突破者',
        icon: '🏃',
        description: '行为层评分达到4分',
        unlockCondition: { type: 'score', target: 4, field: 'behavior' },
        dailyTaskHint: '教练梳理 → 行为层',
        rewardPoints: 20,
      },
      {
        key: 'emotion_breakthrough',
        name: '情绪突破者',
        icon: '💗',
        description: '情绪层评分达到4分',
        unlockCondition: { type: 'score', target: 4, field: 'emotion' },
        dailyTaskHint: '教练梳理 → 情绪层',
        rewardPoints: 20,
      },
      {
        key: 'belief_breakthrough',
        name: '信念突破者',
        icon: '💎',
        description: '信念层评分达到4分',
        unlockCondition: { type: 'score', target: 4, field: 'belief' },
        dailyTaskHint: '教练梳理 → 信念层',
        rewardPoints: 20,
      },
      {
        key: 'triple_perfect',
        name: '三层通达',
        icon: '✨',
        description: '单日三层评分均达5分',
        unlockCondition: { type: 'score', target: 5, field: 'all' },
        dailyTaskHint: '深度完成教练梳理',
        rewardPoints: 50,
      },
      {
        key: 'awakening_80',
        name: '高度觉醒',
        icon: '🌈',
        description: '觉醒指数达到80+',
        unlockCondition: { type: 'awakening', target: 80 },
        dailyTaskHint: '持续提升三层评分',
        rewardPoints: 100,
      },
    ],
  },
  {
    key: 'social',
    title: '社交之路',
    icon: '💫',
    ultimateGoal: {
      icon: '🎖️',
      name: '觉醒导师',
      description: '邀请10人加入训练营',
    },
    theme: {
      gradient: 'from-emerald-500 to-teal-500',
      bgActive: 'bg-emerald-500/20',
      bgLocked: 'bg-slate-100 dark:bg-slate-800/50',
      border: 'border-emerald-400/50',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    achievements: [
      {
        key: 'first_share',
        name: '分享先锋',
        icon: '📢',
        description: '首次分享成长卡片',
        unlockCondition: { type: 'share', target: 1 },
        dailyTaskHint: '完成"分享成长"任务',
        rewardPoints: 10,
      },
      {
        key: 'invite_1',
        name: '邀请达人',
        icon: '💌',
        description: '成功邀请1人加入',
        unlockCondition: { type: 'referrals', target: 1 },
        dailyTaskHint: '完成"邀请好友"任务',
        rewardPoints: 30,
      },
      {
        key: 'invite_5',
        name: '小团队长',
        icon: '👥',
        description: '成功邀请5人加入',
        unlockCondition: { type: 'referrals', target: 5 },
        dailyTaskHint: '持续邀请好友',
        rewardPoints: 80,
      },
      {
        key: 'invite_10',
        name: '觉醒导师',
        icon: '🎖️',
        description: '成功邀请10人加入',
        unlockCondition: { type: 'referrals', target: 10 },
        dailyTaskHint: '成为活跃合伙人',
        rewardPoints: 150,
      },
    ],
  },
];

// 获取所有成就的平铺列表
export const getAllAchievements = () => {
  return achievementPaths.flatMap(path => 
    path.achievements.map(a => ({
      ...a,
      category: path.key,
      pathTitle: path.title,
    }))
  );
};

// 获取成就对应的等级信息
export const getAchievementLevelInfo = (achievement: AchievementNode) => {
  if (!achievement.mappedLevel) return null;
  const levelData = awakeningLevels.find(l => l.level === achievement.mappedLevel);
  return levelData ? {
    level: levelData.level,
    name: levelData.name,
    icon: levelData.icon,
  } : null;
};

// 终极目标配置 (Lv6)
export const ultimateGoal = {
  level: 6,
  icon: '👑',
  name: '觉醒大师',
  description: '邀请5位学员完成训练营',
  conditions: [
    { label: '学员毕业', target: 5, unit: '人' },
    { label: '总积分', target: 5000, unit: '分' },
  ],
};

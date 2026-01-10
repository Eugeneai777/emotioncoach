// 觉醒等级系统配置

export interface AwakeningLevel {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
  description: string;
  unlockCondition: string;
}

export interface Achievement {
  key: string;
  name: string;
  icon: string;
  description: string;
  category: 'milestone' | 'streak' | 'growth' | 'social';
}

export interface PointsRule {
  action: string;
  basePoints: number;
  bonusCondition?: string;
  bonusPoints?: number;
}

// 6级觉醒等级体系
export const awakeningLevels: AwakeningLevel[] = [
  {
    level: 1,
    name: '觉醒探索者',
    icon: '🌱',
    minPoints: 0,
    description: '刚刚开始觉醒之旅',
    unlockCondition: '完成财富测评',
  },
  {
    level: 2,
    name: '觉察学徒',
    icon: '🌿',
    minPoints: 100,
    description: '开始觉察自己的财富模式',
    unlockCondition: '完成Day 1打卡',
  },
  {
    level: 3,
    name: '情绪觉醒者',
    icon: '🌻',
    minPoints: 300,
    description: '学会觉察和转化金钱情绪',
    unlockCondition: '完成Day 3打卡',
  },
  {
    level: 4,
    name: '信念转化者',
    icon: '⭐',
    minPoints: 700,
    description: '完成7天训练，信念开始松动',
    unlockCondition: '完成7天训练营',
  },
  {
    level: 5,
    name: '财富觉醒师',
    icon: '🌟',
    minPoints: 1500,
    description: '成为合伙人，帮助他人觉醒',
    unlockCondition: '成为合伙人 + 完成10个挑战',
  },
  {
    level: 6,
    name: '觉醒大师',
    icon: '👑',
    minPoints: 5000,
    description: '引领更多人走上觉醒之路',
    unlockCondition: '邀请5位学员完成训练营',
  },
];

// 积分获取规则
export const pointsRules: PointsRule[] = [
  { action: '完成每日冥想', basePoints: 10, bonusCondition: 'Day 3后', bonusPoints: 5 },
  { action: '完成教练梳理', basePoints: 20 },
  { action: '完成给予行动', basePoints: 15, bonusCondition: '3连完成', bonusPoints: 10 },
  { action: '单层得分≥4', basePoints: 5 },
  { action: '全层满分(5分)', basePoints: 30 },
  { action: '完成每日挑战(简单)', basePoints: 10 },
  { action: '完成每日挑战(中等)', basePoints: 20 },
  { action: '完成每日挑战(困难)', basePoints: 30 },
  { action: '成功邀请学员', basePoints: 50 },
  { action: '学员完成训练营', basePoints: 100 },
];

// 成就徽章定义
export const achievements: Achievement[] = [
  // 里程碑成就
  { key: 'first_awakening', name: '觉醒起点', icon: '🎯', description: '完成首次财富测评', category: 'milestone' },
  { key: 'day1_complete', name: '第一步', icon: '👣', description: '完成Day 1训练', category: 'milestone' },
  { key: 'day3_halfway', name: '中途不弃', icon: '💪', description: '完成Day 3训练', category: 'milestone' },
  { key: 'camp_graduate', name: '7天觉醒者', icon: '🎓', description: '完成7天训练营', category: 'milestone' },
  { key: 'became_partner', name: '觉醒引路人', icon: '🤝', description: '成为有劲合伙人', category: 'milestone' },
  
  // 连续打卡成就
  { key: 'streak_3', name: '三日坚持', icon: '🔥', description: '连续打卡3天', category: 'streak' },
  { key: 'streak_7', name: '周周精进', icon: '🔥', description: '连续打卡7天', category: 'streak' },
  { key: 'streak_14', name: '两周如一', icon: '🔥', description: '连续打卡14天', category: 'streak' },
  { key: 'streak_30', name: '月月觉醒', icon: '🔥', description: '连续打卡30天', category: 'streak' },
  
  // 成长突破成就
  { key: 'behavior_breakthrough', name: '行为突破者', icon: '🏃', description: '行为层得分≥4', category: 'growth' },
  { key: 'emotion_breakthrough', name: '情绪突破者', icon: '💗', description: '情绪层得分≥4', category: 'growth' },
  { key: 'belief_breakthrough', name: '信念突破者', icon: '💎', description: '信念层得分≥4', category: 'growth' },
  { key: 'all_layer_master', name: '三层通达', icon: '✨', description: '单日全层满分', category: 'growth' },
  { key: 'awakening_80', name: '高度觉醒', icon: '🌈', description: '觉醒指数达到80+', category: 'growth' },
  
  // 社交影响成就
  { key: 'first_share', name: '分享先锋', icon: '📢', description: '首次分享觉醒故事', category: 'social' },
  { key: 'first_invite', name: '邀请达人', icon: '💌', description: '成功邀请首位学员', category: 'social' },
  { key: 'team_5', name: '小团队长', icon: '👥', description: '邀请5位学员', category: 'social' },
  { key: 'team_10', name: '觉醒导师', icon: '🎖️', description: '邀请10位学员', category: 'social' },
];

// 获取当前等级信息
export const getCurrentLevel = (totalPoints: number): AwakeningLevel => {
  for (let i = awakeningLevels.length - 1; i >= 0; i--) {
    if (totalPoints >= awakeningLevels[i].minPoints) {
      return awakeningLevels[i];
    }
  }
  return awakeningLevels[0];
};

// 获取下一等级信息
export const getNextLevel = (totalPoints: number): AwakeningLevel | null => {
  const currentLevel = getCurrentLevel(totalPoints);
  const nextIndex = awakeningLevels.findIndex(l => l.level === currentLevel.level) + 1;
  return nextIndex < awakeningLevels.length ? awakeningLevels[nextIndex] : null;
};

// 计算到下一等级所需积分
export const getPointsToNextLevel = (totalPoints: number): number => {
  const nextLevel = getNextLevel(totalPoints);
  return nextLevel ? nextLevel.minPoints - totalPoints : 0;
};

// 计算当前等级进度百分比
export const getLevelProgress = (totalPoints: number): number => {
  const currentLevel = getCurrentLevel(totalPoints);
  const nextLevel = getNextLevel(totalPoints);
  
  if (!nextLevel) return 100;
  
  const pointsInCurrentLevel = totalPoints - currentLevel.minPoints;
  const pointsNeededForNext = nextLevel.minPoints - currentLevel.minPoints;
  
  return Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNext) * 100));
};

// 挑战类型定义
export const challengeTypes = {
  giving_action: { name: '给予挑战', icon: '🎁', color: 'text-pink-500' },
  awareness: { name: '觉察挑战', icon: '👁', color: 'text-purple-500' },
  meditation: { name: '冥想挑战', icon: '🧘', color: 'text-blue-500' },
  reflection: { name: '反思挑战', icon: '📝', color: 'text-amber-500' },
  share: { name: '分享挑战', icon: '📢', color: 'text-green-500' },
  invite: { name: '邀请挑战', icon: '💌', color: 'text-rose-500' },
};

// 挑战难度定义
export const challengeDifficulties = {
  easy: { name: '简单', points: 10, color: 'bg-green-100 text-green-700' },
  medium: { name: '中等', points: 20, color: 'bg-amber-100 text-amber-700' },
  hard: { name: '困难', points: 30, color: 'bg-rose-100 text-rose-700' },
};

// 计算每日任务可获得的积分
export const calculateDailyPotentialPoints = (dayNumber: number): number => {
  let basePoints = 10 + 20 + 15; // 冥想 + 教练 + 行动
  
  // Day 3后冥想有额外积分
  if (dayNumber > 3) {
    basePoints += 5;
  }
  
  // 加上可能的挑战积分(平均)
  basePoints += 20;
  
  return basePoints;
};

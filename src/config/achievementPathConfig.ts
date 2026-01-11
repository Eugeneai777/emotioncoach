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
    type: 'journal_days' | 'streak_days' | 'score' | 'awakening' | 'referrals' | 'share' | 'graduated_referrals';
    target: number;
    field?: 'behavior' | 'emotion' | 'belief' | 'all' | 'any_two';
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
        description: '完成财富测评',
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
        key: 'day2_complete',
        name: '初见曙光',
        icon: '🌟',
        description: '完成 Day 2 打卡',
        unlockCondition: { type: 'journal_days', target: 2 },
        dailyTaskHint: '继续每日打卡',
        rewardPoints: 15,
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
        key: 'day5_complete',
        name: '习惯养成',
        icon: '🔄',
        description: '完成 Day 5 打卡',
        unlockCondition: { type: 'journal_days', target: 5 },
        dailyTaskHint: '保持每日习惯',
        rewardPoints: 25,
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
        key: 'post_camp_3',
        name: '持续觉醒',
        icon: '🔁',
        description: '毕业后继续打卡3天',
        unlockCondition: { type: 'journal_days', target: 10 },
        dailyTaskHint: '毕业后继续打卡',
        rewardPoints: 30,
      },
      {
        key: 'day14_complete',
        name: '进阶学员',
        icon: '📈',
        description: '累计打卡14天',
        unlockCondition: { type: 'journal_days', target: 14 },
        dailyTaskHint: '保持每日打卡',
        rewardPoints: 40,
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
      {
        key: 'day30_complete',
        name: '资深觉醒者',
        icon: '⭐',
        description: '累计打卡30天',
        unlockCondition: { type: 'journal_days', target: 30 },
        dailyTaskHint: '坚持每日觉醒',
        rewardPoints: 80,
      },
    ],
  },
  {
    key: 'streak',
    title: '坚持之路',
    icon: '🔥',
    theme: {
      gradient: 'from-orange-500 to-red-500',
      bgActive: 'bg-orange-500/20',
      bgLocked: 'bg-slate-100 dark:bg-slate-800/50',
      border: 'border-orange-400/50',
      text: 'text-orange-600 dark:text-orange-400',
    },
    achievements: [
      {
        key: 'streak_1',
        name: '首日坚持',
        icon: '🔥',
        description: '连续打卡1天',
        unlockCondition: { type: 'streak_days', target: 1 },
        dailyTaskHint: '完成今日教练梳理',
        rewardPoints: 5,
      },
      {
        key: 'streak_2',
        name: '两日连续',
        icon: '🔥',
        description: '连续打卡2天',
        unlockCondition: { type: 'streak_days', target: 2 },
        dailyTaskHint: '明天继续打卡',
        rewardPoints: 10,
      },
      {
        key: 'streak_3',
        name: '三日坚持',
        icon: '🔥',
        description: '连续打卡3天',
        unlockCondition: { type: 'streak_days', target: 3 },
        dailyTaskHint: '保持每日打卡',
        rewardPoints: 15,
      },
      {
        key: 'streak_5',
        name: '五日不断',
        icon: '🔥',
        description: '连续打卡5天',
        unlockCondition: { type: 'streak_days', target: 5 },
        dailyTaskHint: '坚持到训练营结束',
        rewardPoints: 25,
      },
      {
        key: 'streak_7',
        name: '周周精进',
        icon: '🔥',
        description: '连续打卡7天',
        unlockCondition: { type: 'streak_days', target: 7 },
        dailyTaskHint: '完成训练营全程',
        rewardPoints: 30,
      },
      {
        key: 'streak_10',
        name: '十日如一',
        icon: '🔥',
        description: '连续打卡10天',
        unlockCondition: { type: 'streak_days', target: 10 },
        dailyTaskHint: '毕业后继续打卡',
        rewardPoints: 40,
      },
      {
        key: 'streak_14',
        name: '两周如一',
        icon: '🔥',
        description: '连续打卡14天',
        unlockCondition: { type: 'streak_days', target: 14 },
        dailyTaskHint: '持续每日冥想',
        rewardPoints: 50,
      },
      {
        key: 'streak_21',
        name: '三周坚守',
        icon: '🔥',
        description: '连续打卡21天',
        unlockCondition: { type: 'streak_days', target: 21 },
        dailyTaskHint: '习惯已养成',
        rewardPoints: 70,
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
      {
        key: 'streak_60',
        name: '永续之火',
        icon: '🔥',
        description: '连续打卡60天',
        unlockCondition: { type: 'streak_days', target: 60 },
        dailyTaskHint: '成为坚持典范',
        rewardPoints: 200,
      },
    ],
  },
  {
    key: 'growth',
    title: '成长之路',
    icon: '🌟',
    theme: {
      gradient: 'from-violet-500 to-purple-500',
      bgActive: 'bg-violet-500/20',
      bgLocked: 'bg-slate-100 dark:bg-slate-800/50',
      border: 'border-violet-400/50',
      text: 'text-violet-600 dark:text-violet-400',
    },
    achievements: [
      {
        key: 'behavior_awareness',
        name: '行为觉察',
        icon: '🏃',
        description: '行为层评分达3分',
        unlockCondition: { type: 'score', target: 3, field: 'behavior' },
        dailyTaskHint: '教练梳理 → 行为层',
        rewardPoints: 10,
      },
      {
        key: 'behavior_breakthrough',
        name: '行为突破者',
        icon: '🏃',
        description: '行为层评分达4分',
        unlockCondition: { type: 'score', target: 4, field: 'behavior' },
        dailyTaskHint: '深度完成行为层',
        rewardPoints: 20,
      },
      {
        key: 'emotion_awareness',
        name: '情绪觉察',
        icon: '💗',
        description: '情绪层评分达3分',
        unlockCondition: { type: 'score', target: 3, field: 'emotion' },
        dailyTaskHint: '教练梳理 → 情绪层',
        rewardPoints: 10,
      },
      {
        key: 'emotion_breakthrough',
        name: '情绪突破者',
        icon: '💗',
        description: '情绪层评分达4分',
        unlockCondition: { type: 'score', target: 4, field: 'emotion' },
        dailyTaskHint: '深度完成情绪层',
        rewardPoints: 20,
      },
      {
        key: 'belief_awareness',
        name: '信念觉察',
        icon: '💎',
        description: '信念层评分达3分',
        unlockCondition: { type: 'score', target: 3, field: 'belief' },
        dailyTaskHint: '教练梳理 → 信念层',
        rewardPoints: 10,
      },
      {
        key: 'belief_breakthrough',
        name: '信念突破者',
        icon: '💎',
        description: '信念层评分达4分',
        unlockCondition: { type: 'score', target: 4, field: 'belief' },
        dailyTaskHint: '深度完成信念层',
        rewardPoints: 20,
      },
      {
        key: 'dual_layer',
        name: '双层协调',
        icon: '✨',
        description: '任意两层同时达4分',
        unlockCondition: { type: 'score', target: 4, field: 'any_two' },
        dailyTaskHint: '同时提升多个维度',
        rewardPoints: 35,
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
        key: 'awakening_70',
        name: '觉醒进阶',
        icon: '🌈',
        description: '觉醒指数达到70+',
        unlockCondition: { type: 'awakening', target: 70 },
        dailyTaskHint: '持续提升三层评分',
        rewardPoints: 60,
      },
      {
        key: 'awakening_80',
        name: '高度觉醒',
        icon: '🌈',
        description: '觉醒指数达到80+',
        unlockCondition: { type: 'awakening', target: 80 },
        dailyTaskHint: '突破觉醒上限',
        rewardPoints: 100,
      },
    ],
  },
  {
    key: 'social',
    title: '社交之路',
    icon: '💫',
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
        name: '首次分享',
        icon: '📢',
        description: '首次分享成长卡片',
        unlockCondition: { type: 'share', target: 1 },
        dailyTaskHint: '完成"分享成长"任务',
        rewardPoints: 10,
      },
      {
        key: 'share_5',
        name: '分享达人',
        icon: '📢',
        description: '累计分享5次',
        unlockCondition: { type: 'share', target: 5 },
        dailyTaskHint: '持续分享成长故事',
        rewardPoints: 25,
      },
      {
        key: 'invite_1',
        name: '首位邀请',
        icon: '💌',
        description: '成功邀请1人加入',
        unlockCondition: { type: 'referrals', target: 1 },
        dailyTaskHint: '完成"邀请好友"任务',
        rewardPoints: 30,
      },
      {
        key: 'invite_3',
        name: '邀请达人',
        icon: '💌',
        description: '成功邀请3人加入',
        unlockCondition: { type: 'referrals', target: 3 },
        dailyTaskHint: '邀请更多好友',
        rewardPoints: 50,
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
        key: 'invite_7',
        name: '团队建设者',
        icon: '👥',
        description: '成功邀请7人加入',
        unlockCondition: { type: 'referrals', target: 7 },
        dailyTaskHint: '扩大你的团队',
        rewardPoints: 100,
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
      {
        key: 'graduated_1',
        name: '资深导师',
        icon: '🎖️',
        description: '邀请1人完成训练营',
        unlockCondition: { type: 'graduated_referrals', target: 1 },
        dailyTaskHint: '帮助学员毕业',
        rewardPoints: 100,
      },
      {
        key: 'graduated_3',
        name: '金牌导师',
        icon: '🏆',
        description: '邀请3人完成训练营',
        unlockCondition: { type: 'graduated_referrals', target: 3 },
        dailyTaskHint: '引领更多人觉醒',
        rewardPoints: 200,
      },
      {
        key: 'graduated_5',
        name: '觉醒大师',
        icon: '👑',
        description: '邀请5人完成训练营',
        mappedLevel: 6,
        unlockCondition: { type: 'graduated_referrals', target: 5 },
        dailyTaskHint: '成为觉醒榜样',
        rewardPoints: 500,
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

// 获取全局下一个最接近的成就（跨路径）
export const getGlobalNextAchievement = (
  currentValues: {
    journalDays: number;
    currentStreak: number;
    behaviorScore: number;
    emotionScore: number;
    beliefScore: number;
    awakeningIndex: number;
    shareCount: number;
    referralCount: number;
    graduatedReferrals: number;
  },
  earnedKeys: string[]
): { achievement: AchievementNode; pathKey: string; pathTitle: string; progress: number; remaining: number; remainingText: string } | null => {
  let closestAchievement: {
    achievement: AchievementNode;
    pathKey: string;
    pathTitle: string;
    progress: number;
    remaining: number;
    remainingText: string;
  } | null = null;
  let highestProgress = -1;

  for (const path of achievementPaths) {
    for (const achievement of path.achievements) {
      let current = 0;
      const target = achievement.unlockCondition.target;

      switch (achievement.unlockCondition.type) {
        case 'journal_days':
          current = currentValues.journalDays;
          break;
        case 'streak_days':
          current = currentValues.currentStreak;
          break;
        case 'score':
          if (achievement.unlockCondition.field === 'behavior') {
            current = currentValues.behaviorScore;
          } else if (achievement.unlockCondition.field === 'emotion') {
            current = currentValues.emotionScore;
          } else if (achievement.unlockCondition.field === 'belief') {
            current = currentValues.beliefScore;
          } else if (achievement.unlockCondition.field === 'all') {
            current = Math.min(currentValues.behaviorScore, currentValues.emotionScore, currentValues.beliefScore);
          } else if (achievement.unlockCondition.field === 'any_two') {
            const scores = [currentValues.behaviorScore, currentValues.emotionScore, currentValues.beliefScore];
            const sortedScores = [...scores].sort((a, b) => b - a);
            current = sortedScores[1]; // Second highest
          }
          break;
        case 'awakening':
          current = currentValues.awakeningIndex;
          break;
        case 'share':
          current = currentValues.shareCount;
          break;
        case 'referrals':
          current = currentValues.referralCount;
          break;
        case 'graduated_referrals':
          current = currentValues.graduatedReferrals;
          break;
      }

      const progress = Math.min(100, Math.round((current / target) * 100));
      const remaining = Math.max(0, target - current);
      
      // 修复：跳过已记录的成就 或 进度已达100%的成就
      const isCompleted = earnedKeys.includes(achievement.key) || progress >= 100;
      if (isCompleted) continue;

      // 选择进度最高的（最接近完成的）
      if (progress > highestProgress) {
        highestProgress = progress;

        let remainingText = '';
        switch (achievement.unlockCondition.type) {
          case 'journal_days':
          case 'streak_days':
            remainingText = remaining > 0 ? `还差 ${remaining} 天` : '即将解锁';
            break;
          case 'score':
          case 'awakening':
            remainingText = remaining > 0 ? `还差 ${remaining} 分` : '即将解锁';
            break;
          case 'share':
            remainingText = remaining > 0 ? `还差 ${remaining} 次` : '即将解锁';
            break;
          case 'referrals':
          case 'graduated_referrals':
            remainingText = remaining > 0 ? `还差 ${remaining} 人` : '即将解锁';
            break;
        }

        closestAchievement = {
          achievement,
          pathKey: path.key,
          pathTitle: path.title,
          progress,
          remaining,
          remainingText,
        };
      }
    }
  }

  return closestAchievement;
};

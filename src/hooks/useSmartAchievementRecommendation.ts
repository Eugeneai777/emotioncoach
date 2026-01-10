import { useMemo } from 'react';
import { useUserAchievements } from './useUserAchievements';
import { useWealthJournalEntries } from './useWealthJournalEntries';
import { useAwakeningProgress } from './useAwakeningProgress';
import { achievements as allAchievements } from '@/config/awakeningLevelConfig';

export interface SmartAchievementRecommendation {
  key: string;
  name: string;
  icon: string;
  description: string;
  category: 'milestone' | 'streak' | 'growth' | 'social';
  // Dynamic difficulty scoring
  difficultyScore: number; // 0-100, lower = easier to unlock
  unlockProbability: number; // 0-100%, based on current trajectory
  estimatedDays: number; // Estimated days to unlock
  // Progress info
  currentProgress: number;
  targetProgress: number;
  progressPercent: number;
  unit: string;
  // Action guidance
  primaryAction: string;
  secondaryActions: string[];
  motivationalText: string;
  // Priority ranking
  priorityRank: number;
  priorityReason: string;
}

interface UseSmartAchievementRecommendationOptions {
  campId?: string;
  currentDay?: number;
  maxRecommendations?: number;
}

export function useSmartAchievementRecommendation({
  campId,
  currentDay = 1,
  maxRecommendations = 3,
}: UseSmartAchievementRecommendationOptions = {}) {
  const { hasAchievement, userAchievements, isLoading: achievementsLoading } = useUserAchievements();
  const { stats } = useWealthJournalEntries({ campId });
  const { progress: awakeningProgress } = useAwakeningProgress();

  const currentStreak = stats?.totalDays || 0;
  const currentAwakening = awakeningProgress?.current_awakening || 0;
  const totalPoints = awakeningProgress?.total_points || 0;

  const recommendations = useMemo(() => {
    if (achievementsLoading) return [];

    const unlockedAchievements: SmartAchievementRecommendation[] = [];

    // Helper to calculate difficulty based on multiple factors
    const calculateDifficulty = (
      current: number,
      target: number,
      dailyProgress: number,
      baseComplexity: number
    ): { score: number; probability: number; estimatedDays: number } => {
      const remaining = target - current;
      const progressRatio = current / target;
      
      // Difficulty decreases as user gets closer
      const proximityFactor = 1 - progressRatio;
      
      // Estimate days based on daily progress rate
      const estimatedDays = dailyProgress > 0 ? Math.ceil(remaining / dailyProgress) : 999;
      
      // Calculate probability based on trajectory
      const probability = Math.min(100, Math.round(
        (progressRatio * 60) + // Base progress contribution
        (dailyProgress > 0 ? 30 : 0) + // Active user bonus
        (estimatedDays <= 3 ? 10 : 0) // Near completion bonus
      ));
      
      // Final difficulty score
      const score = Math.round(
        (proximityFactor * 50) + // Distance factor
        (baseComplexity * 0.3) + // Base complexity
        (estimatedDays > 7 ? 20 : estimatedDays * 2) // Time factor
      );

      return { score: Math.min(100, score), probability, estimatedDays };
    };

    // Milestone achievements analysis
    const milestoneAchievements = [
      {
        key: 'first_awakening',
        prereq: true,
        current: currentDay > 0 ? 1 : 0,
        target: 1,
        dailyProgress: 1,
        complexity: 10,
        unit: '次',
        primaryAction: '完成财富测评',
        secondaryActions: ['回答测评问题', '获取初始觉醒分数'],
        motivationalText: '开启觉醒之旅的第一步！',
      },
      {
        key: 'day1_complete',
        prereq: currentDay >= 1,
        current: currentDay >= 1 ? 1 : 0,
        target: 1,
        dailyProgress: 1,
        complexity: 15,
        unit: '天',
        primaryAction: '完成今日教练梳理',
        secondaryActions: ['收听冥想音频', '记录今日感悟'],
        motivationalText: '万事开头难，今天就是起点！',
      },
      {
        key: 'day3_halfway',
        prereq: currentDay >= 1,
        current: Math.min(currentDay, 3),
        target: 3,
        dailyProgress: 1,
        complexity: 25,
        unit: '天',
        primaryAction: '坚持每日打卡至Day 3',
        secondaryActions: ['设置每日提醒', '养成固定习惯'],
        motivationalText: '坚持3天，习惯初步形成！',
      },
      {
        key: 'camp_graduate',
        prereq: currentDay >= 1,
        current: Math.min(currentDay, 7),
        target: 7,
        dailyProgress: 1,
        complexity: 40,
        unit: '天',
        primaryAction: '完成7天训练营',
        secondaryActions: ['每日不间断', '深度参与每个环节'],
        motivationalText: '7天蜕变，见证不一样的自己！',
      },
      {
        key: 'became_partner',
        prereq: hasAchievement('camp_graduate'),
        current: hasAchievement('became_partner') ? 1 : 0,
        target: 1,
        dailyProgress: 0.1,
        complexity: 60,
        unit: '次',
        primaryAction: '成为有劲合伙人',
        secondaryActions: ['了解合伙人权益', '完成合伙人申请'],
        motivationalText: '帮助他人觉醒，共创价值！',
      },
    ];

    // Streak achievements analysis
    const streakAchievements = [
      {
        key: 'streak_3',
        prereq: true,
        current: Math.min(currentStreak, 3),
        target: 3,
        dailyProgress: 1,
        complexity: 20,
        unit: '天',
        primaryAction: '连续打卡3天',
        secondaryActions: ['每天同一时间打卡', '设置打卡提醒'],
        motivationalText: '连续3天，你已经开始改变！',
      },
      {
        key: 'streak_7',
        prereq: hasAchievement('streak_3'),
        current: Math.min(currentStreak, 7),
        target: 7,
        dailyProgress: 1,
        complexity: 35,
        unit: '天',
        primaryAction: '连续打卡7天',
        secondaryActions: ['保持节奏感', '记录每日小进步'],
        motivationalText: '一周坚持，习惯逐渐稳固！',
      },
      {
        key: 'streak_14',
        prereq: hasAchievement('streak_7'),
        current: Math.min(currentStreak, 14),
        target: 14,
        dailyProgress: 1,
        complexity: 50,
        unit: '天',
        primaryAction: '连续打卡14天',
        secondaryActions: ['融入日常生活', '与同伴互相督促'],
        motivationalText: '两周如一日，你已与众不同！',
      },
      {
        key: 'streak_30',
        prereq: hasAchievement('streak_14'),
        current: Math.min(currentStreak, 30),
        target: 30,
        dailyProgress: 1,
        complexity: 70,
        unit: '天',
        primaryAction: '连续打卡30天',
        secondaryActions: ['习惯已成自然', '成为榜样力量'],
        motivationalText: '30天坚持，你就是传奇！',
      },
    ];

    // Growth achievements analysis - use baseline scores as proxies since current scores aren't tracked
    const behaviorProgress = awakeningProgress?.baseline_behavior || 2;
    const emotionProgress = awakeningProgress?.baseline_emotion || 2;
    const beliefProgress = awakeningProgress?.baseline_belief || 2;

    const growthAchievements = [
      {
        key: 'behavior_breakthrough',
        prereq: true,
        current: Math.min(behaviorProgress + (currentDay * 0.3), 4),
        target: 4,
        dailyProgress: 0.3,
        complexity: 30,
        unit: '分',
        primaryAction: '行为层得分达到4分',
        secondaryActions: ['完成每日行动任务', '记录行为改变'],
        motivationalText: '行动是改变的开始！',
      },
      {
        key: 'emotion_breakthrough',
        prereq: true,
        current: Math.min(emotionProgress + (currentDay * 0.2), 4),
        target: 4,
        dailyProgress: 0.2,
        complexity: 35,
        unit: '分',
        primaryAction: '情绪层得分达到4分',
        secondaryActions: ['觉察情绪变化', '学习情绪转化'],
        motivationalText: '情绪是内在力量的信号！',
      },
      {
        key: 'belief_breakthrough',
        prereq: true,
        current: Math.min(beliefProgress + (currentDay * 0.15), 4),
        target: 4,
        dailyProgress: 0.15,
        complexity: 45,
        unit: '分',
        primaryAction: '信念层得分达到4分',
        secondaryActions: ['识别限制性信念', '重塑积极信念'],
        motivationalText: '信念是改变的根源！',
      },
      {
        key: 'all_layer_master',
        prereq: hasAchievement('behavior_breakthrough') && hasAchievement('emotion_breakthrough'),
        current: 0,
        target: 1,
        dailyProgress: 0.1,
        complexity: 55,
        unit: '天',
        primaryAction: '单日全层满分',
        secondaryActions: ['全身心投入', '追求极致体验'],
        motivationalText: '三层通达，圆满觉醒！',
      },
      {
        key: 'awakening_80',
        prereq: currentAwakening >= 40,
        current: currentAwakening,
        target: 80,
        dailyProgress: 2,
        complexity: 50,
        unit: '',
        primaryAction: '觉醒指数达到80+',
        secondaryActions: ['持续高质量打卡', '深度参与训练'],
        motivationalText: '高度觉醒，财富自然流动！',
      },
    ];

    // Social achievements analysis
    const socialAchievements = [
      {
        key: 'first_share',
        prereq: true,
        current: 0,
        target: 1,
        dailyProgress: 0.5,
        complexity: 15,
        unit: '次',
        primaryAction: '分享你的觉醒故事',
        secondaryActions: ['生成分享海报', '分享到微信'],
        motivationalText: '分享让成长更有意义！',
      },
      {
        key: 'first_invite',
        prereq: hasAchievement('first_share'),
        current: 0,
        target: 1,
        dailyProgress: 0.2,
        complexity: 40,
        unit: '人',
        primaryAction: '邀请首位学员加入',
        secondaryActions: ['分享邀请链接', '介绍训练营价值'],
        motivationalText: '帮助他人，成就自己！',
      },
      {
        key: 'team_5',
        prereq: hasAchievement('first_invite'),
        current: 0,
        target: 5,
        dailyProgress: 0.1,
        complexity: 60,
        unit: '人',
        primaryAction: '邀请5位学员',
        secondaryActions: ['持续分享价值', '建立影响力'],
        motivationalText: '小团队成型，影响力扩大！',
      },
      {
        key: 'team_10',
        prereq: hasAchievement('team_5'),
        current: 0,
        target: 10,
        dailyProgress: 0.05,
        complexity: 75,
        unit: '人',
        primaryAction: '邀请10位学员',
        secondaryActions: ['成为社区领袖', '引领更多人觉醒'],
        motivationalText: '觉醒导师，传递光明！',
      },
    ];

    // Process all achievements
    const allPotentialAchievements = [
      ...milestoneAchievements.map(a => ({ ...a, category: 'milestone' as const })),
      ...streakAchievements.map(a => ({ ...a, category: 'streak' as const })),
      ...growthAchievements.map(a => ({ ...a, category: 'growth' as const })),
      ...socialAchievements.map(a => ({ ...a, category: 'social' as const })),
    ];

    for (const achievement of allPotentialAchievements) {
      // Skip if already earned or prerequisites not met
      if (hasAchievement(achievement.key) || !achievement.prereq) continue;

      const configAchievement = allAchievements.find(a => a.key === achievement.key);
      if (!configAchievement) continue;

      const { score, probability, estimatedDays } = calculateDifficulty(
        achievement.current,
        achievement.target,
        achievement.dailyProgress,
        achievement.complexity
      );

      const progressPercent = Math.round((achievement.current / achievement.target) * 100);

      unlockedAchievements.push({
        key: achievement.key,
        name: configAchievement.name,
        icon: configAchievement.icon,
        description: configAchievement.description,
        category: achievement.category,
        difficultyScore: score,
        unlockProbability: probability,
        estimatedDays,
        currentProgress: achievement.current,
        targetProgress: achievement.target,
        progressPercent,
        unit: achievement.unit || '天',
        primaryAction: achievement.primaryAction,
        secondaryActions: achievement.secondaryActions,
        motivationalText: achievement.motivationalText,
        priorityRank: 0,
        priorityReason: '',
      });
    }

    // Sort by difficulty score (easiest first) and assign priority
    unlockedAchievements.sort((a, b) => a.difficultyScore - b.difficultyScore);

    // Assign priority rankings with reasons
    unlockedAchievements.forEach((achievement, index) => {
      achievement.priorityRank = index + 1;
      
      if (index === 0) {
        achievement.priorityReason = '🌟 最容易解锁';
      } else if (achievement.progressPercent >= 80) {
        achievement.priorityReason = '🔥 即将完成';
      } else if (achievement.estimatedDays <= 2) {
        achievement.priorityReason = '⚡ 2天内可达成';
      } else if (achievement.unlockProbability >= 70) {
        achievement.priorityReason = '📈 高概率解锁';
      } else {
        achievement.priorityReason = `📊 难度 ${achievement.difficultyScore}`;
      }
    });

    return unlockedAchievements.slice(0, maxRecommendations);
  }, [
    achievementsLoading,
    currentDay,
    currentStreak,
    currentAwakening,
    awakeningProgress,
    hasAchievement,
    maxRecommendations,
  ]);

  // Get the single best recommendation
  const topRecommendation = recommendations[0] || null;

  // Get category-specific recommendations
  const getCategoryRecommendations = (category: 'milestone' | 'streak' | 'growth' | 'social') => {
    return recommendations.filter(r => r.category === category);
  };

  return {
    recommendations,
    topRecommendation,
    getCategoryRecommendations,
    isLoading: achievementsLoading,
  };
}

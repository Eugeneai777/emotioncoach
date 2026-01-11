import { useMemo } from 'react';
import { useUserAchievements } from './useUserAchievements';
import { useAwakeningProgress } from './useAwakeningProgress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { achievementPaths, AchievementNode, AchievementPath, getGlobalNextAchievement } from '@/config/achievementPathConfig';

export interface AchievementProgressNode extends AchievementNode {
  earned: boolean;
  earnedAt?: string;
  current: number;
  target: number;
  progress: number; // 0-100
  isNext: boolean; // 是否是下一个要解锁的
  remainingText: string; // "还差 X 天/分/人"
}

export interface AchievementPathProgress extends Omit<AchievementPath, 'achievements'> {
  achievements: AchievementProgressNode[];
  earnedCount: number;
  totalCount: number;
  nextAchievement: AchievementProgressNode | null;
}

export interface GlobalNextAchievement {
  achievement: AchievementNode;
  pathKey: string;
  pathTitle: string;
  progress: number;
  remaining: number;
  remainingText: string;
}

export function useAchievementProgress() {
  const { userAchievements, hasAchievement, isLoading: achievementsLoading } = useUserAchievements();
  const { progress: awakeningProgress, isLoading: progressLoading } = useAwakeningProgress();

  // 获取财富日志条目
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['wealth-journal-entries-for-achievements'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wealth_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = achievementsLoading || entriesLoading || progressLoading;

  // 计算各维度的当前值
  const currentValues = useMemo(() => {
    const journalDays = entries?.length || 0;
    const currentStreak = awakeningProgress?.consecutive_days || 0;
    const totalPoints = awakeningProgress?.total_points || 0;
    
    // 获取最新的评分
    const latestEntry = entries?.[0];
    const behaviorScore = latestEntry?.behavior_score || 0;
    const emotionScore = latestEntry?.emotion_score || 0;
    const beliefScore = latestEntry?.belief_score || 0;
    
    // 计算觉醒指数 (基于最新评分)
    const awakeningIndex = latestEntry 
      ? Math.round(((behaviorScore + emotionScore + beliefScore) / 15) * 100)
      : awakeningProgress?.baseline_awakening || 0;

    // 社交数据 (暂时用 0，需要从 partner_referrals 获取)
    const shareCount = 0; // TODO: 从实际分享记录获取
    const referralCount = 0; // TODO: 从 partner_referrals 获取
    const graduatedReferrals = 0; // TODO: 从 partner_referrals 获取已毕业的

    return {
      journalDays,
      currentStreak,
      totalPoints,
      behaviorScore,
      emotionScore,
      beliefScore,
      awakeningIndex,
      shareCount,
      referralCount,
      graduatedReferrals,
    };
  }, [entries, awakeningProgress]);

  // 计算成就进度
  const pathsWithProgress = useMemo((): AchievementPathProgress[] => {
    return achievementPaths.map(path => {
      let foundNext = false;
      
      const achievementsWithProgress: AchievementProgressNode[] = path.achievements.map(achievement => {
        const earned = hasAchievement(achievement.key);
        const earnedAt = userAchievements?.find(a => a.achievement_key === achievement.key)?.earned_at;
        
        // 根据解锁条件计算当前值和目标值
        let current = 0;
        let target = achievement.unlockCondition.target;
        
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
              // 三层通达：取最小值
              current = Math.min(
                currentValues.behaviorScore,
                currentValues.emotionScore,
                currentValues.beliefScore
              );
            } else if (achievement.unlockCondition.field === 'any_two') {
              // 双层协调：取第二高的分数
              const scores = [currentValues.behaviorScore, currentValues.emotionScore, currentValues.beliefScore];
              const sortedScores = [...scores].sort((a, b) => b - a);
              current = sortedScores[1];
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
        const isNext = !earned && !foundNext;
        if (isNext) foundNext = true;

        // 生成剩余提示文本
        const remaining = Math.max(0, target - current);
        let remainingText = '';
        switch (achievement.unlockCondition.type) {
          case 'journal_days':
          case 'streak_days':
            remainingText = remaining > 0 ? `还差 ${remaining} 天` : '已达成';
            break;
          case 'score':
          case 'awakening':
            remainingText = remaining > 0 ? `还差 ${remaining} 分` : '已达成';
            break;
          case 'share':
            remainingText = remaining > 0 ? `还差 ${remaining} 次` : '已达成';
            break;
          case 'referrals':
          case 'graduated_referrals':
            remainingText = remaining > 0 ? `还差 ${remaining} 人` : '已达成';
            break;
        }

        return {
          ...achievement,
          earned,
          earnedAt,
          current,
          target,
          progress,
          isNext,
          remainingText,
        };
      });

      const earnedCount = achievementsWithProgress.filter(a => a.earned).length;
      const nextAchievement = achievementsWithProgress.find(a => a.isNext) || null;

      return {
        ...path,
        achievements: achievementsWithProgress,
        earnedCount,
        totalCount: achievementsWithProgress.length,
        nextAchievement,
      };
    });
  }, [currentValues, hasAchievement, userAchievements]);

  // 总体统计
  const totalEarned = pathsWithProgress.reduce((sum, p) => sum + p.earnedCount, 0);
  const totalCount = pathsWithProgress.reduce((sum, p) => sum + p.totalCount, 0);
  const overallProgress = totalCount > 0 ? Math.round((totalEarned / totalCount) * 100) : 0;

  // 全局下一个最接近的成就
  const globalNextAchievement = useMemo((): GlobalNextAchievement | null => {
    const earnedKeys = userAchievements?.map(a => a.achievement_key) || [];
    return getGlobalNextAchievement(currentValues, earnedKeys);
  }, [currentValues, userAchievements]);

  return {
    paths: pathsWithProgress,
    isLoading,
    totalEarned,
    totalCount,
    overallProgress,
    globalNextAchievement,
    currentValues,
  };
}

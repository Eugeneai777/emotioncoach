import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { achievements as allAchievements } from '@/config/awakeningLevelConfig';

interface DbAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  icon: string | null;
  achievement_description: string | null;
  earned_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  achievement_name: string;
  achievement_icon: string | null;
  achievement_description: string | null;
  earned_at: string;
}

// Map DB record to our interface
const mapDbToAchievement = (db: DbAchievement): UserAchievement => ({
  id: db.id,
  user_id: db.user_id,
  achievement_key: db.achievement_type,
  achievement_name: db.achievement_name,
  achievement_icon: db.icon,
  achievement_description: db.achievement_description,
  earned_at: db.earned_at,
});

export const useUserAchievements = () => {
  const queryClient = useQueryClient();
  
  const { data: userAchievements, isLoading, error } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return (data as DbAchievement[]).map(mapDbToAchievement);
    },
  });

  // 获得成就
  const earnAchievementMutation = useMutation({
    mutationFn: async (achievementKey: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const achievement = allAchievements.find(a => a.key === achievementKey);
      if (!achievement) throw new Error('Achievement not found');

      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_type: achievementKey,
          achievement_name: achievement.name,
          icon: achievement.icon,
          achievement_description: achievement.description,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });

  const earnAchievement = (key: string) => earnAchievementMutation.mutateAsync(key);

  // 检查是否已获得某成就
  const hasAchievement = (key: string) => {
    return userAchievements?.some(a => a.achievement_key === key) || false;
  };

  // 获取所有成就及其解锁状态
  const getAchievementsWithStatus = () => {
    return allAchievements.map(achievement => ({
      ...achievement,
      earned: hasAchievement(achievement.key),
      earnedAt: userAchievements?.find(a => a.achievement_key === achievement.key)?.earned_at,
    }));
  };

  // 按类别分组
  const getAchievementsByCategory = () => {
    const achievementsWithStatus = getAchievementsWithStatus();
    return {
      milestone: achievementsWithStatus.filter(a => a.category === 'milestone'),
      streak: achievementsWithStatus.filter(a => a.category === 'streak'),
      growth: achievementsWithStatus.filter(a => a.category === 'growth'),
      social: achievementsWithStatus.filter(a => a.category === 'social'),
    };
  };

  const earnedCount = userAchievements?.length || 0;
  const totalCount = allAchievements.length;

  return {
    userAchievements,
    isLoading,
    error,
    earnAchievement,
    hasAchievement,
    getAchievementsWithStatus,
    getAchievementsByCategory,
    earnedCount,
    totalCount,
  };
};

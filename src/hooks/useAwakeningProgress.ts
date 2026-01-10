import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentLevel, getNextLevel, getLevelProgress, getPointsToNextLevel } from '@/config/awakeningLevelConfig';

export interface AwakeningProgress {
  id: string;
  user_id: string;
  baseline_awakening: number;
  baseline_behavior: number;
  baseline_emotion: number;
  baseline_belief: number;
  baseline_dominant_type: string | null;
  baseline_reaction_pattern: string | null;
  baseline_created_at: string | null;
  current_level: number;
  current_awakening: number;
  total_points: number;
  total_challenges_completed: number;
  total_giving_actions: number;
  consecutive_days: number;
  camp_completed_at: string | null;
  became_partner_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useAwakeningProgress = () => {
  const queryClient = useQueryClient();

  const { data: progress, isLoading, error } = useQuery({
    queryKey: ['awakening-progress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_awakening_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as AwakeningProgress | null;
    },
  });

  const initializeProgress = useMutation({
    mutationFn: async (baselineData: {
      awakening: number;
      behavior: number;
      emotion: number;
      belief: number;
      dominantType?: string;
      reactionPattern?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { data, error } = await supabase
        .from('user_awakening_progress')
        .upsert({
          user_id: user.id,
          baseline_awakening: baselineData.awakening,
          baseline_behavior: baselineData.behavior,
          baseline_emotion: baselineData.emotion,
          baseline_belief: baselineData.belief,
          baseline_dominant_type: baselineData.dominantType || null,
          baseline_reaction_pattern: baselineData.reactionPattern || null,
          baseline_created_at: new Date().toISOString(),
          current_awakening: baselineData.awakening,
          total_points: 10, // 完成测评获得10分
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awakening-progress'] });
    },
  });

  const addPoints = useMutation({
    mutationFn: async (params: { points: number; action: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      // 先获取当前数据
      const { data: current } = await supabase
        .from('user_awakening_progress')
        .select('total_points, current_level')
        .eq('user_id', user.id)
        .single();

      if (!current) throw new Error('未找到进度数据');

      const newTotalPoints = current.total_points + params.points;
      const newLevel = getCurrentLevel(newTotalPoints);

      const { data, error } = await supabase
        .from('user_awakening_progress')
        .update({
          total_points: newTotalPoints,
          current_level: newLevel.level,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // 返回是否升级
      return {
        data,
        leveledUp: newLevel.level > current.current_level,
        newLevel: newLevel,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awakening-progress'] });
    },
  });

  const updateAwakening = useMutation({
    mutationFn: async (newAwakening: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { data, error } = await supabase
        .from('user_awakening_progress')
        .update({
          current_awakening: newAwakening,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awakening-progress'] });
    },
  });

  const completeCamp = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      // 完成训练营获得额外积分
      const { data: current } = await supabase
        .from('user_awakening_progress')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      const bonusPoints = 200; // 完成训练营奖励
      const newTotalPoints = (current?.total_points || 0) + bonusPoints;
      const newLevel = getCurrentLevel(newTotalPoints);

      const { data, error } = await supabase
        .from('user_awakening_progress')
        .update({
          camp_completed_at: new Date().toISOString(),
          total_points: newTotalPoints,
          current_level: Math.max(4, newLevel.level), // 至少达到等级4
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awakening-progress'] });
    },
  });

  // 计算派生数据
  const currentLevel = progress ? getCurrentLevel(progress.total_points) : null;
  const nextLevel = progress ? getNextLevel(progress.total_points) : null;
  const levelProgress = progress ? getLevelProgress(progress.total_points) : 0;
  const pointsToNext = progress ? getPointsToNextLevel(progress.total_points) : 0;
  const awakeningGrowth = progress 
    ? progress.current_awakening - progress.baseline_awakening 
    : 0;

  return {
    progress,
    isLoading,
    error,
    currentLevel,
    nextLevel,
    levelProgress,
    pointsToNext,
    awakeningGrowth,
    initializeProgress,
    addPoints,
    updateAwakening,
    completeCamp,
  };
};

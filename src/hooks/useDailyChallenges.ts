import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export type ChallengeSource = 'ai_generated' | 'coach_action' | 'user_created';

export interface DailyChallenge {
  id: string;
  user_id: string;
  challenge_type: string;
  challenge_title: string;
  challenge_description: string | null;
  difficulty: string;
  points_reward: number;
  is_completed: boolean;
  completed_at: string | null;
  completion_reflection: string | null;
  target_date: string;
  is_ai_generated: boolean;
  created_at: string;
  target_poor_type: 'mouth' | 'hand' | 'eye' | 'heart' | null; // 关联的四穷维度
  recommendation_reason: string | null; // AI推荐理由
  linked_focus_area: string | null; // 关联的本周训练重点
  linked_belief: string | null; // 关联的收藏信念
  ai_insight_source: 'keyword' | 'belief' | 'focus' | 'pattern' | 'layer' | null; // 推荐理由来源
  source: ChallengeSource; // 挑战来源
  journal_entry_id: string | null; // 关联的日记ID（仅coach_action类型）
}

export const useDailyChallenges = (targetDate?: Date) => {
  const queryClient = useQueryClient();
  const dateStr = format(targetDate || new Date(), 'yyyy-MM-dd');

  const { data: challenges, isLoading, error } = useQuery({
    queryKey: ['daily-challenges', dateStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_date', dateStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DailyChallenge[];
    },
  });

  const completeChallenge = useMutation({
    mutationFn: async (params: { challengeId: string; reflection?: string }) => {
      const { data, error } = await supabase
        .from('daily_challenges')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          completion_reflection: params.reflection || null,
        })
        .eq('id', params.challengeId)
        .select()
        .single();

      if (error) throw error;
      return data as DailyChallenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-challenges'] });
    },
  });

  const createChallenge = useMutation({
    mutationFn: async (params: {
      type: string;
      title: string;
      description?: string;
      difficulty?: string;
      pointsReward?: number;
      targetDate?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { data, error } = await supabase
        .from('daily_challenges')
        .insert({
          user_id: user.id,
          challenge_type: params.type,
          challenge_title: params.title,
          challenge_description: params.description || null,
          difficulty: params.difficulty || 'medium',
          points_reward: params.pointsReward || 20,
          target_date: params.targetDate || dateStr,
          is_ai_generated: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DailyChallenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-challenges'] });
    },
  });

  const completedCount = challenges?.filter(c => c.is_completed).length || 0;
  const totalPoints = challenges?.reduce((sum, c) => sum + c.points_reward, 0) || 0;
  const earnedPoints = challenges?.filter(c => c.is_completed).reduce((sum, c) => sum + c.points_reward, 0) || 0;

  return {
    challenges,
    isLoading,
    error,
    completedCount,
    totalPoints,
    earnedPoints,
    completeChallenge,
    createChallenge,
  };
};

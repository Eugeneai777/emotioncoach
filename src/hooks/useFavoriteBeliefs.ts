import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FavoriteBelief {
  id: string;
  user_id: string;
  camp_id: string | null;
  belief_text: string;
  is_reminder: boolean;
  display_order: number;
  source_day: number | null;
  created_at: string;
  updated_at: string;
}

export function useFavoriteBeliefs(campId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorite-beliefs', user?.id, campId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('user_favorite_beliefs')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      
      if (campId) {
        query = query.eq('camp_id', campId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FavoriteBelief[];
    },
    enabled: !!user?.id,
  });

  const reminderBeliefs = favorites.filter(f => f.is_reminder);
  const reminderCount = reminderBeliefs.length;

  const addFavoriteMutation = useMutation({
    mutationFn: async ({ beliefText, sourceDay }: { beliefText: string; sourceDay?: number }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_favorite_beliefs')
        .insert({
          user_id: user.id,
          camp_id: campId,
          belief_text: beliefText,
          source_day: sourceDay,
          is_reminder: false,
          display_order: favorites.length,
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('该信念已收藏');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-beliefs'] });
      toast.success('信念已收藏');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (beliefText: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('user_favorite_beliefs')
        .delete()
        .eq('user_id', user.id)
        .eq('belief_text', beliefText);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-beliefs'] });
      toast.success('已取消收藏');
    },
    onError: () => {
      toast.error('操作失败');
    },
  });

  const toggleReminderMutation = useMutation({
    mutationFn: async ({ beliefText, isReminder }: { beliefText: string; isReminder: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Check if we're trying to add more than 3 reminders
      if (isReminder && reminderCount >= 3) {
        throw new Error('最多只能设置3条每日提醒');
      }
      
      const { error } = await supabase
        .from('user_favorite_beliefs')
        .update({ is_reminder: isReminder })
        .eq('user_id', user.id)
        .eq('belief_text', beliefText);
      
      if (error) throw error;
    },
    onSuccess: (_, { isReminder }) => {
      queryClient.invalidateQueries({ queryKey: ['favorite-beliefs'] });
      toast.success(isReminder ? '已设为每日提醒' : '已取消每日提醒');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isFavorited = (beliefText: string) => {
    return favorites.some(f => f.belief_text === beliefText);
  };

  const isReminder = (beliefText: string) => {
    return favorites.some(f => f.belief_text === beliefText && f.is_reminder);
  };

  return {
    favorites,
    reminderBeliefs,
    reminderCount,
    isLoading,
    isFavorited,
    isReminder,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    toggleReminder: toggleReminderMutation.mutate,
    isAddingFavorite: addFavoriteMutation.isPending,
    isTogglingReminder: toggleReminderMutation.isPending,
  };
}

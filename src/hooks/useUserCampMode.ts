import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePartner } from './usePartner';

export type UserCampMode = 'none' | 'active' | 'graduate' | 'partner';

interface CampModeResult {
  mode: UserCampMode;
  camp: any | null;
  isLoading: boolean;
  // Graduate/Partner mode specific
  daysSinceGraduation: number;
  cycleMeditationDay: number; // 1-7 循环
  cycleWeek: number;
  listenCount: number; // 第几次聆听同一天的冥想
}

export function useUserCampMode(): CampModeResult {
  const { isPartner, loading: partnerLoading } = usePartner();

  // Fetch camp data with graduation detection
  const { data: campData, isLoading: campLoading } = useQuery({
    queryKey: ['user-camp-mode'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 首先检查是否有活跃的训练营
      const { data: activeCamp } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeCamp) {
        // 备用毕业检测：检查是否实际完成7天
        const { count: journalCount } = await supabase
          .from('wealth_journal_entries')
          .select('*', { count: 'exact', head: true })
          .eq('camp_id', activeCamp.id)
          .not('behavior_block', 'is', null);

        // 如果已完成7天但status还是active，自动更新并返回completed状态
        if (journalCount && journalCount >= 7) {
          await supabase
            .from('training_camps')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', activeCamp.id);
          
          return { camp: activeCamp, status: 'completed' };
        }

        return { camp: activeCamp, status: 'active' };
      }

      // 检查是否有已完成的训练营
      const { data: completedCamp } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completedCamp) {
        return { camp: completedCamp, status: 'completed' };
      }

      return null;
    },
  });

  const result = useMemo(() => {
    const isLoading = campLoading || partnerLoading;
    
    if (isLoading || !campData) {
      return {
        mode: 'none' as UserCampMode,
        camp: null,
        isLoading,
        daysSinceGraduation: 0,
        cycleMeditationDay: 1,
        cycleWeek: 1,
        listenCount: 1,
      };
    }

    const { camp, status } = campData;

    // Active camp
    if (status === 'active') {
      return {
        mode: 'active' as UserCampMode,
        camp,
        isLoading: false,
        daysSinceGraduation: 0,
        cycleMeditationDay: 0,
        cycleWeek: 0,
        listenCount: 0,
      };
    }

    // Completed camp
    if (status === 'completed') {
      // 计算毕业后的天数
      const graduationDate = new Date(camp.updated_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      graduationDate.setHours(0, 0, 0, 0);
      
      const daysSinceGraduation = Math.max(0, Math.floor((today.getTime() - graduationDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // 计算循环冥想日 (1-7)
      const cycleMeditationDay = (daysSinceGraduation % 7) + 1;
      
      // 计算第几周
      const cycleWeek = Math.floor(daysSinceGraduation / 7) + 1;
      
      // 计算第几次聆听
      const listenCount = cycleWeek;

      return {
        mode: isPartner ? 'partner' as UserCampMode : 'graduate' as UserCampMode,
        camp,
        isLoading: false,
        daysSinceGraduation,
        cycleMeditationDay,
        cycleWeek,
        listenCount,
      };
    }

    return {
      mode: 'none' as UserCampMode,
      camp: null,
      isLoading: false,
      daysSinceGraduation: 0,
      cycleMeditationDay: 1,
      cycleWeek: 1,
      listenCount: 1,
    };
  }, [campData, campLoading, partnerLoading, isPartner]);

  return result;
}

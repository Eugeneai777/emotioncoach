import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePartner } from './usePartner';

export type UserCampMode = 'none' | 'active' | 'graduate' | 'partner';

interface CampModeResult {
  mode: UserCampMode;
  camp: any | null;
  isLoading: boolean;
  // Graduate/Partner mode specific - 基于实际打卡次数
  postGraduationCheckIns: number; // 毕业后总打卡次数
  cycleRound: number; // 第几轮 (每7次打卡为1轮)
  cycleDayInRound: number; // 本轮第几天 (1-7)
  cycleMeditationDay: number; // 今天应该做的冥想日 (1-7)
  daysSinceLastCheckIn: number; // 距离上次打卡的天数（用于断档提醒）
  lastCheckInDate: string | null; // 上次打卡日期
  // Legacy fields for backward compatibility
  daysSinceGraduation: number;
  cycleWeek: number;
  listenCount: number;
}

export function useUserCampMode(): CampModeResult {
  const { isPartner, loading: partnerLoading } = usePartner();

  // Fetch camp data with graduation detection and post-graduation check-ins
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
          
          // 查询毕业后的打卡记录
          const postGradData = await fetchPostGraduationData(user.id, activeCamp.id, new Date().toISOString());
          return { camp: activeCamp, status: 'completed', ...postGradData };
        }

        return { camp: activeCamp, status: 'active', postGraduationCheckIns: 0, lastCheckInDate: null };
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
        // 查询毕业后的打卡记录
        const postGradData = await fetchPostGraduationData(user.id, completedCamp.id, completedCamp.updated_at);
        return { camp: completedCamp, status: 'completed', ...postGradData };
      }

      return null;
    },
  });

  const result = useMemo(() => {
    const isLoading = campLoading || partnerLoading;
    
    const defaultResult: CampModeResult = {
      mode: 'none',
      camp: null,
      isLoading,
      postGraduationCheckIns: 0,
      cycleRound: 1,
      cycleDayInRound: 1,
      cycleMeditationDay: 1,
      daysSinceLastCheckIn: 0,
      lastCheckInDate: null,
      daysSinceGraduation: 0,
      cycleWeek: 1,
      listenCount: 1,
    };
    
    if (isLoading || !campData) {
      return defaultResult;
    }

    const { camp, status, postGraduationCheckIns = 0, lastCheckInDate = null } = campData;

    // Active camp
    if (status === 'active') {
      return {
        ...defaultResult,
        mode: 'active' as UserCampMode,
        camp,
        isLoading: false,
        cycleMeditationDay: 0,
        cycleWeek: 0,
        listenCount: 0,
      };
    }

    // Completed camp - 基于实际打卡次数计算轮次
    if (status === 'completed') {
      // 计算毕业后的日历天数（用于向后兼容）
      const graduationDate = new Date(camp.updated_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      graduationDate.setHours(0, 0, 0, 0);
      const daysSinceGraduation = Math.max(0, Math.floor((today.getTime() - graduationDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // 基于实际打卡次数计算轮次
      // 训练营7天 = 第1轮，毕业后开始第2轮
      const totalPostCampCheckins = postGraduationCheckIns;
      
      // 轮次计算：训练营是第1轮，毕业后从第2轮开始
      // 毕业后每7次打卡进入下一轮
      // 打卡0次 → 第2轮（刚毕业）
      // 打卡1-7次 → 第2轮
      // 打卡8-14次 → 第3轮，etc.
      const cycleRound = totalPostCampCheckins === 0 
        ? 2 
        : Math.ceil(totalPostCampCheckins / 7) + 1;
      
      // 本轮第几天：基于打卡次数
      // 如果打卡0次，显示本轮Day 1
      // 如果打卡1次，本轮Day 2（下一个要做的）
      const cycleDayInRound = totalPostCampCheckins === 0
        ? 1
        : ((totalPostCampCheckins) % 7) + 1;
      
      // 今天应该做的冥想日
      const cycleMeditationDay = cycleDayInRound > 7 ? 1 : cycleDayInRound;
      
      // 计算距离上次打卡的天数
      let daysSinceLastCheckIn = 0;
      if (lastCheckInDate) {
        const lastDate = new Date(lastCheckInDate);
        lastDate.setHours(0, 0, 0, 0);
        daysSinceLastCheckIn = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // 如果没有毕业后打卡记录，使用毕业日期计算
        daysSinceLastCheckIn = daysSinceGraduation;
      }

      // 向后兼容的 cycleWeek 和 listenCount
      const cycleWeek = cycleRound;
      const listenCount = cycleRound;

      return {
        mode: isPartner ? 'partner' as UserCampMode : 'graduate' as UserCampMode,
        camp,
        isLoading: false,
        postGraduationCheckIns: totalPostCampCheckins,
        cycleRound,
        cycleDayInRound,
        cycleMeditationDay,
        daysSinceLastCheckIn,
        lastCheckInDate,
        daysSinceGraduation,
        cycleWeek,
        listenCount,
      };
    }

    return defaultResult;
  }, [campData, campLoading, partnerLoading, isPartner]);

  return result;
}

// Helper function to fetch post-graduation check-in data
async function fetchPostGraduationData(userId: string, campId: string, graduationDateStr: string) {
  const graduationDate = new Date(graduationDateStr);
  graduationDate.setHours(0, 0, 0, 0);
  
  // 查询毕业后的日记条目（day_number > 7 或 created_at > graduation date）
  const { data: postGradEntries } = await supabase
    .from('wealth_journal_entries')
    .select('created_at, day_number')
    .eq('camp_id', campId)
    .eq('user_id', userId)
    .gt('day_number', 7)
    .order('created_at', { ascending: false });
  
  const postGraduationCheckIns = postGradEntries?.length || 0;
  const lastCheckInDate = postGradEntries && postGradEntries.length > 0 
    ? postGradEntries[0].created_at 
    : null;
  
  return { postGraduationCheckIns, lastCheckInDate };
}

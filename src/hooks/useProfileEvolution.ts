import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ProfileSnapshot {
  week: number;
  snapshot: {
    dominant_poor?: string;
    dominant_emotion?: string;
    dominant_belief?: string;
    health_score?: number;
    reaction_pattern?: string;
  };
  created_at: string;
}

interface WealthProfile {
  id: string;
  user_id: string;
  dominant_poor?: string | null;
  dominant_emotion?: string | null;
  dominant_belief?: string | null;
  health_score?: number | null;
  reaction_pattern?: string | null;
  current_week?: number | null;
  profile_snapshots?: ProfileSnapshot[];
  last_updated_from_journal?: string | null;
  updated_at?: string | null;
}

interface ProfileEvolution {
  profile: WealthProfile | null;
  evolutionInsight: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateFromJournal: () => Promise<void>;
}

export function useProfileEvolution(campId?: string): ProfileEvolution {
  const [evolutionInsight, setEvolutionInsight] = useState('');

  // Fetch current user ID
  const { data: userId } = useQuery({
    queryKey: ['current-user-id-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    },
  });

  // Fetch profile
  const { data: profile, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['user-wealth-profile-evolution', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_wealth_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[useProfileEvolution] 获取画像失败:', error);
        throw error;
      }

      if (!data) return null;

      // Parse profile_snapshots safely - handle Json type
      let snapshots: ProfileSnapshot[] = [];
      if (data.profile_snapshots && Array.isArray(data.profile_snapshots)) {
        snapshots = data.profile_snapshots.map((item: unknown) => {
          const s = item as Record<string, unknown>;
          return {
            week: typeof s.week === 'number' ? s.week : 1,
            snapshot: (s.snapshot as ProfileSnapshot['snapshot']) || {},
            created_at: typeof s.created_at === 'string' ? s.created_at : new Date().toISOString(),
          };
        });
      }

      return {
        ...data,
        profile_snapshots: snapshots,
      } as WealthProfile;
    },
    enabled: !!userId,
  });

  // Generate insight when profile changes
  useEffect(() => {
    if (!profile) return;

    const snapshots = profile.profile_snapshots || [];
    if (snapshots.length > 0) {
      const firstSnapshot = snapshots[0]?.snapshot || {};
      const oldScore = firstSnapshot.health_score || profile.health_score || 50;
      const currentScore = profile.health_score || 50;
      const diff = currentScore - oldScore;

      if (diff > 10) {
        setEvolutionInsight(`你的财富健康指数从 ${oldScore} 提升到了 ${currentScore}，进步明显！继续保持这份觉察力。`);
      } else if (diff > 0) {
        setEvolutionInsight(`你的财富健康指数稳步提升中，从 ${oldScore} 到 ${currentScore}。每一步都在积累改变。`);
      } else if (diff < -5) {
        setEvolutionInsight(`最近状态有些波动，这是成长过程中的正常调整期。保持觉察，继续前进。`);
      } else {
        setEvolutionInsight(`你的财富健康状态保持稳定，正在巩固已有的觉醒成果。`);
      }
    }
  }, [profile]);

  const updateFromJournal = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('[useProfileEvolution] 🔄 触发画像更新...');
      
      const { data, error: updateError } = await supabase.functions.invoke('update-wealth-profile', {
        body: {
          user_id: userId,
          camp_id: campId,
        }
      });

      if (updateError) {
        console.error('[useProfileEvolution] ❌ 更新画像失败:', updateError);
        return;
      }

      if (data?.success && data?.updated) {
        console.log('[useProfileEvolution] ✅ 画像更新成功:', data);
        
        // Use server-generated insight
        if (data.evolution_insight) {
          setEvolutionInsight(data.evolution_insight);
        }
        
        // Refresh profile data
        refetch();
      } else {
        console.log('[useProfileEvolution] ℹ️ 画像无需更新:', data?.reason);
      }
    } catch (err) {
      console.error('[useProfileEvolution] ❌ 更新异常:', err);
    }
  }, [userId, campId, refetch]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    profile: profile || null,
    evolutionInsight,
    isLoading,
    error: queryError?.message || null,
    refresh,
    updateFromJournal,
  };
}

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usePartner } from './usePartner';
import { supabase } from '@/integrations/supabase/client';
import { type GrowthStage } from '@/config/growthPathConfig';

interface UserGrowthData {
  stage: GrowthStage;
  hasCompletedAssessment: boolean;
  hasActiveCamp: boolean;
  has365Membership: boolean;
  isPartner: boolean;
  loading: boolean;
  activeCampId?: string;
  latestAssessmentId?: string;
}

export function useUserGrowthStage(): UserGrowthData {
  const { user } = useAuth();
  const { isPartner, loading: partnerLoading } = usePartner();
  const [data, setData] = useState<Omit<UserGrowthData, 'stage'>>({
    hasCompletedAssessment: false,
    hasActiveCamp: false,
    has365Membership: false,
    isPartner: false,
    loading: true
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // 并行查询所有数据
        const [assessmentResult, campResult, subscriptionResult] = await Promise.all([
          // 检查是否完成过情绪健康测评
          supabase
            .from('emotion_health_assessments')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          
          // 检查是否有活跃的训练营
          supabase
            .from('training_camps')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle(),
          
          // 检查是否有365会员订阅
          supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString().split('T')[0])
            .limit(1)
            .maybeSingle()
        ]);

        setData({
          hasCompletedAssessment: !!assessmentResult.data,
          hasActiveCamp: !!campResult.data,
          has365Membership: !!subscriptionResult.data,
          isPartner,
          loading: false,
          activeCampId: campResult.data?.id,
          latestAssessmentId: assessmentResult.data?.id
        });
      } catch (error) {
        console.error('Error fetching user growth data:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    if (!partnerLoading) {
      fetchUserData();
    }
  }, [user, isPartner, partnerLoading]);

  // 计算用户阶段（按优先级排序）
  const getStage = (): GrowthStage => {
    if (data.has365Membership) return 'member365';
    if (data.hasActiveCamp) return 'in_camp';
    if (data.hasCompletedAssessment) return 'assessed';
    return 'new_user';
  };

  return {
    ...data,
    stage: getStage()
  };
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * 确保用户有财富画像，如果没有则尝试从评估结果创建
 */
export const useEnsureWealthProfile = () => {
  const { user } = useAuth();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkAndSyncProfile = async () => {
      if (!user?.id || isChecking) return;
      
      setIsChecking(true);
      
      try {
        // 1. 检查是否已有画像
        const { data: existingProfile, error: profileError } = await supabase
          .from('user_wealth_profile')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('[useEnsureWealthProfile] 查询画像失败:', profileError);
          setProfileExists(false);
          return;
        }
        
        if (existingProfile) {
          console.log('[useEnsureWealthProfile] ✅ 用户画像已存在');
          setProfileExists(true);
          return;
        }
        
        // 2. 没有画像，查询最近的评估结果
        console.log('[useEnsureWealthProfile] 画像不存在，尝试从评估结果创建...');
        
        const { data: assessment, error: assessError } = await supabase
          .from('wealth_block_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (assessError) {
          console.error('[useEnsureWealthProfile] 查询评估失败:', assessError);
          setProfileExists(false);
          return;
        }
        
        if (!assessment) {
          console.log('[useEnsureWealthProfile] 用户没有评估结果，跳过画像同步');
          setProfileExists(false);
          return;
        }
        
        // 3. 调用 sync-wealth-profile 创建画像
        console.log('[useEnsureWealthProfile] 找到评估结果，调用 sync-wealth-profile...');
        
        // 根据现有表结构构建画像数据
        const { data, error } = await supabase.functions.invoke('sync-wealth-profile', {
          body: {
            user_id: user.id,
            assessment_result: {
              blockScores: {
                mouth: assessment.mouth_score,
                hand: assessment.hand_score,
                eye: assessment.eye_score,
                heart: assessment.heart_score,
              },
              layerScores: {
                behavior: assessment.behavior_score,
                emotion: assessment.emotion_score,
                belief: assessment.belief_score,
              },
              priorityBlocks: [assessment.dominant_poor, assessment.dominant_block].filter(Boolean),
              reactionPattern: assessment.reaction_pattern,
              answers: assessment.answers,
            }
          }
        });
        
        if (error) {
          console.error('[useEnsureWealthProfile] 同步画像失败:', error);
          setProfileExists(false);
        } else {
          console.log('[useEnsureWealthProfile] ✅ 画像同步成功:', data);
          setProfileExists(true);
        }
        
      } catch (err) {
        console.error('[useEnsureWealthProfile] 异常:', err);
        setProfileExists(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAndSyncProfile();
  }, [user?.id]);

  return { profileExists, isChecking };
};

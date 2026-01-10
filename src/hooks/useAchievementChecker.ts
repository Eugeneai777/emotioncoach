import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserAchievements } from './useUserAchievements';
import { toast } from '@/hooks/use-toast';
import { achievements as achievementConfig } from '@/config/awakeningLevelConfig';
import confetti from 'canvas-confetti';

// Fire celebration confetti
const fireCelebrationConfetti = () => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6, x: 0.5 },
    colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6'],
  });
};

export const useAchievementChecker = () => {
  const { earnAchievement, hasAchievement, userAchievements } = useUserAchievements();
  const [checking, setChecking] = useState(false);
  const [newlyEarned, setNewlyEarned] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const checkAndAwardAchievements = useCallback(async (showToast = true) => {
    setChecking(true);
    const earned: string[] = [];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // 1. 检查财富测评完成 -> first_awakening
      if (!hasAchievement('first_awakening')) {
        const { count } = await supabase
          .from('wealth_block_assessments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (count && count > 0) {
          await earnAchievement('first_awakening');
          earned.push('first_awakening');
        }
      }

      // 2. 获取日记数据用于多项成就检查
      const { data: journals } = await supabase
        .from('wealth_journal_entries')
        .select('day_number, behavior_score, emotion_score, belief_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (journals && journals.length > 0) {
        const dayNumbers = journals.map(j => j.day_number);
        
        // 3. Day 1 完成 -> day1_complete
        if (dayNumbers.includes(1) && !hasAchievement('day1_complete')) {
          await earnAchievement('day1_complete');
          earned.push('day1_complete');
        }

        // 4. Day 3 完成 -> day3_halfway
        if (dayNumbers.includes(3) && !hasAchievement('day3_halfway')) {
          await earnAchievement('day3_halfway');
          earned.push('day3_halfway');
        }

        // 5. Day 7 完成 -> camp_graduate
        if (dayNumbers.includes(7) && !hasAchievement('camp_graduate')) {
          await earnAchievement('camp_graduate');
          earned.push('camp_graduate');
        }

        // 6. 连续打卡成就
        const streakCount = calculateStreak(journals.map(j => new Date(j.created_at)));
        
        if (streakCount >= 3 && !hasAchievement('streak_3')) {
          await earnAchievement('streak_3');
          earned.push('streak_3');
        }
        if (streakCount >= 7 && !hasAchievement('streak_7')) {
          await earnAchievement('streak_7');
          earned.push('streak_7');
        }
        if (streakCount >= 14 && !hasAchievement('streak_14')) {
          await earnAchievement('streak_14');
          earned.push('streak_14');
        }
        if (streakCount >= 30 && !hasAchievement('streak_30')) {
          await earnAchievement('streak_30');
          earned.push('streak_30');
        }

        // 7. 成长突破成就 - 检查是否有任何日记达到分数阈值
        const hasBehaviorBreakthrough = journals.some(j => (j.behavior_score || 0) >= 4);
        const hasEmotionBreakthrough = journals.some(j => (j.emotion_score || 0) >= 4);
        const hasBeliefBreakthrough = journals.some(j => (j.belief_score || 0) >= 4);
        const hasAllLayerPerfect = journals.some(j => 
          (j.behavior_score || 0) >= 5 && 
          (j.emotion_score || 0) >= 5 && 
          (j.belief_score || 0) >= 5
        );

        if (hasBehaviorBreakthrough && !hasAchievement('behavior_breakthrough')) {
          await earnAchievement('behavior_breakthrough');
          earned.push('behavior_breakthrough');
        }
        if (hasEmotionBreakthrough && !hasAchievement('emotion_breakthrough')) {
          await earnAchievement('emotion_breakthrough');
          earned.push('emotion_breakthrough');
        }
        if (hasBeliefBreakthrough && !hasAchievement('belief_breakthrough')) {
          await earnAchievement('belief_breakthrough');
          earned.push('belief_breakthrough');
        }
        if (hasAllLayerPerfect && !hasAchievement('all_layer_master')) {
          await earnAchievement('all_layer_master');
          earned.push('all_layer_master');
        }
      }

      // 8. 检查觉醒指数达到80 -> awakening_80
      if (!hasAchievement('awakening_80')) {
        const { data: progress } = await supabase
          .from('user_awakening_progress')
          .select('current_awakening')
          .eq('user_id', user.id)
          .single();
        
        if (progress && (progress.current_awakening || 0) >= 80) {
          await earnAchievement('awakening_80');
          earned.push('awakening_80');
        }
      }

      // 9. 检查是否成为合伙人 -> became_partner
      if (!hasAchievement('became_partner')) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (partner) {
          await earnAchievement('became_partner');
          earned.push('became_partner');
        }
      }

      // 10. 检查邀请成就
      const { count: referralCount } = await supabase
        .from('partner_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', user.id);
      
      if (referralCount && referralCount >= 1 && !hasAchievement('first_invite')) {
        await earnAchievement('first_invite');
        earned.push('first_invite');
      }
      if (referralCount && referralCount >= 5 && !hasAchievement('team_5')) {
        await earnAchievement('team_5');
        earned.push('team_5');
      }
      if (referralCount && referralCount >= 10 && !hasAchievement('team_10')) {
        await earnAchievement('team_10');
        earned.push('team_10');
      }

      setNewlyEarned(earned);
      
      // Show celebration if achievements were earned
      if (earned.length > 0 && showToast) {
        setShowCelebration(true);
        
        // Fire confetti
        fireCelebrationConfetti();
        
        // Show toast for each achievement
        earned.forEach((key, index) => {
          const achievement = achievementConfig.find(a => a.key === key);
          if (achievement) {
            setTimeout(() => {
              toast({
                title: `🎉 成就解锁：${achievement.name}`,
                description: achievement.description,
              });
            }, index * 500);
          }
        });
      }
      
      return earned;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    } finally {
      setChecking(false);
    }
  }, [earnAchievement, hasAchievement]);

  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return {
    checkAndAwardAchievements,
    checking,
    newlyEarned,
    showCelebration,
    closeCelebration,
  };
};

// 计算连续打卡天数
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  
  // 按日期排序
  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());
  
  // 获取唯一的日期（去除同一天的多条记录）
  const uniqueDays = new Set<string>();
  sortedDates.forEach(d => {
    uniqueDays.add(d.toISOString().split('T')[0]);
  });
  
  const dayStrings = Array.from(uniqueDays).sort().reverse();
  
  if (dayStrings.length === 0) return 0;
  
  let streak = 1;
  const today = new Date().toISOString().split('T')[0];
  
  // 检查是否从今天开始连续
  let lastDay = new Date(dayStrings[0]);
  
  for (let i = 1; i < dayStrings.length; i++) {
    const currentDay = new Date(dayStrings[i]);
    const diffDays = Math.round((lastDay.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      lastDay = currentDay;
    } else {
      break;
    }
  }
  
  return streak;
}

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
        const journalCount = journals.length;
        const dayNumbers = journals.map(j => j.day_number);
        
        // 3. 里程碑成就 - 基于打卡天数
        if (journalCount >= 1 && !hasAchievement('day1_complete')) {
          await earnAchievement('day1_complete');
          earned.push('day1_complete');
        }
        if (journalCount >= 2 && !hasAchievement('day2_complete')) {
          await earnAchievement('day2_complete');
          earned.push('day2_complete');
        }
        if (journalCount >= 3 && !hasAchievement('day3_complete')) {
          await earnAchievement('day3_complete');
          earned.push('day3_complete');
        }
        if (journalCount >= 5 && !hasAchievement('day5_complete')) {
          await earnAchievement('day5_complete');
          earned.push('day5_complete');
        }
        if (journalCount >= 7 && !hasAchievement('camp_graduate')) {
          await earnAchievement('camp_graduate');
          earned.push('camp_graduate');
        }
        if (journalCount >= 10 && !hasAchievement('post_camp_3')) {
          await earnAchievement('post_camp_3');
          earned.push('post_camp_3');
        }
        if (journalCount >= 14 && !hasAchievement('day14_complete')) {
          await earnAchievement('day14_complete');
          earned.push('day14_complete');
        }
        if (journalCount >= 30 && !hasAchievement('day30_complete')) {
          await earnAchievement('day30_complete');
          earned.push('day30_complete');
        }

        // 6. 连续打卡成就
        const streakCount = calculateStreak(journals.map(j => new Date(j.created_at)));
        
        if (streakCount >= 1 && !hasAchievement('streak_1')) {
          await earnAchievement('streak_1');
          earned.push('streak_1');
        }
        if (streakCount >= 2 && !hasAchievement('streak_2')) {
          await earnAchievement('streak_2');
          earned.push('streak_2');
        }
        if (streakCount >= 3 && !hasAchievement('streak_3')) {
          await earnAchievement('streak_3');
          earned.push('streak_3');
        }
        if (streakCount >= 5 && !hasAchievement('streak_5')) {
          await earnAchievement('streak_5');
          earned.push('streak_5');
        }
        if (streakCount >= 7 && !hasAchievement('streak_7')) {
          await earnAchievement('streak_7');
          earned.push('streak_7');
        }
        if (streakCount >= 10 && !hasAchievement('streak_10')) {
          await earnAchievement('streak_10');
          earned.push('streak_10');
        }
        if (streakCount >= 14 && !hasAchievement('streak_14')) {
          await earnAchievement('streak_14');
          earned.push('streak_14');
        }
        if (streakCount >= 21 && !hasAchievement('streak_21')) {
          await earnAchievement('streak_21');
          earned.push('streak_21');
        }
        if (streakCount >= 30 && !hasAchievement('streak_30')) {
          await earnAchievement('streak_30');
          earned.push('streak_30');
        }
        if (streakCount >= 60 && !hasAchievement('streak_60')) {
          await earnAchievement('streak_60');
          earned.push('streak_60');
        }

        // 7. 成长觉察成就 - 检查评分阈值
        const hasBehaviorAwareness = journals.some(j => (j.behavior_score || 0) >= 3);
        const hasEmotionAwareness = journals.some(j => (j.emotion_score || 0) >= 3);
        const hasBeliefAwareness = journals.some(j => (j.belief_score || 0) >= 3);
        const hasBehaviorBreakthrough = journals.some(j => (j.behavior_score || 0) >= 4);
        const hasEmotionBreakthrough = journals.some(j => (j.emotion_score || 0) >= 4);
        const hasBeliefBreakthrough = journals.some(j => (j.belief_score || 0) >= 4);
        
        // 双层协调：任意两层同时达4分
        const hasDualLayer = journals.some(j => {
          const scores = [(j.behavior_score || 0), (j.emotion_score || 0), (j.belief_score || 0)];
          return scores.filter(s => s >= 4).length >= 2;
        });
        
        // 三层通达：三层同时达5分
        const hasTriplePerfect = journals.some(j => 
          (j.behavior_score || 0) >= 5 && 
          (j.emotion_score || 0) >= 5 && 
          (j.belief_score || 0) >= 5
        );

        if (hasBehaviorAwareness && !hasAchievement('behavior_awareness')) {
          await earnAchievement('behavior_awareness');
          earned.push('behavior_awareness');
        }
        if (hasEmotionAwareness && !hasAchievement('emotion_awareness')) {
          await earnAchievement('emotion_awareness');
          earned.push('emotion_awareness');
        }
        if (hasBeliefAwareness && !hasAchievement('belief_awareness')) {
          await earnAchievement('belief_awareness');
          earned.push('belief_awareness');
        }
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
        if (hasDualLayer && !hasAchievement('dual_layer')) {
          await earnAchievement('dual_layer');
          earned.push('dual_layer');
        }
        if (hasTriplePerfect && !hasAchievement('triple_perfect')) {
          await earnAchievement('triple_perfect');
          earned.push('triple_perfect');
        }
      }

      // 8. 检查觉醒指数成就
      const { data: progress } = await supabase
        .from('user_awakening_progress')
        .select('current_awakening')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (progress) {
        const awakening = progress.current_awakening || 0;
        if (awakening >= 70 && !hasAchievement('awakening_70')) {
          await earnAchievement('awakening_70');
          earned.push('awakening_70');
        }
        if (awakening >= 80 && !hasAchievement('awakening_80')) {
          await earnAchievement('awakening_80');
          earned.push('awakening_80');
        }
      }

      // 9. 检查是否成为合伙人 -> become_partner
      if (!hasAchievement('become_partner')) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (partner) {
          await earnAchievement('become_partner');
          earned.push('become_partner');
        }
      }

      // 10. 检查邀请成就
      const { count: referralCount } = await supabase
        .from('partner_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', user.id);
      
      if (referralCount && referralCount >= 1 && !hasAchievement('invite_1')) {
        await earnAchievement('invite_1');
        earned.push('invite_1');
      }
      if (referralCount && referralCount >= 3 && !hasAchievement('invite_3')) {
        await earnAchievement('invite_3');
        earned.push('invite_3');
      }
      if (referralCount && referralCount >= 5 && !hasAchievement('invite_5')) {
        await earnAchievement('invite_5');
        earned.push('invite_5');
      }
      if (referralCount && referralCount >= 7 && !hasAchievement('invite_7')) {
        await earnAchievement('invite_7');
        earned.push('invite_7');
      }
      if (referralCount && referralCount >= 10 && !hasAchievement('invite_10')) {
        await earnAchievement('invite_10');
        earned.push('invite_10');
      }
      
      // 11. 检查分享成就
      const { count: shareCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('post_type', 'growth_share');
      
      if (shareCount && shareCount >= 1 && !hasAchievement('first_share')) {
        await earnAchievement('first_share');
        earned.push('first_share');
      }
      if (shareCount && shareCount >= 5 && !hasAchievement('share_5')) {
        await earnAchievement('share_5');
        earned.push('share_5');
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmotionStat {
  name: string;
  count: number;
  percentage: number;
}

interface NeedStat {
  name: string;
  count: number;
  percentage: number;
}

interface AnalyticsData {
  totalSessions: number;
  totalBriefings: number;
  topEmotions: EmotionStat[];
  topNeeds: NeedStat[];
  topReactions: EmotionStat[];
  topActions: EmotionStat[];
  emotionTrend: { date: string; count: number }[];
  avgIntensity: number;
}

export const useEmotionAnalytics = (timeRange: 'week' | 'month' | 'all' = 'all') => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 计算日期范围
      const now = new Date();
      let startDate: Date | null = null;
      if (timeRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // 获取会话总数
      let sessionsQuery = supabase
        .from('emotion_coaching_sessions')
        .select('id, created_at', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (startDate) {
        sessionsQuery = sessionsQuery.gte('created_at', startDate.toISOString());
      }
      
      const { count: totalSessions } = await sessionsQuery;

      // 获取简报数据
      let briefingsQuery = supabase
        .from('briefings')
        .select(`
          id,
          emotion_theme,
          emotion_intensity,
          created_at,
          conversation_id,
          conversations!inner(user_id)
        `)
        .eq('conversations.user_id', user.id);
      
      if (startDate) {
        briefingsQuery = briefingsQuery.gte('created_at', startDate.toISOString());
      }
      
      const { data: briefings } = await briefingsQuery;

      // 获取情绪标签统计
      const { data: tagStats } = await supabase
        .from('briefing_tags')
        .select(`
          tag_id,
          tags!inner(name, user_id),
          briefings!inner(created_at)
        `)
        .eq('tags.user_id', user.id);

      // 获取用户偏好数据（情绪、需求、反应、行动）
      let prefsQuery = supabase
        .from('emotion_coach_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('frequency', { ascending: false });
      
      if (startDate) {
        prefsQuery = prefsQuery.gte('created_at', startDate.toISOString());
      }
      
      const { data: preferences } = await prefsQuery;

      // 统计情绪类型
      const emotionCounts: Record<string, number> = {};
      
      // 从简报的emotion_theme提取
      briefings?.forEach(b => {
        if (b.emotion_theme) {
          const emotions = b.emotion_theme.split(/[·,，、\s]+/).filter(Boolean);
          emotions.forEach(e => {
            const cleaned = e.trim();
            if (cleaned) {
              emotionCounts[cleaned] = (emotionCounts[cleaned] || 0) + 1;
            }
          });
        }
      });

      // 从标签统计添加
      tagStats?.forEach(ts => {
        const tagName = (ts.tags as any)?.name;
        if (tagName) {
          emotionCounts[tagName] = (emotionCounts[tagName] || 0) + 1;
        }
      });

      // 从偏好数据添加情绪
      preferences?.filter(p => p.category === 'emotions').forEach(p => {
        emotionCounts[p.custom_option] = (emotionCounts[p.custom_option] || 0) + p.frequency;
      });

      const totalEmotionCount = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
      const topEmotions: EmotionStat[] = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalEmotionCount > 0 ? Math.round((count / totalEmotionCount) * 100) : 0
        }));

      // 统计需求类型
      const needCounts: Record<string, number> = {};
      preferences?.filter(p => p.category === 'needs').forEach(p => {
        needCounts[p.custom_option] = (needCounts[p.custom_option] || 0) + p.frequency;
      });

      const totalNeedCount = Object.values(needCounts).reduce((a, b) => a + b, 0);
      const topNeeds: NeedStat[] = Object.entries(needCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalNeedCount > 0 ? Math.round((count / totalNeedCount) * 100) : 0
        }));

      // 统计反应模式
      const reactionCounts: Record<string, number> = {};
      preferences?.filter(p => p.category === 'reactions').forEach(p => {
        reactionCounts[p.custom_option] = (reactionCounts[p.custom_option] || 0) + p.frequency;
      });

      const totalReactionCount = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
      const topReactions: EmotionStat[] = Object.entries(reactionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalReactionCount > 0 ? Math.round((count / totalReactionCount) * 100) : 0
        }));

      // 统计行动选择
      const actionCounts: Record<string, number> = {};
      preferences?.filter(p => p.category === 'actions').forEach(p => {
        actionCounts[p.custom_option] = (actionCounts[p.custom_option] || 0) + p.frequency;
      });

      const totalActionCount = Object.values(actionCounts).reduce((a, b) => a + b, 0);
      const topActions: EmotionStat[] = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalActionCount > 0 ? Math.round((count / totalActionCount) * 100) : 0
        }));

      // 计算情绪趋势（按天）
      const trendMap: Record<string, number> = {};
      briefings?.forEach(b => {
        const date = new Date(b.created_at).toISOString().split('T')[0];
        trendMap[date] = (trendMap[date] || 0) + 1;
      });

      const emotionTrend = Object.entries(trendMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-14) // 最近14天
        .map(([date, count]) => ({ date, count }));

      // 计算平均情绪强度
      const intensities = briefings?.filter(b => b.emotion_intensity).map(b => b.emotion_intensity) || [];
      const avgIntensity = intensities.length > 0 
        ? Math.round(intensities.reduce((a, b) => a + (b || 0), 0) / intensities.length * 10) / 10
        : 0;

      setAnalytics({
        totalSessions: totalSessions || 0,
        totalBriefings: briefings?.length || 0,
        topEmotions,
        topNeeds,
        topReactions,
        topActions,
        emotionTrend,
        avgIntensity
      });
    } catch (error) {
      console.error('获取情绪分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, refresh: fetchAnalytics };
};

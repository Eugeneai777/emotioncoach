import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CampSummary {
  id: string;
  user_id: string;
  camp_id: string | null;
  start_awakening: number | null;
  end_awakening: number | null;
  awakening_growth: number | null;
  behavior_growth: number | null;
  emotion_growth: number | null;
  belief_growth: number | null;
  daily_scores: { day: number; score: number; date: string }[] | null;
  biggest_breakthrough: string | null;
  focus_areas: string[] | null;
  achievements_unlocked: string[] | null;
  ai_coach_message: string | null;
  generated_at: string | null;
}

export function useCampSummary(campId: string | null, shouldGenerate: boolean = false) {
  const [summary, setSummary] = useState<CampSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!campId) {
      setLoading(false);
      return;
    }

    loadSummary();
  }, [campId]);

  const loadSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // First try to load existing summary
      const { data: existingSummary, error } = await supabase
        .from('camp_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('camp_id', campId)
        .maybeSingle();

      if (error) {
        console.error('Error loading summary:', error);
      }

      if (existingSummary) {
        // Parse daily_scores if it's a string
        const parsedSummary = {
          ...existingSummary,
          daily_scores: typeof existingSummary.daily_scores === 'string' 
            ? JSON.parse(existingSummary.daily_scores)
            : existingSummary.daily_scores
        };
        setSummary(parsedSummary as CampSummary);
        setLoading(false);
        return;
      }

      // If no summary exists and we should generate one
      if (shouldGenerate) {
        await generateSummary(user.id);
      }
    } catch (error) {
      console.error('Error in loadSummary:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (userId?: string) => {
    setGenerating(true);
    try {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }

      if (!uid || !campId) {
        throw new Error('Missing userId or campId');
      }

      const { data, error } = await supabase.functions.invoke('generate-camp-summary', {
        body: { userId: uid, campId }
      });

      if (error) throw error;

      if (data?.summary) {
        const parsedSummary = {
          ...data.summary,
          daily_scores: typeof data.summary.daily_scores === 'string'
            ? JSON.parse(data.summary.daily_scores)
            : data.summary.daily_scores
        };
        setSummary(parsedSummary as CampSummary);
        
        if (!data.cached) {
          toast({
            title: "报告生成成功",
            description: "你的7天成长报告已生成"
          });
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "生成失败",
        description: "无法生成成长报告，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return {
    summary,
    loading,
    generating,
    generateSummary,
    refresh: loadSummary
  };
}

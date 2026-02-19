import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import UnifiedEmotionHeatmap from "@/components/UnifiedEmotionHeatmap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Briefing {
  id: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  created_at: string;
  briefing_tags?: Array<{
    tags: {
      name: string;
      sentiment: string | null;
    } | null;
  }>;
}

interface QuickLog {
  id: string;
  emotion_intensity: number;
  created_at: string;
  note: string | null;
}

const Calendar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [quickLogs, setQuickLogs] = useState<QuickLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 获取 briefings
      const { data: briefingsData, error: briefingsError } = await supabase
        .from('briefings')
        .select(`
          id,
          emotion_theme,
          emotion_intensity,
          created_at,
          conversation_id,
          conversations!inner(user_id),
          briefing_tags(
            tags(name, sentiment)
          )
        `)
        .eq('conversations.user_id', user.id)
        .order('created_at', { ascending: false });

      if (briefingsError) throw briefingsError;

      // 过滤掉家长教练的简报，确保只显示情绪日记的简报
      const { data: parentBriefingLinks } = await supabase
        .from('parent_coaching_sessions')
        .select('briefing_id')
        .not('briefing_id', 'is', null);

      const parentBriefingIds = new Set(
        parentBriefingLinks?.map(p => p.briefing_id).filter(Boolean) || []
      );

      const emotionDiaryBriefings = (briefingsData || []).filter(
        b => !parentBriefingIds.has(b.id)
      );

      // 获取 quick logs
      const { data: quickLogsData, error: quickLogsError } = await supabase
        .from('emotion_quick_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (quickLogsError) throw quickLogsError;

      setBriefings(emotionDiaryBriefings);
      setQuickLogs(quickLogsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="情绪日历" showHomeButton />

      <main className="container max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <UnifiedEmotionHeatmap briefings={briefings} quickLogs={quickLogs} />
        )}
      </main>
    </div>
  );
};

export default Calendar;

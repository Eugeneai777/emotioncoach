import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
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

      // 获取 quick logs
      const { data: quickLogsData, error: quickLogsError } = await supabase
        .from('emotion_quick_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (quickLogsError) throw quickLogsError;

      setBriefings(briefingsData || []);
      setQuickLogs(quickLogsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-1.5 md:gap-2 text-xs md:text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">返回主页</span>
              <span className="sm:hidden">返回</span>
            </Button>
            <h1 className="text-base md:text-xl font-bold text-foreground">情绪日历</h1>
          </div>
        </div>
      </header>

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

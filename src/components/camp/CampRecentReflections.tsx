import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Loader2, BookOpen } from "lucide-react";

interface Briefing {
  id: string;
  created_at: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  insight: string | null;
  action: string | null;
}

interface CampRecentReflectionsProps {
  userId: string;
  startDate: string;
  endDate: string;
}

export function CampRecentReflections({ userId, startDate, endDate }: CampRecentReflectionsProps) {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReflections();
  }, [userId, startDate, endDate]);

  const loadReflections = async () => {
    try {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId);

      if (convError) throw convError;
      if (!conversations || conversations.length === 0) {
        setBriefings([]);
        setLoading(false);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      const { data, error } = await supabase
        .from('briefings')
        .select('id, created_at, emotion_theme, emotion_intensity, insight, action')
        .in('conversation_id', conversationIds)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setBriefings(data || []);
    } catch (error) {
      console.error('Error loading reflections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (intensity: number | null) => {
    if (!intensity) return 'text-muted-foreground';
    if (intensity >= 8) return 'text-red-500';
    if (intensity >= 5) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (briefings.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>还没有情绪日记记录</p>
        <p className="text-xs mt-1">完成对话后会自动生成</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        📝 最近反思
      </h4>
      
      <div className="space-y-2">
        {briefings.map((briefing) => (
          <Card key={briefing.id} className="p-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {briefing.emotion_theme}
                  </span>
                  {briefing.emotion_intensity && (
                    <span className={`text-xs font-bold ${getIntensityColor(briefing.emotion_intensity)}`}>
                      {briefing.emotion_intensity}/10
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(briefing.created_at), 'MM月dd日 HH:mm', { locale: zhCN })}
                </div>
              </div>
            </div>
            
            {briefing.insight && (
              <div className="text-xs text-foreground/80 line-clamp-2 mb-1">
                💡 {briefing.insight}
              </div>
            )}
            
            {briefing.action && (
              <div className="text-xs text-foreground/80 line-clamp-1">
                🎯 {briefing.action}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MoodLog {
  mood_label: string;
  intensity: number;
  feature_used: string;
  created_at: string;
}

export function useElderMoodReport() {
  // Fetch raw logs for chart
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["elder-mood-logs-7d"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("elder_mood_logs")
        .select("mood_label, intensity, feature_used, created_at")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as MoodLog[];
    },
  });

  // Fetch AI summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["elder-mood-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("elder-mood-summary");
      if (error) throw error;
      return data as { summary: string | null; hasData: boolean; totalLogs?: number };
    },
    staleTime: 1000 * 60 * 30,
  });

  return {
    logs: logs || [],
    summary: summaryData?.summary || null,
    hasData: summaryData?.hasData || false,
    totalLogs: summaryData?.totalLogs || 0,
    isLoading: logsLoading || summaryLoading,
  };
}

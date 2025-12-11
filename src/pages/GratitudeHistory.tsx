import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GratitudeStatsCard } from "@/components/gratitude/GratitudeStatsCard";
import { GratitudeTrendChart } from "@/components/gratitude/GratitudeTrendChart";
import { GratitudeTagDistribution } from "@/components/gratitude/GratitudeTagDistribution";
import { GratitudeQuickAdd } from "@/components/gratitude/GratitudeQuickAdd";
import { GratitudeEntriesList } from "@/components/gratitude/GratitudeEntriesList";
import { GratitudeDashboard } from "@/components/gratitude/GratitudeDashboard";
import { THEME_DEFINITIONS } from "@/components/gratitude/GratitudeThemeBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface GratitudeEntry {
  id: string;
  content: string;
  category: string;
  themes?: string[];
  created_at: string;
}

const GratitudeHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    console.log('[GratitudeHistory] Current user:', user?.id, user?.email);
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("gratitude_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate theme stats
  const themeStats: Record<string, number> = useMemo(() => {
    const stats: Record<string, number> = {};
    entries.forEach(entry => {
      const themes = entry.themes || [];
      themes.forEach(theme => {
        stats[theme] = (stats[theme] || 0) + 1;
      });
    });
    return stats;
  }, [entries]);

  const handleTagClick = (themeId: string) => {
    setFilterTag(prev => prev === themeId ? null : themeId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // 未登录状态提示
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">我的感恩日记</h1>
              <p className="text-sm text-muted-foreground">看见日常微光，点亮内心力量</p>
            </div>
          </div>
          
          <div className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-50" />
            <h3 className="text-lg font-medium mb-2">请先登录</h3>
            <p className="text-sm text-muted-foreground mb-4">
              登录后查看您的感恩记录
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-teal-500 to-cyan-500"
            >
              去登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">我的感恩日记</h1>
            <p className="text-sm text-muted-foreground">看见日常微光，点亮内心力量</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Stats Card */}
          <GratitudeStatsCard entries={entries} />

          {/* Trend Chart */}
          <GratitudeTrendChart entries={entries} />

          {/* Tag Distribution */}
          <GratitudeTagDistribution
            themeStats={themeStats}
            onTagClick={handleTagClick}
            selectedTag={filterTag}
          />

          {/* Quick Add */}
          {user && (
            <GratitudeQuickAdd userId={user.id} onAdded={loadEntries} />
          )}

          {/* Entries List */}
          <GratitudeEntriesList
            entries={entries}
            filterTag={filterTag}
            onFilterTagChange={setFilterTag}
            onRefresh={loadEntries}
          />

          {/* AI Dashboard - Collapsible */}
          <Collapsible open={showDashboard} onOpenChange={setShowDashboard}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-white/60 dark:bg-gray-800/40 backdrop-blur"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI 幸福仪表盘
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDashboard ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <GratitudeDashboard />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default GratitudeHistory;

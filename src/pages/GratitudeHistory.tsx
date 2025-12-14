import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GratitudeStatsCard } from "@/components/gratitude/GratitudeStatsCard";
import { GratitudeTrendChart } from "@/components/gratitude/GratitudeTrendChart";
import { GratitudeQuickAdd } from "@/components/gratitude/GratitudeQuickAdd";
import { GratitudeEntriesList } from "@/components/gratitude/GratitudeEntriesList";
import { GratitudeDashboard } from "@/components/gratitude/GratitudeDashboard";
import { Sparkles } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadEntries();
    setIsRefreshing(false);
  }, [user]);

  // Pull to refresh
  const {
    containerRef,
    pullDistance,
    pullProgress,
    isRefreshing: isPullRefreshing,
    pullStyle
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120
  });

  // 页面聚焦时自动刷新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('[GratitudeHistory] Page visible, refreshing data...');
        loadEntries();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

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
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        pullProgress={pullProgress}
        isRefreshing={isPullRefreshing}
        threshold={80}
      />
      
      <div 
        ref={containerRef}
        className="max-w-2xl mx-auto px-3 py-3 pb-20 h-screen overflow-y-auto overscroll-contain"
        style={pullStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">感恩日记</h1>
              <p className="text-xs text-muted-foreground">看见日常微光，点亮内心力量</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing || isPullRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isPullRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Stats Card */}
          <GratitudeStatsCard entries={entries} />

          {/* Trend Chart */}
          <GratitudeTrendChart entries={entries} />

          {/* Happiness Dashboard (integrated with Tag Distribution) */}
          <GratitudeDashboard
            themeStats={themeStats}
            onTagClick={handleTagClick}
            selectedTag={filterTag}
          />

          {/* Entries List */}
          <GratitudeEntriesList
            entries={entries}
            filterTag={filterTag}
            onFilterTagChange={setFilterTag}
            onRefresh={loadEntries}
          />
        </div>
      </div>

      {/* Fixed Bottom Input */}
      {user && (
        <GratitudeQuickAdd userId={user.id} onAdded={loadEntries} />
      )}
    </div>
  );
};

export default GratitudeHistory;

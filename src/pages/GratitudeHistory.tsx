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
import { GratitudeSyncButton } from "@/components/gratitude/GratitudeSyncButton";
import { GratitudeRegisterPrompt } from "@/components/conversion/GratitudeRegisterPrompt";
import { GratitudePurchasePrompt } from "@/components/conversion/GratitudePurchasePrompt";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { useLocalGratitude } from "@/hooks/useLocalGratitude";
import { toast } from "@/hooks/use-toast";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

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
  const { showTour, completeTour } = usePageTour('gratitude_journal');
  const [dbEntries, setDbEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Local storage for unregistered users
  const {
    entries: localEntries,
    addEntry: addLocalEntry,
    themeStats: localThemeStats,
  } = useLocalGratitude();

  // Conversion prompts state
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [showPurchasePrompt, setShowPurchasePrompt] = useState(false);
  const [purchaseRequired, setPurchaseRequired] = useState(false);

  // Determine which entries to use
  const entries = user ? dbEntries : localEntries;

  // Calculate unanalyzed count
  const unanalyzedCount = useMemo(() => {
    return entries.filter(e => !e.themes || e.themes.length === 0).length;
  }, [entries]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    if (!user) return;
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

  // Auto-refresh on page visibility change (only for logged-in users)
  useEffect(() => {
    if (!user) return;
    
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
    if (user) {
      console.log('[GratitudeHistory] Current user:', user?.id, user?.email);
      loadEntries();
    } else {
      setLoading(false);
    }
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
      setDbEntries(data || []);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate theme stats
  const dbThemeStats: Record<string, number> = useMemo(() => {
    const stats: Record<string, number> = {};
    dbEntries.forEach(entry => {
      const themes = entry.themes || [];
      themes.forEach(theme => {
        stats[theme] = (stats[theme] || 0) + 1;
      });
    });
    return stats;
  }, [dbEntries]);

  const themeStats = user ? dbThemeStats : localThemeStats;

  const handleTagClick = (themeId: string) => {
    setFilterTag(prev => prev === themeId ? null : themeId);
  };

  // Handle entry added (for local storage)
  const handleLocalEntryAdded = () => {
    // Entry is already added via useLocalGratitude
  };

  // Batch analyze all unanalyzed entries
  const handleBatchAnalyze = async () => {
    if (!user) {
      setShowRegisterPrompt(true);
      return;
    }
    
    if (unanalyzedCount === 0) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("batch-analyze-gratitude", {
        body: {},
      });

      if (error) {
        console.error("批量分析失败:", error);
        toast({ 
          title: "分析失败", 
          description: error.message || "请稍后重试",
          variant: "destructive" 
        });
      } else if (data?.insufficient_quota || (data?.failed > 0 && data?.success === 0)) {
        toast({ 
          title: "余额不足", 
          description: "请充值后再试",
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: `已分析 ${data?.success || 0} 条记录 ✨`,
          description: data?.failed > 0 ? `${data.failed} 条失败` : "查看标签分布了解你的幸福来源"
        });
      }
      await loadEntries();
    } catch (err) {
      console.error("批量分析出错:", err);
      toast({ title: "分析失败", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <>
      <DynamicOGMeta pageKey="gratitudeHistory" />
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
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing || isPullRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing || isPullRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {/* AI Analysis Sync Button - Show for all users */}
          <GratitudeSyncButton
            entryCount={entries.length}
            unanalyzedCount={unanalyzedCount}
            onAnalyze={handleBatchAnalyze}
            isAnalyzing={isAnalyzing}
            isLoggedIn={!!user}
          />

          {/* Stats Card */}
          <GratitudeStatsCard entries={entries} />

          {/* Trend Chart */}
          <GratitudeTrendChart entries={entries} />

          {/* Happiness Dashboard (integrated with Tag Distribution) */}
          <GratitudeDashboard
            themeStats={themeStats}
            onTagClick={handleTagClick}
            selectedTag={filterTag}
            isLoggedIn={!!user}
          />

          {/* Entries List */}
          <GratitudeEntriesList
            entries={entries}
            filterTag={filterTag}
            onFilterTagChange={setFilterTag}
            onRefresh={user ? loadEntries : undefined}
          />
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <GratitudeQuickAdd 
        userId={user?.id} 
        onAdded={user ? loadEntries : handleLocalEntryAdded}
        onLocalAdd={!user ? addLocalEntry : undefined}
      />

      {/* Conversion Prompts */}
      <GratitudeRegisterPrompt
        open={showRegisterPrompt}
        onClose={() => setShowRegisterPrompt(false)}
        entryCount={localEntries.length}
      />
      <GratitudePurchasePrompt
        open={showPurchasePrompt}
        onClose={() => setShowPurchasePrompt(false)}
        entryCount={localEntries.length}
        isRequired={purchaseRequired}
      />
      <PageTour open={showTour} onComplete={completeTour} steps={pageTourConfig.gratitude_journal} pageTitle="感恩日记" />
    </div>
    </>
  );
};

export default GratitudeHistory;

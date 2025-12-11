import { useMemo, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Heart, ChevronDown, X, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GratitudeThemeBadge, THEME_DEFINITIONS } from "./GratitudeThemeBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GratitudeEntry {
  id: string;
  content: string;
  themes?: string[];
  created_at: string;
}

interface GratitudeEntriesListProps {
  entries: GratitudeEntry[];
  filterTag: string | null;
  onFilterTagChange: (tag: string | null) => void;
  onRefresh: () => void;
}

export const GratitudeEntriesList = ({ 
  entries, 
  filterTag, 
  onFilterTagChange,
  onRefresh
}: GratitudeEntriesListProps) => {
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month">("all");
  const [showCount, setShowCount] = useState(20);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);

  const filteredEntries = useMemo(() => {
    let result = [...entries];
    
    // Time filter
    const now = new Date();
    if (timeFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(e => new Date(e.created_at) >= weekAgo);
    } else if (timeFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(e => new Date(e.created_at) >= monthAgo);
    }
    
    // Tag filter
    if (filterTag) {
      result = result.filter(e => e.themes?.includes(filterTag));
    }
    
    return result;
  }, [entries, timeFilter, filterTag]);

  // Calculate global index for each entry
  const entryIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((entry, idx) => {
      map.set(entry.id, entries.length - idx);
    });
    return map;
  }, [entries]);

  // Group by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, GratitudeEntry[]> = {};
    
    filteredEntries.slice(0, showCount).forEach(entry => {
      const dateKey = format(new Date(entry.created_at), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({
        date,
        displayDate: format(new Date(date), "MM月dd日 EEEE", { locale: zhCN }),
        entries: items,
      }));
  }, [filteredEntries, showCount]);

  const selectedTagDef = filterTag ? THEME_DEFINITIONS.find(t => t.id === filterTag) : null;

  // Count unanalyzed entries
  const unanalyzedCount = entries.filter(e => !e.themes || e.themes.length === 0).length;

  const handleReanalyze = async (entryId: string, content: string) => {
    setAnalyzingIds(prev => new Set(prev).add(entryId));
    try {
      const { error } = await supabase.functions.invoke("analyze-gratitude-entry", {
        body: { entryId, content },
      });
      if (error) throw error;
      toast({ title: "分析完成 ✨" });
      onRefresh();
    } catch (err) {
      console.error("分析失败:", err);
      toast({ title: "分析失败", variant: "destructive" });
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  };

  const handleBatchAnalyze = async () => {
    const unanalyzed = entries.filter(e => !e.themes || e.themes.length === 0);
    if (unanalyzed.length === 0) return;

    setBatchAnalyzing(true);
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
      } else if (data?.insufficient_quota || data?.failed > 0 && data?.success === 0) {
        toast({ 
          title: "余额不足", 
          description: "请充值后再试",
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: `已分析 ${data?.success || 0} 条记录 ✨`,
          description: data?.failed > 0 ? `${data.failed} 条失败` : undefined
        });
      }
      onRefresh();
    } catch (err) {
      console.error("批量分析出错:", err);
      toast({ title: "分析失败", variant: "destructive" });
    } finally {
      setBatchAnalyzing(false);
    }
  };

  return (
    <div className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            📝 全部感恩记录
            <span className="text-xs text-muted-foreground font-normal">
              共 {entries.length} 条
            </span>
          </h3>
          
          {unanalyzedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchAnalyze}
              disabled={batchAnalyzing}
              className="text-xs h-7 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-200 hover:border-teal-300"
            >
              {batchAnalyzing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              同步分析 ({unanalyzedCount}条·扣1点)
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
            </SelectContent>
          </Select>
          
          {filterTag && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-xs">
              <span>{selectedTagDef?.emoji}</span>
              <span>{selectedTagDef?.name}</span>
              <button
                onClick={() => onFilterTagChange(null)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Entries */}
      <div className="max-h-[500px] overflow-y-auto">
        {groupedEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {filterTag ? "没有符合筛选条件的记录" : "还没有感恩记录"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {groupedEntries.map(group => (
              <div key={group.date} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {group.displayDate}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.entries.length} 条
                  </span>
                </div>
                
                <div className="space-y-2">
                  {group.entries.map(entry => {
                    const themes = entry.themes || [];
                    const primaryTheme = themes[0] ? THEME_DEFINITIONS.find(t => t.id === themes[0]) : null;
                    const globalIndex = entryIndexMap.get(entry.id) || 0;
                    const isAnalyzing = analyzingIds.has(entry.id);
                    
                    return (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg border-l-4 transition-all hover:shadow-sm"
                        style={{
                          borderLeftColor: primaryTheme?.color || "hsl(var(--muted))",
                          backgroundColor: primaryTheme ? `${primaryTheme.color}08` : "hsl(var(--muted)/0.05)"
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              #{globalIndex}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {themes.length > 0 ? (
                                themes.map((themeId, idx) => (
                                  <GratitudeThemeBadge
                                    key={themeId}
                                    themeId={themeId}
                                    size="sm"
                                    showLabel={idx === 0}
                                  />
                                ))
                              ) : (
                                <button
                                  onClick={() => handleReanalyze(entry.id, entry.content)}
                                  disabled={isAnalyzing}
                                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                >
                                  {isAnalyzing ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                  {isAnalyzing ? "分析中..." : "点击分析"}
                                </button>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(entry.created_at), "HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{entry.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load more */}
        {filteredEntries.length > showCount && (
          <div className="p-4 text-center border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCount(prev => prev + 20)}
              className="text-muted-foreground"
            >
              <ChevronDown className="w-4 h-4 mr-1" />
              加载更多 ({filteredEntries.length - showCount} 条)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

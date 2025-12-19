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
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-medium whitespace-nowrap">📝 记录</h3>
            <span className="text-xs text-muted-foreground">({entries.length})</span>
            
            {/* Filters inline */}
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
              <SelectTrigger className="w-16 h-6 text-xs px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>
            
            {filterTag && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-xs">
                <span className="text-xs">{selectedTagDef?.emoji}</span>
                <button
                  onClick={() => onFilterTagChange(null)}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          
          {unanalyzedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchAnalyze}
              disabled={batchAnalyzing}
              className="text-xs h-6 px-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-200 hover:border-pink-300 shrink-0"
            >
              {batchAnalyzing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {unanalyzedCount}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Entries */}
      <div className="max-h-[400px] overflow-y-auto">
        {groupedEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-2">
              {filterTag ? "没有符合筛选条件的记录" : "还没有感恩记录"}
            </p>
            {!filterTag && (
              <p className="text-xs text-muted-foreground/70">
                试试用语音对话记录第一条感恩吧 ✨
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {groupedEntries.map(group => (
              <div key={group.date} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.displayDate}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {group.entries.length}条
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  {group.entries.map(entry => {
                    const themes = entry.themes || [];
                    const primaryTheme = themes[0] ? THEME_DEFINITIONS.find(t => t.id === themes[0]) : null;
                    const globalIndex = entryIndexMap.get(entry.id) || 0;
                    const isAnalyzing = analyzingIds.has(entry.id);
                    
                    return (
                      <div
                        key={entry.id}
                        className="p-2.5 rounded-lg transition-all hover:shadow-sm bg-white/80 dark:bg-gray-800/60"
                        style={{
                          borderLeftWidth: "3px",
                          borderLeftColor: primaryTheme?.color || "hsl(var(--muted))",
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            #{globalIndex}
                          </span>
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {themes.length > 0 ? (
                              themes.slice(0, 2).map((themeId) => (
                                <GratitudeThemeBadge
                                  key={themeId}
                                  themeId={themeId}
                                  size="sm"
                                  showLabel={false}
                                />
                              ))
                            ) : (
                              <button
                                onClick={() => handleReanalyze(entry.id, entry.content)}
                                disabled={isAnalyzing}
                                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                              >
                                {isAnalyzing ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-2.5 h-2.5" />
                                )}
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {format(new Date(entry.created_at), "HH:mm")}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground">{entry.content}</p>
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

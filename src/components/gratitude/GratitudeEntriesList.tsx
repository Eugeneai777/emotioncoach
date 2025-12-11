import { useMemo, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Heart, ChevronDown, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GratitudeThemeBadge, THEME_DEFINITIONS } from "./GratitudeThemeBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
}

export const GratitudeEntriesList = ({ 
  entries, 
  filterTag, 
  onFilterTagChange 
}: GratitudeEntriesListProps) => {
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month">("all");
  const [showCount, setShowCount] = useState(20);

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

  return (
    <div className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            📝 全部感恩记录
            <span className="text-xs text-muted-foreground font-normal">
              共 {filteredEntries.length} 条
            </span>
          </h3>
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
                              <span className="text-xs text-muted-foreground">待分析</span>
                            )}
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

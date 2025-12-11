import { useMemo } from "react";
import { THEME_DEFINITIONS } from "./GratitudeThemeBadge";
import { AlertTriangle } from "lucide-react";

interface GratitudeTagDistributionProps {
  themeStats: Record<string, number>;
  onTagClick?: (themeId: string) => void;
  selectedTag?: string | null;
}

export const GratitudeTagDistribution = ({ 
  themeStats, 
  onTagClick, 
  selectedTag 
}: GratitudeTagDistributionProps) => {
  const { sortedThemes, total } = useMemo(() => {
    const total = Object.values(themeStats).reduce((sum, v) => sum + v, 0);
    
    const themes = THEME_DEFINITIONS.map(theme => ({
      ...theme,
      count: themeStats[theme.id] || 0,
      percentage: total > 0 ? ((themeStats[theme.id] || 0) / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
    
    return { sortedThemes: themes, total };
  }, [themeStats]);

  if (total === 0) {
    return (
      <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          🏷️ 标签分布
        </h3>
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">开始记录感恩，看看你的幸福来源 ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        🏷️ 标签分布
        <span className="text-xs text-muted-foreground font-normal">点击筛选</span>
      </h3>
      
      <div className="space-y-2">
        {sortedThemes.map((theme) => {
          const isSelected = selectedTag === theme.id;
          const needsAttention = theme.percentage > 0 && theme.percentage < 10;
          
          return (
            <button
              key={theme.id}
              onClick={() => theme.count > 0 && onTagClick?.(theme.id)}
              disabled={theme.count === 0}
              className={`
                w-full flex items-center gap-2 p-2 rounded-lg transition-all
                ${theme.count > 0 ? "cursor-pointer hover:bg-muted/50" : "opacity-40 cursor-not-allowed"}
                ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}
              `}
            >
              <span className="text-lg w-7">{theme.emoji}</span>
              <span className="text-sm font-medium w-12 text-left truncate">{theme.name}</span>
              
              <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${theme.percentage}%`,
                    backgroundColor: theme.color,
                  }}
                />
              </div>
              
              <span className="text-xs text-muted-foreground w-10 text-right">
                {theme.percentage.toFixed(0)}%
              </span>
              <span className="text-xs font-medium w-8 text-right">
                {theme.count}
              </span>
              
              {needsAttention && (
                <span className="text-amber-500 text-xs flex items-center gap-0.5" title="需要更多关注">
                  <AlertTriangle className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>总计 {total} 条标签</span>
        {selectedTag && (
          <button 
            onClick={() => onTagClick?.(selectedTag)}
            className="text-primary hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  );
};

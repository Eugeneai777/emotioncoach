import { useMemo } from "react";
import { THEME_DEFINITIONS } from "./GratitudeThemeBadge";

interface TagCloudProps {
  themeStats: Record<string, number>;
  onTagClick?: (themeId: string) => void;
  selectedTag?: string | null;
  showCounts?: boolean;
}

export const GratitudeTagCloud = ({ themeStats, onTagClick, selectedTag, showCounts = false }: TagCloudProps) => {
  const total = useMemo(() => 
    Object.values(themeStats).reduce((sum, v) => sum + v, 0), 
    [themeStats]
  );

  const sortedThemes = useMemo(() => {
    return THEME_DEFINITIONS
      .map(theme => ({
        ...theme,
        count: themeStats[theme.id] || 0,
        percentage: total > 0 ? ((themeStats[theme.id] || 0) / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [themeStats, total]);

  const maxCount = Math.max(...sortedThemes.map(t => t.count), 1);

  if (total === 0) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-gray-800/50 dark:to-gray-700/50">
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">开始记录感恩，标签云将在这里绽放 ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-gray-800/50 dark:to-gray-700/50 h-full">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {sortedThemes.map((theme) => {
          const isSelected = selectedTag === theme.id;
          const hasCount = theme.count > 0;
          const ratio = theme.count / maxCount;
          
          return (
            <button
              key={theme.id}
              onClick={() => onTagClick?.(theme.id)}
              disabled={!hasCount}
              className={`
                group relative transition-all duration-300 ease-out px-2 py-1 rounded-full
                ${hasCount ? "cursor-pointer hover:scale-105" : "opacity-40 cursor-not-allowed"}
                ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}
              `}
              style={{
                backgroundColor: hasCount ? `${theme.color}20` : "transparent",
              }}
            >
              <span className="flex items-center gap-1" style={{ color: hasCount ? theme.color : "hsl(var(--muted-foreground))" }}>
                <span className={`${ratio > 0.5 ? "text-lg" : "text-base"}`}>
                  {theme.emoji}
                </span>
                {showCounts && hasCount && (
                  <span className={`font-medium ${ratio > 0.7 ? "text-base" : "text-sm"}`}>
                    ({theme.count})
                  </span>
                )}
              </span>
              
              {/* Tooltip on hover */}
              {hasCount && (
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs whitespace-nowrap bg-background/95 backdrop-blur px-2 py-1 rounded shadow-sm border z-10">
                  {theme.name} · {theme.percentage.toFixed(0)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-3">
        点击筛选记录
      </p>
    </div>
  );
};

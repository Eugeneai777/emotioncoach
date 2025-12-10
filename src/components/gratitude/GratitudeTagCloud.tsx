import { useMemo } from "react";
import { THEME_DEFINITIONS, ThemeDefinition } from "./GratitudeThemeBadge";

interface TagCloudProps {
  themeStats: Record<string, number>;
  onTagClick?: (themeId: string) => void;
  selectedTag?: string | null;
}

export const GratitudeTagCloud = ({ themeStats, onTagClick, selectedTag }: TagCloudProps) => {
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

  const getFontSize = (count: number) => {
    if (count === 0) return "text-sm";
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-xl md:text-2xl";
    if (ratio > 0.4) return "text-lg md:text-xl";
    if (ratio > 0.2) return "text-base md:text-lg";
    return "text-sm md:text-base";
  };

  if (total === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">开始记录感恩，标签云将在这里绽放 ✨</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-gray-800/50 dark:to-gray-700/50">
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        {sortedThemes.map((theme) => {
          const isSelected = selectedTag === theme.id;
          const hasCount = theme.count > 0;
          
          return (
            <button
              key={theme.id}
              onClick={() => onTagClick?.(theme.id)}
              disabled={!hasCount}
              className={`
                group relative transition-all duration-300 ease-out
                ${getFontSize(theme.count)}
                ${hasCount ? "cursor-pointer hover:scale-110" : "opacity-40 cursor-not-allowed"}
                ${isSelected ? "scale-110" : ""}
              `}
              style={{
                color: hasCount ? theme.color : "hsl(var(--muted-foreground))",
              }}
            >
              <span className="flex items-center gap-1">
                <span className={`transition-transform duration-200 ${hasCount ? "group-hover:animate-bounce" : ""}`}>
                  {theme.emoji}
                </span>
                <span className={`font-medium ${isSelected ? "underline underline-offset-4" : ""}`}>
                  {theme.name}
                </span>
              </span>
              
              {/* Tooltip on hover */}
              {hasCount && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs whitespace-nowrap bg-background/90 backdrop-blur px-2 py-1 rounded shadow-sm border">
                  {theme.count}次 · {theme.percentage.toFixed(0)}%
                </span>
              )}
              
              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-4">
        💫 字体越大，出现频率越高 · 点击标签可筛选记录
      </p>
    </div>
  );
};

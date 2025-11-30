import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface ParentTag {
  id: string;
  name: string;
  color: string;
}

interface ParentSession {
  id: string;
  tags?: ParentTag[];
  created_at: string;
  briefing?: {
    emotion_theme: string;
  };
}

interface ParentEmotionTagCloudProps {
  sessions: ParentSession[];
}

interface TagFrequency {
  tag: ParentTag;
  count: number;
}

export const ParentEmotionTagCloud = ({ sessions }: ParentEmotionTagCloudProps) => {
  const navigate = useNavigate();
  
  const tagFrequencies = useMemo(() => {
    const tagMap = new Map<string, TagFrequency>();

    sessions.forEach((session) => {
      session.tags?.forEach((tag) => {
        const existing = tagMap.get(tag.id);
        if (existing) {
          existing.count += 1;
        } else {
          tagMap.set(tag.id, { tag, count: 1 });
        }
      });
    });

    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
  }, [sessions]);

  // 统计情绪主题
  const emotionThemes = useMemo(() => {
    const themes = sessions
      .filter(s => s.briefing?.emotion_theme)
      .reduce((acc, session) => {
        const theme = session.briefing!.emotion_theme;
        acc[theme] = (acc[theme] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [sessions]);

  if (tagFrequencies.length === 0 && emotionThemes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">还没有情绪标签记录</p>
        <p className="text-sm text-muted-foreground mt-2">完成情绪梳理后会自动生成标签 🌿</p>
      </div>
    );
  }

  const maxCount = tagFrequencies.length > 0 ? tagFrequencies[0].count : 1;
  const minCount = tagFrequencies.length > 0 ? tagFrequencies[tagFrequencies.length - 1].count : 1;
  const maxThemeCount = emotionThemes.length > 0 ? Math.max(...emotionThemes.map(t => t[1])) : 1;

  const getFontSize = (count: number, max: number, min: number, isMobile: boolean = false) => {
    const ratio = max === min ? 1 : (count - min) / (max - min);
    if (isMobile) {
      const minSize = 0.75; // 12px
      const maxSize = 1.5; // 24px
      return minSize + ratio * (maxSize - minSize);
    }
    const minSize = 0.875; // 14px (text-sm)
    const maxSize = 2.5; // 40px (text-4xl)
    return minSize + ratio * (maxSize - minSize);
  };

  return (
    <div className="space-y-6">
      {tagFrequencies.length > 0 && (
        <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6">
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              ☁️ 亲子标签词云
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              展示你最常出现的亲子标签，帮助你了解自己的模式
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center p-4 md:p-6 bg-background/50 rounded-xl md:rounded-2xl min-h-[200px] md:min-h-[300px]">
            {tagFrequencies.map(({ tag, count }) => (
              <div
                key={tag.id}
                className="transition-transform hover:scale-110 cursor-pointer md:hidden"
                style={{
                  fontSize: `${getFontSize(count, maxCount, minCount, true)}rem`,
                  color: tag.color,
                  fontWeight: 600,
                  textShadow: `0 1px 4px ${tag.color}30`,
                }}
                title={`${tag.name}: 出现 ${count} 次`}
              >
                {tag.name}
              </div>
            ))}
            {tagFrequencies.map(({ tag, count }) => (
              <div
                key={`desktop-${tag.id}`}
                className="transition-transform hover:scale-110 cursor-pointer hidden md:block"
                style={{
                  fontSize: `${getFontSize(count, maxCount, minCount, false)}rem`,
                  color: tag.color,
                  fontWeight: 600,
                  textShadow: `0 2px 8px ${tag.color}30`,
                }}
                title={`${tag.name}: 出现 ${count} 次`}
              >
                {tag.name}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] md:text-xs text-muted-foreground pt-3 md:pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="text-xs md:text-sm font-medium">💫</div>
              <span>字体越大，出现频率越高</span>
            </div>
            <div>共 {tagFrequencies.length} 个标签</div>
          </div>
        </div>
      )}

      {emotionThemes.length > 0 && (
        <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6">
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              💜 情绪主题分布
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              最常出现的情绪主题
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center p-4 md:p-6 bg-background/50 rounded-xl md:rounded-2xl min-h-[150px] md:min-h-[200px]">
            {emotionThemes.map(([theme, count]) => {
              const ratio = count / maxThemeCount;
              const fontSize = 0.875 + ratio * 1.625; // 0.875rem to 2.5rem
              return (
                <div
                  key={theme}
                  className="transition-transform hover:scale-110"
                  style={{
                    fontSize: `${fontSize}rem`,
                    color: "hsl(var(--primary))",
                    fontWeight: 600,
                    textShadow: "0 2px 8px hsl(var(--primary) / 0.3)",
                  }}
                  title={`${theme}: 出现 ${count} 次`}
                >
                  {theme}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 text-[10px] md:text-xs text-muted-foreground pt-3 md:pt-4 border-t border-border/50">
            <div>共 {emotionThemes.length} 个主题</div>
          </div>
        </div>
      )}
    </div>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export const ParentEmotionTagCloud = ({ sessions }: ParentEmotionTagCloudProps) => {
  // 统计标签出现频率
  const tagStats = sessions.reduce((acc, session) => {
    session.tags?.forEach(tag => {
      if (!acc[tag.name]) {
        acc[tag.name] = { count: 0, color: tag.color, name: tag.name };
      }
      acc[tag.name].count++;
    });
    return acc;
  }, {} as Record<string, { count: number; color: string; name: string }>);

  const sortedTags = Object.values(tagStats).sort((a, b) => b.count - a.count);

  // 统计情绪主题
  const emotionThemes = sessions
    .filter(s => s.briefing?.emotion_theme)
    .reduce((acc, session) => {
      const theme = session.briefing!.emotion_theme;
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const sortedThemes = Object.entries(emotionThemes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxCount = Math.max(...sortedTags.map(t => t.count));
  const maxThemeCount = Math.max(...sortedThemes.map(t => t[1]));

  const getFontSize = (count: number, max: number) => {
    const ratio = count / max;
    if (ratio > 0.8) return "text-2xl md:text-3xl";
    if (ratio > 0.6) return "text-xl md:text-2xl";
    if (ratio > 0.4) return "text-lg md:text-xl";
    return "text-base md:text-lg";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🏷️ 亲子标签词云
        </h3>
        {sortedTags.length > 0 ? (
          <div className="flex flex-wrap gap-3 justify-center items-center p-4">
            {sortedTags.map((tag) => (
              <Badge
                key={tag.name}
                variant="outline"
                className={`${getFontSize(tag.count, maxCount)} px-3 py-1.5 cursor-pointer hover:scale-110 transition-transform`}
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: tag.color,
                }}
              >
                {tag.name} ({tag.count})
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">暂无标签数据</p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          💜 情绪主题分布
        </h3>
        {sortedThemes.length > 0 ? (
          <div className="flex flex-wrap gap-3 justify-center items-center p-4">
            {sortedThemes.map(([theme, count]) => (
              <Badge
                key={theme}
                variant="outline"
                className={`${getFontSize(count, maxThemeCount)} px-3 py-1.5`}
                style={{
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                  borderColor: "hsl(var(--primary))",
                }}
              >
                {theme} ({count})
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">暂无情绪主题数据</p>
        )}
      </Card>
    </div>
  );
};
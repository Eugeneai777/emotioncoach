import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface Briefing {
  id: string;
  tags?: TagType[];
}

interface EmotionTagCloudProps {
  briefings: Briefing[];
}

interface TagFrequency {
  tag: TagType;
  count: number;
}

const EmotionTagCloud = ({ briefings }: EmotionTagCloudProps) => {
  const navigate = useNavigate();
  
  const tagFrequencies = useMemo(() => {
    const tagMap = new Map<string, TagFrequency>();

    briefings.forEach((briefing) => {
      briefing.tags?.forEach((tag) => {
        const existing = tagMap.get(tag.id);
        if (existing) {
          existing.count += 1;
        } else {
          tagMap.set(tag.id, { tag, count: 1 });
        }
      });
    });

    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
  }, [briefings]);

  if (tagFrequencies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">还没有情绪标签记录</p>
        <p className="text-sm text-muted-foreground mt-2">完成情绪梳理后会自动生成标签 🌿</p>
      </div>
    );
  }

  const maxCount = tagFrequencies[0].count;
  const minCount = tagFrequencies[tagFrequencies.length - 1].count;

  const getFontSize = (count: number, isMobile: boolean = false) => {
    const ratio = (count - minCount) / (maxCount - minCount || 1);
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
    <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="space-y-1 md:space-y-2">
        <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
          ☁️ 情绪标签云
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground">
          展示你最常出现的情绪标签，帮助你了解自己的情绪模式
        </p>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center p-4 md:p-6 bg-background/50 rounded-xl md:rounded-2xl min-h-[200px] md:min-h-[300px]">
        {tagFrequencies.map(({ tag, count }) => (
          <div
            key={tag.id}
            className="transition-transform hover:scale-110 cursor-pointer md:hidden"
            style={{
              fontSize: `${getFontSize(count, true)}rem`,
              color: tag.color,
              fontWeight: 600,
              textShadow: `0 1px 4px ${tag.color}30`,
            }}
            title={`${tag.name}: 出现 ${count} 次`}
            onClick={() => navigate(`/tag-stats?tag=${tag.id}`)}
          >
            {tag.name}
          </div>
        ))}
        {tagFrequencies.map(({ tag, count }) => (
          <div
            key={`desktop-${tag.id}`}
            className="transition-transform hover:scale-110 cursor-pointer hidden md:block"
            style={{
              fontSize: `${getFontSize(count, false)}rem`,
              color: tag.color,
              fontWeight: 600,
              textShadow: `0 2px 8px ${tag.color}30`,
            }}
            title={`${tag.name}: 出现 ${count} 次 - 点击查看详情`}
            onClick={() => navigate(`/tag-stats?tag=${tag.id}`)}
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
  );
};

export default EmotionTagCloud;

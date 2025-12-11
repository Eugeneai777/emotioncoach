import { useMemo, useState } from "react";
import { THEME_DEFINITIONS } from "./GratitudeThemeBadge";
import { AlertTriangle, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface GratitudeTagDistributionProps {
  themeStats: Record<string, number>;
  onTagClick?: (themeId: string) => void;
  selectedTag?: string | null;
}

// 七种幸福标签的设计理念说明
const TAG_PHILOSOPHY = {
  intro: "基于积极心理学研究，感恩日记将幸福来源归纳为七大维度，帮助你全面觉察生活中的微光：",
  tags: [
    { emoji: "🧠", name: "创造幸福", desc: "工作进展、产品、创意、学习、技能提升 — 创造带来成就感与自我价值" },
    { emoji: "❤️", name: "关系幸福", desc: "伴侣、孩子、父母、朋友、同事 — 人际连接是幸福的核心来源" },
    { emoji: "💰", name: "财富幸福", desc: "收入、投资、折扣、奖金、资源 — 财富安全感支撑生活品质" },
    { emoji: "🩺", name: "健康幸福", desc: "睡眠、运动、医疗、疗愈、养生 — 身心健康是幸福的基石" },
    { emoji: "🌱", name: "内在幸福", desc: "觉察、突破、疗愈、自我接纳 — 内在成长带来深层满足" },
    { emoji: "🎉", name: "体验幸福", desc: "美食、旅行、音乐、电影、庆祝 — 体验丰富生命的色彩" },
    { emoji: "🤝", name: "贡献幸福", desc: "帮助别人、分享、服务、给予 — 利他行为提升意义感" },
  ],
};

export const GratitudeTagDistribution = ({ 
  themeStats, 
  onTagClick, 
  selectedTag 
}: GratitudeTagDistributionProps) => {
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  
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
      <div className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur p-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          🏷️ 标签分布
        </h3>
        
        {/* 七种幸福介绍 */}
        <Collapsible open={showPhilosophy} onOpenChange={setShowPhilosophy}>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors mb-3">
            <span className="text-xs text-primary flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              了解七种幸福
            </span>
            {showPhilosophy ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-900/20 dark:to-cyan-900/20 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{TAG_PHILOSOPHY.intro}</p>
              <div className="space-y-1.5">
                {TAG_PHILOSOPHY.tags.map((tag) => (
                  <div key={tag.name} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0">{tag.emoji}</span>
                    <div>
                      <span className="font-medium text-foreground">{tag.name}</span>
                      <span className="text-muted-foreground ml-1">— {tag.desc.split(" — ")[1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">开始记录感恩，看看你的幸福来源 ✨</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur p-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          🏷️ 标签分布
          <span className="text-xs text-muted-foreground font-normal">点击筛选</span>
        </h3>
        
        {/* 七种幸福介绍 */}
        <Collapsible open={showPhilosophy} onOpenChange={setShowPhilosophy}>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors mb-3">
            <span className="text-xs text-primary flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              了解七种幸福
            </span>
            {showPhilosophy ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-900/20 dark:to-cyan-900/20 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{TAG_PHILOSOPHY.intro}</p>
              <div className="space-y-1.5">
                {TAG_PHILOSOPHY.tags.map((tag) => (
                  <div key={tag.name} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0">{tag.emoji}</span>
                    <div>
                      <span className="font-medium text-foreground">{tag.name}</span>
                      <span className="text-muted-foreground ml-1">— {tag.desc.split(" — ")[1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="space-y-2">
          {sortedThemes.map((theme) => {
            const isSelected = selectedTag === theme.id;
            const needsAttention = theme.percentage > 0 && theme.percentage < 10;
            
            return (
              <Tooltip key={theme.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => theme.count > 0 && onTagClick?.(theme.id)}
                    disabled={theme.count === 0}
                    className={`
                      w-full flex items-center gap-2 p-2 rounded-lg transition-all
                      ${theme.count > 0 ? "cursor-pointer hover:bg-muted/50" : "opacity-40 cursor-not-allowed"}
                      ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}
                    `}
                  >
                    <span className="text-lg shrink-0">{theme.emoji}</span>
                    <span className="text-sm font-medium shrink-0 text-left">{theme.name}</span>
                    
                    <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden min-w-0">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${theme.percentage}%`,
                          backgroundColor: theme.color,
                        }}
                      />
                    </div>
                    
                    <span className="text-xs text-muted-foreground shrink-0">
                      {theme.percentage.toFixed(0)}%
                    </span>
                    <span className="text-xs font-medium shrink-0">
                      {theme.count}
                    </span>
                    
                    {needsAttention && (
                      <span className="text-amber-500 text-xs flex items-center gap-0.5 shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">{theme.description}</p>
                </TooltipContent>
              </Tooltip>
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
    </TooltipProvider>
  );
};

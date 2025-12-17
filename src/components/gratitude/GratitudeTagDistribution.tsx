import { useMemo, useState } from "react";
import { THEME_DEFINITIONS } from "./GratitudeThemeBadge";
import { AlertTriangle, ChevronDown, ChevronUp, HelpCircle, Lightbulb, X } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

// 低占比标签的改善建议
const IMPROVEMENT_SUGGESTIONS: Record<string, { title: string; tips: string[]; action: string }> = {
  creation: {
    title: "提升创造幸福感",
    tips: [
      "记录今天学到的一个新知识或技能",
      "回顾工作中的一个小进展或突破",
      "写下一个让你有成就感的创意想法",
    ],
    action: "试试记录：今天我完成了..."
  },
  relationship: {
    title: "滋养关系幸福感",
    tips: [
      "感谢一位今天帮助过你的人",
      "记录与家人朋友的温馨时刻",
      "回想一次让你感动的陪伴",
    ],
    action: "试试记录：今天XXX让我感到温暖..."
  },
  wealth: {
    title: "觉察财富幸福感",
    tips: [
      "感谢今天花的每一分钱带来的价值",
      "记录一次省钱或赚钱的小确幸",
      "回顾你拥有的资源和保障",
    ],
    action: "试试记录：今天在财务上让我安心的是..."
  },
  health: {
    title: "关注健康幸福感",
    tips: [
      "感谢身体今天为你做的一切",
      "记录一次舒适的睡眠或运动",
      "回顾一个健康的饮食选择",
    ],
    action: "试试记录：今天我的身体感觉..."
  },
  growth: {
    title: "深耕内在幸福感",
    tips: [
      "记录一个自我觉察的时刻",
      "回顾今天的一次情绪调节",
      "写下一个关于自己的新发现",
    ],
    action: "试试记录：今天我对自己有了新的理解..."
  },
  experience: {
    title: "丰富体验幸福感",
    tips: [
      "感谢一顿美味的餐食",
      "记录一首歌、一部电影带来的愉悦",
      "回想一个让你开心的小惊喜",
    ],
    action: "试试记录：今天我享受了..."
  },
  contribution: {
    title: "增添贡献幸福感",
    tips: [
      "记录一次帮助他人的经历",
      "回顾分享知识或资源的时刻",
      "感谢自己为他人带来的价值",
    ],
    action: "试试记录：今天我帮助了..."
  },
};

export const GratitudeTagDistribution = ({ 
  themeStats, 
  onTagClick, 
  selectedTag 
}: GratitudeTagDistributionProps) => {
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  
  const { sortedThemes, total, maxPercentage } = useMemo(() => {
    const total = Object.values(themeStats).reduce((sum, v) => sum + v, 0);
    
    const themes = THEME_DEFINITIONS.map(theme => ({
      ...theme,
      count: themeStats[theme.id] || 0,
      percentage: total > 0 ? ((themeStats[theme.id] || 0) / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
    
    // 获取最大百分比用于相对缩放
    const maxPercentage = themes.length > 0 ? themes[0].percentage : 0;
    
    return { sortedThemes: themes, total, maxPercentage };
  }, [themeStats]);

  if (total === 0) {
    return (
      <div className="rounded-lg bg-white/60 dark:bg-gray-800/40 backdrop-blur p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium flex items-center gap-1.5">
            🏷️ 标签分布
          </h3>
          <Collapsible open={showPhilosophy} onOpenChange={setShowPhilosophy}>
            <CollapsibleTrigger className="flex items-center gap-1 py-0.5 px-1.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors">
              <HelpCircle className="w-2.5 h-2.5 text-primary" />
              <span className="text-[10px] text-primary">七种幸福</span>
              {showPhilosophy ? <ChevronUp className="w-2.5 h-2.5 text-primary" /> : <ChevronDown className="w-2.5 h-2.5 text-primary" />}
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        
        <Collapsible open={showPhilosophy} onOpenChange={setShowPhilosophy}>
          <CollapsibleContent className="mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-900/20 dark:to-rose-900/20 space-y-1">
              <p className="text-[10px] text-muted-foreground leading-relaxed">{TAG_PHILOSOPHY.intro}</p>
              <div className="space-y-0.5">
                {TAG_PHILOSOPHY.tags.map((tag) => (
                  <div key={tag.name} className="flex items-start gap-1.5 text-[10px]">
                    <span className="shrink-0">{tag.emoji}</span>
                    <div>
                      <span className="font-medium text-foreground">{tag.name.replace("幸福", "")}</span>
                      <span className="text-muted-foreground ml-0.5">— {tag.desc.split(" — ")[1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-xs">开始记录感恩，看看你的幸福来源 ✨</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg bg-white/60 dark:bg-gray-800/40 backdrop-blur p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium flex items-center gap-1.5">
            🏷️ 标签分布
            <span className="text-[10px] text-muted-foreground font-normal">点击筛选</span>
          </h3>
          <Collapsible open={showPhilosophy} onOpenChange={setShowPhilosophy}>
            <CollapsibleTrigger className="flex items-center gap-1 py-0.5 px-1.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors">
              <HelpCircle className="w-2.5 h-2.5 text-primary" />
              <span className="text-[10px] text-primary">七种幸福</span>
              {showPhilosophy ? <ChevronUp className="w-2.5 h-2.5 text-primary" /> : <ChevronDown className="w-2.5 h-2.5 text-primary" />}
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        
        <Collapsible open={showPhilosophy} onOpenChange={setShowPhilosophy}>
          <CollapsibleContent className="mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-900/20 dark:to-rose-900/20 space-y-1">
              <p className="text-[10px] text-muted-foreground leading-relaxed">{TAG_PHILOSOPHY.intro}</p>
              <div className="space-y-0.5">
                {TAG_PHILOSOPHY.tags.map((tag) => (
                  <div key={tag.name} className="flex items-start gap-1.5 text-[10px]">
                    <span className="shrink-0">{tag.emoji}</span>
                    <div>
                      <span className="font-medium text-foreground">{tag.name.replace("幸福", "")}</span>
                      <span className="text-muted-foreground ml-0.5">— {tag.desc.split(" — ")[1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="space-y-1">
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
                      w-full flex items-center gap-1.5 py-1 px-2 rounded-md transition-all
                      ${theme.count > 0 ? "cursor-pointer hover:bg-muted/50" : "opacity-40 cursor-not-allowed"}
                      ${isSelected ? "ring-1 ring-primary bg-primary/5" : ""}
                    `}
                  >
                    <span className="text-base shrink-0">{theme.emoji}</span>
                    <span className="text-xs font-medium shrink-0 text-left w-8">{theme.name.replace("幸福", "")}</span>
                    
                    <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden min-w-0">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          // 相对缩放：最大值占100%，其他按比例显示
                          width: maxPercentage > 0 
                            ? `${Math.max((theme.percentage / maxPercentage) * 100, theme.count > 0 ? 8 : 0)}%`
                            : '0%',
                          backgroundColor: theme.color,
                        }}
                      />
                    </div>
                    
                    <span className="text-[10px] text-muted-foreground shrink-0 w-6 text-right">
                      {theme.percentage.toFixed(0)}%
                    </span>
                    <span className="text-[10px] font-medium shrink-0 w-4 text-right">
                      {theme.count}
                    </span>
                    
                    {needsAttention && (
                      <Popover>
                        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          side="left" 
                          align="start"
                          className="w-56 p-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-xs font-medium">
                                {IMPROVEMENT_SUGGESTIONS[theme.id]?.title || "改善建议"}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              这个维度占比较低，试试这些方法来丰富你的幸福来源：
                            </p>
                            <ul className="space-y-1">
                              {IMPROVEMENT_SUGGESTIONS[theme.id]?.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[10px]">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="pt-1.5 border-t border-border/50">
                              <p className="text-[10px] text-primary font-medium">
                                💡 {IMPROVEMENT_SUGGESTIONS[theme.id]?.action}
                              </p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
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
        
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>共{total}条</span>
          {selectedTag && (
            <button 
              onClick={() => onTagClick?.(selectedTag)}
              className="text-primary hover:underline"
            >
              清除
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

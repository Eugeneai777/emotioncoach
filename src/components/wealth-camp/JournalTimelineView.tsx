import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  ChevronRight, 
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JournalEntryDetailDialog } from './JournalEntryDetailDialog';

interface JournalEntry {
  id?: string;
  day_number: number;
  behavior_score: number | null;
  emotion_score: number | null;
  belief_score: number | null;
  behavior_block?: string | null;
  emotion_need?: string | null;
  new_belief?: string | null;
  giving_action?: string | null;
  personal_awakening?: {
    behavior_awakening?: string;
    emotion_awakening?: string;
    belief_awakening?: string;
  } | null;
  created_at: string;
}

type DimensionFilter = 'all' | 'behavior' | 'emotion' | 'belief';

// Emotion tags extracted from entries
const EMOTION_TAGS = [
  { key: 'anxiety', label: '焦虑', emoji: '😰', keywords: ['焦虑', '担心', '紧张', '害怕', '恐惧'] },
  { key: 'joy', label: '喜悦', emoji: '😊', keywords: ['开心', '喜悦', '快乐', '满足', '幸福'] },
  { key: 'sadness', label: '低落', emoji: '😔', keywords: ['低落', '难过', '悲伤', '失望', '沮丧'] },
  { key: 'anger', label: '愤怒', emoji: '😤', keywords: ['愤怒', '生气', '烦躁', '不满', '恼火'] },
  { key: 'confusion', label: '迷茫', emoji: '😕', keywords: ['迷茫', '困惑', '纠结', '犹豫', '矛盾'] },
  { key: 'calm', label: '平静', emoji: '😌', keywords: ['平静', '放松', '安心', '释然', '淡定'] },
];

interface BaselineData {
  behavior_score?: number;
  emotion_score?: number;
  belief_score?: number;
  awakeningStart?: number;
}

interface JournalTimelineViewProps {
  entries: JournalEntry[];
  baseline?: BaselineData | null;
  className?: string;
}

// Mini trend curve component - now shows vs Day 0 baseline
function MiniTrendCurve({ entries, baseline }: { entries: JournalEntry[]; baseline?: BaselineData | null }) {
  // Get last 7 entries sorted by day_number ascending
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => a.day_number - b.day_number)
      .slice(-7);
  }, [entries]);

  if (recentEntries.length < 2) return null;

  // Calculate awakening index for each entry
  const dataPoints = recentEntries.map(entry => {
    const scores = [entry.behavior_score, entry.emotion_score, entry.belief_score]
      .filter(s => s && s > 0) as number[];
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return Math.round(((avg - 1) / 4) * 100);
  });

  const maxVal = Math.max(...dataPoints, 100);
  const minVal = Math.min(...dataPoints, 0);
  const range = maxVal - minVal || 1;

  // Calculate SVG path
  const width = 100;
  const height = 32;
  const padding = 4;
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  const points = dataPoints.map((val, i) => ({
    x: padding + (i / (dataPoints.length - 1)) * effectiveWidth,
    y: padding + effectiveHeight - ((val - minVal) / range) * effectiveHeight,
  }));

  const pathD = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    
    // Smooth curve using quadratic bezier
    const prev = points[i - 1];
    const midX = (prev.x + point.x) / 2;
    return `${path} Q ${midX} ${prev.y} ${midX} ${(prev.y + point.y) / 2} T ${point.x} ${point.y}`;
  }, '');

  // Calculate trend vs Day 0 baseline
  const latestAwakening = dataPoints[dataPoints.length - 1];
  const baselineAwakening = baseline?.awakeningStart ?? dataPoints[0];
  const vsBaseline = latestAwakening - baselineAwakening;
  const trendUp = vsBaseline > 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg">
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-1">近{recentEntries.length}日成长趋势</div>
        <svg width={width} height={height} className="overflow-visible">
          {/* Gradient fill under curve */}
          <defs>
            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trendUp ? 'rgb(16, 185, 129)' : 'rgb(249, 115, 22)'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={trendUp ? 'rgb(16, 185, 129)' : 'rgb(249, 115, 22)'} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
            fill="url(#trendGradient)"
          />
          
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={trendUp ? 'rgb(16, 185, 129)' : 'rgb(249, 115, 22)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* End point dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            fill={trendUp ? 'rgb(16, 185, 129)' : 'rgb(249, 115, 22)'}
          />
        </svg>
      </div>
      
      {/* Trend indicator - now shows vs Day 0 */}
      <div className="text-right">
        <div className={cn(
          "text-lg font-bold tabular-nums",
          trendUp ? "text-emerald-600" : vsBaseline === 0 ? "text-slate-600" : "text-orange-600"
        )}>
          {vsBaseline > 0 ? '+' : ''}{vsBaseline}
        </div>
        <div className="text-[10px] text-muted-foreground">
          vs Day 0 起点
        </div>
      </div>
    </div>
  );
}

export function JournalTimelineView({ entries, baseline, className }: JournalTimelineViewProps) {
  const [filter, setFilter] = useState<DimensionFilter>('all');
  const [emotionTag, setEmotionTag] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Sort entries by day_number descending (newest first)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.day_number - a.day_number);
  }, [entries]);

  // Detect emotion tags present in entries
  const presentEmotionTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    
    entries.forEach(entry => {
      const allText = [
        entry.emotion_need,
        entry.personal_awakening?.emotion_awakening,
        entry.behavior_block,
        entry.new_belief,
      ].filter(Boolean).join(' ');
      
      EMOTION_TAGS.forEach(tag => {
        if (tag.keywords.some(keyword => allText.includes(keyword))) {
          tagCounts.set(tag.key, (tagCounts.get(tag.key) || 0) + 1);
        }
      });
    });
    
    return EMOTION_TAGS
      .filter(tag => tagCounts.has(tag.key))
      .map(tag => ({ ...tag, count: tagCounts.get(tag.key) || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  // Filter entries based on dimension and emotion tag
  const filteredEntries = useMemo(() => {
    let result = sortedEntries;
    
    // Dimension filter
    if (filter !== 'all') {
      result = result.filter(entry => {
        switch (filter) {
          case 'behavior':
            return (entry.behavior_score && entry.behavior_score > 0) || 
                   entry.behavior_block || 
                   entry.personal_awakening?.behavior_awakening;
          case 'emotion':
            return (entry.emotion_score && entry.emotion_score > 0) || 
                   entry.emotion_need || 
                   entry.personal_awakening?.emotion_awakening;
          case 'belief':
            return (entry.belief_score && entry.belief_score > 0) || 
                   entry.new_belief || 
                   entry.personal_awakening?.belief_awakening;
          default:
            return true;
        }
      });
    }
    
    // Emotion tag filter
    if (emotionTag) {
      const tagConfig = EMOTION_TAGS.find(t => t.key === emotionTag);
      if (tagConfig) {
        result = result.filter(entry => {
          const allText = [
            entry.emotion_need,
            entry.personal_awakening?.emotion_awakening,
            entry.behavior_block,
            entry.new_belief,
          ].filter(Boolean).join(' ');
          return tagConfig.keywords.some(keyword => allText.includes(keyword));
        });
      }
    }
    
    return result;
  }, [sortedEntries, filter, emotionTag]);

  const getScoreColor = (score: number | null) => {
    if (!score || score === 0) return 'text-muted-foreground';
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-orange-600';
  };

  const getScoreTrend = (entry: JournalEntry, prevEntry?: JournalEntry) => {
    if (!prevEntry) return null;
    
    const getAvg = (e: JournalEntry) => {
      const scores = [e.behavior_score, e.emotion_score, e.belief_score].filter(s => s && s > 0) as number[];
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    };
    
    const currentAvg = getAvg(entry);
    const prevAvg = getAvg(prevEntry);
    const diff = currentAvg - prevAvg;
    
    if (diff > 0.3) return { icon: TrendingUp, color: 'text-emerald-500', label: '上升' };
    if (diff < -0.3) return { icon: TrendingDown, color: 'text-red-500', label: '下降' };
    return { icon: Minus, color: 'text-muted-foreground', label: '持平' };
  };

  // Get highlight content based on filter
  const getHighlightContent = (entry: JournalEntry, currentFilter: DimensionFilter): string | null => {
    if (currentFilter === 'behavior') {
      return entry.behavior_block || entry.personal_awakening?.behavior_awakening || null;
    }
    if (currentFilter === 'emotion') {
      return entry.emotion_need || entry.personal_awakening?.emotion_awakening || null;
    }
    if (currentFilter === 'belief') {
      return entry.new_belief || entry.personal_awakening?.belief_awakening || null;
    }
    // Default priority for 'all'
    if (entry.new_belief) return entry.new_belief;
    if (entry.personal_awakening?.belief_awakening) return entry.personal_awakening.belief_awakening;
    if (entry.personal_awakening?.emotion_awakening) return entry.personal_awakening.emotion_awakening;
    if (entry.personal_awakening?.behavior_awakening) return entry.personal_awakening.behavior_awakening;
    return null;
  };

  // Get highlight styles based on filter
  const getHighlightStyles = (currentFilter: DimensionFilter): string => {
    switch (currentFilter) {
      case 'behavior':
        return 'bg-amber-50 border-l-2 border-amber-400';
      case 'emotion':
        return 'bg-pink-50 border-l-2 border-pink-400';
      case 'belief':
        return 'bg-violet-50 border-l-2 border-violet-400';
      default:
        return '';
    }
  };

  const getAwakeningIndex = (entry: JournalEntry): number => {
    const scores = [entry.behavior_score, entry.emotion_score, entry.belief_score].filter(s => s && s > 0) as number[];
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(((avg - 1) / 4) * 100);
  };

  // Detect emotion tags in a single entry
  const getEntryEmotionTags = (entry: JournalEntry) => {
    const allText = [
      entry.emotion_need,
      entry.personal_awakening?.emotion_awakening,
    ].filter(Boolean).join(' ');
    
    return EMOTION_TAGS.filter(tag => 
      tag.keywords.some(keyword => allText.includes(keyword))
    ).slice(0, 2); // Max 2 tags per entry
  };

  const handleEntryClick = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setDetailOpen(true);
  };

  if (entries.length === 0) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">暂无觉醒记录</p>
          <p className="text-xs text-muted-foreground/70 mt-1">完成教练对话后这里将显示你的成长轨迹</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              觉醒时间轴
              <Badge variant="secondary" className="text-xs">{entries.length}天</Badge>
            </CardTitle>
          </div>
          
          {/* Mini Trend Curve */}
          <MiniTrendCurve entries={entries} baseline={baseline} />
          
          {/* Dimension Filter */}
          <div className="pt-3">
            <ToggleGroup 
              type="single" 
              value={filter} 
              onValueChange={(v) => v && setFilter(v as DimensionFilter)}
              className="w-full justify-start"
            >
              <ToggleGroupItem 
                value="all" 
                className="text-xs flex-1 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-700"
              >
                <Filter className="w-3 h-3 mr-1" />
                全部
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="behavior" 
                className="text-xs flex-1 data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700"
              >
                🎯 行为
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="emotion" 
                className="text-xs flex-1 data-[state=on]:bg-pink-100 data-[state=on]:text-pink-700"
              >
                💗 情绪
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="belief" 
                className="text-xs flex-1 data-[state=on]:bg-violet-100 data-[state=on]:text-violet-700"
              >
                💡 信念
              </ToggleGroupItem>
            </ToggleGroup>
            {/* Filter count badge */}
            {filter !== 'all' && (
              <Badge variant="outline" className="ml-2 text-xs">
                {filteredEntries.length}/{entries.length}
              </Badge>
            )}
          </div>
          
          {/* Emotion Tag Filter */}
          {presentEmotionTags.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">情绪标签筛选</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setEmotionTag(null)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs transition-colors",
                    emotionTag === null 
                      ? "bg-slate-200 text-slate-700" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  全部
                </button>
                {presentEmotionTags.map(tag => (
                  <button
                    key={tag.key}
                    onClick={() => setEmotionTag(emotionTag === tag.key ? null : tag.key)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs transition-colors flex items-center gap-1",
                      emotionTag === tag.key 
                        ? "bg-pink-100 text-pink-700" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                    <span className="text-[10px] opacity-60">({tag.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-2 pb-3">
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-1 pl-2">
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry, index) => {
                  const prevEntry = sortedEntries.find(e => e.day_number === entry.day_number - 1);
                  const trend = getScoreTrend(entry, prevEntry);
                  const highlight = getHighlightContent(entry, filter);
                  const highlightStyles = getHighlightStyles(filter);
                  const awakeningIndex = getAwakeningIndex(entry);
                  const entryTags = getEntryEmotionTags(entry);
                  
                  return (
                    <motion.div
                      key={entry.day_number}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => handleEntryClick(entry)}
                        className="w-full text-left"
                      >
                        <div className={cn(
                          "relative pl-6 pr-3 py-3 rounded-lg transition-all",
                          "hover:bg-muted/50 active:bg-muted",
                          "border border-transparent hover:border-border"
                        )}>
                          {/* Timeline dot and line */}
                          <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col items-center">
                            <div className={cn(
                              "w-3 h-3 rounded-full mt-4 z-10",
                              awakeningIndex >= 60 ? "bg-emerald-500" :
                              awakeningIndex >= 40 ? "bg-amber-500" :
                              "bg-orange-400"
                            )} />
                            {index < filteredEntries.length - 1 && (
                              <div className="flex-1 w-0.5 bg-border mt-1" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Header: Day + Date + Trend + Emotion Tags */}
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-sm">Day {entry.day_number}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(entry.created_at), 'M/d', { locale: zhCN })}
                                </span>
                                {trend && (
                                  <trend.icon className={cn("w-3 h-3", trend.color)} />
                                )}
                                {/* Entry emotion tags */}
                                {entryTags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {entryTags.map(tag => (
                                      <span 
                                        key={tag.key} 
                                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600"
                                      >
                                        {tag.emoji} {tag.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Scores */}
                              <div className="flex items-center gap-3 text-xs mb-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">觉醒</span>
                                  <span className={cn(
                                    "font-medium",
                                    awakeningIndex >= 60 ? "text-emerald-600" :
                                    awakeningIndex >= 40 ? "text-amber-600" :
                                    "text-orange-600"
                                  )}>
                                    {awakeningIndex}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <div className={cn("w-1.5 h-1.5 rounded-full bg-amber-500")} />
                                  <span className={getScoreColor(entry.behavior_score)}>
                                    {entry.behavior_score?.toFixed(1) || '-'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <div className={cn("w-1.5 h-1.5 rounded-full bg-pink-500")} />
                                  <span className={getScoreColor(entry.emotion_score)}>
                                    {entry.emotion_score?.toFixed(1) || '-'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <div className={cn("w-1.5 h-1.5 rounded-full bg-violet-500")} />
                                  <span className={getScoreColor(entry.belief_score)}>
                                    {entry.belief_score?.toFixed(1) || '-'}
                                  </span>
                                </div>
                              </div>

                              {/* Highlight content preview - enhanced for dimension filter */}
                              {highlight && (
                                <div className={cn(
                                  "flex items-start gap-1.5 rounded-md p-1.5 -mx-1.5",
                                  highlightStyles
                                )}>
                                  <Sparkles className={cn(
                                    "w-3 h-3 mt-0.5 shrink-0",
                                    filter === 'behavior' ? "text-amber-500" :
                                    filter === 'emotion' ? "text-pink-500" :
                                    filter === 'belief' ? "text-violet-500" :
                                    "text-amber-500"
                                  )} />
                                  <p className={cn(
                                    "text-xs line-clamp-2",
                                    filter !== 'all' ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {highlight}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Arrow */}
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 mt-1 shrink-0" />
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>该筛选条件下暂无记录</p>
                  <button 
                    onClick={() => { setFilter('all'); setEmotionTag(null); }}
                    className="text-xs text-amber-600 mt-2 hover:underline"
                  >
                    清除筛选
                  </button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <JournalEntryDetailDialog
        entry={selectedEntry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

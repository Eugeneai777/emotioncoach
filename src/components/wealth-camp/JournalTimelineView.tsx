import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  ChevronRight, 
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Sparkles
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

interface JournalTimelineViewProps {
  entries: JournalEntry[];
  className?: string;
}

export function JournalTimelineView({ entries, className }: JournalTimelineViewProps) {
  const [filter, setFilter] = useState<DimensionFilter>('all');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Sort entries by day_number descending (newest first)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.day_number - a.day_number);
  }, [entries]);

  // Filter entries based on dimension with significant content
  const filteredEntries = useMemo(() => {
    if (filter === 'all') return sortedEntries;
    
    return sortedEntries.filter(entry => {
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
  }, [sortedEntries, filter]);

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

  const getHighlightContent = (entry: JournalEntry): string | null => {
    // Priority: new_belief > belief_awakening > emotion_awakening > behavior_awakening
    if (entry.new_belief) return entry.new_belief;
    if (entry.personal_awakening?.belief_awakening) return entry.personal_awakening.belief_awakening;
    if (entry.personal_awakening?.emotion_awakening) return entry.personal_awakening.emotion_awakening;
    if (entry.personal_awakening?.behavior_awakening) return entry.personal_awakening.behavior_awakening;
    return null;
  };

  const getAwakeningIndex = (entry: JournalEntry): number => {
    const scores = [entry.behavior_score, entry.emotion_score, entry.belief_score].filter(s => s && s > 0) as number[];
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(((avg - 1) / 4) * 100);
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
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              觉醒时间轴
              <Badge variant="secondary" className="text-xs">{entries.length}天</Badge>
            </CardTitle>
          </div>
          
          {/* Dimension Filter */}
          <div className="pt-2">
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
          </div>
        </CardHeader>

        <CardContent className="px-2 pb-3">
          <ScrollArea className="h-[360px] pr-2">
            <div className="space-y-1 pl-2">
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry, index) => {
                  const prevEntry = sortedEntries.find(e => e.day_number === entry.day_number - 1);
                  const trend = getScoreTrend(entry, prevEntry);
                  const highlight = getHighlightContent(entry);
                  const awakeningIndex = getAwakeningIndex(entry);
                  
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
                              {/* Header: Day + Date + Trend */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">Day {entry.day_number}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(entry.created_at), 'M/d', { locale: zhCN })}
                                </span>
                                {trend && (
                                  <trend.icon className={cn("w-3 h-3", trend.color)} />
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

                              {/* Highlight content preview */}
                              {highlight && (
                                <div className="flex items-start gap-1.5">
                                  <Sparkles className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                  <p className="text-xs text-muted-foreground line-clamp-2">
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
                  <p>该维度暂无记录</p>
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

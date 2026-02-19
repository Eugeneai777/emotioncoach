import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, ChevronRight, Target, Heart, Brain, Zap, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { JournalEntry } from '@/hooks/useWealthJournalEntries';

interface AwakeningMoment {
  id: string;
  dayNumber: number;
  date: string;
  layer: 'behavior' | 'emotion' | 'belief' | 'action';
  type: string;
  content: string;
  subContent?: string;
}

interface LayerConfig {
  key: 'behavior' | 'emotion' | 'belief' | 'action';
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
}

const layerConfigs: LayerConfig[] = [
  {
    key: 'behavior',
    label: '行为觉醒',
    icon: <Target className="w-3.5 h-3.5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  },
  {
    key: 'emotion',
    label: '情绪觉醒',
    icon: <Heart className="w-3.5 h-3.5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    borderColor: 'border-pink-200 dark:border-pink-800',
    badgeBg: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300',
  },
  {
    key: 'belief',
    label: '信念觉醒',
    icon: <Brain className="w-3.5 h-3.5" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
  },
  {
    key: 'action',
    label: '行动转化',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
  },
];

const behaviorTypeNames: Record<string, string> = {
  mouth: '嘴穷', hand: '手穷', eye: '眼穷', heart: '心穷',
};
const emotionTypeNames: Record<string, string> = {
  anxiety: '金钱焦虑', scarcity: '匮乏恐惧', comparison: '比较自卑', shame: '羞耻厌恶', guilt: '消费内疚',
};
const beliefTypeNames: Record<string, string> = {
  lack: '匮乏感', linear: '线性思维', stigma: '金钱污名', unworthy: '不配得感', relationship: '关系恐惧',
};

interface AwakeningMomentsCardProps {
  entries: JournalEntry[];
  campId?: string;
}

export function AwakeningMomentsCard({ entries }: AwakeningMomentsCardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse awakening moments from entries (same logic as WealthAwakeningArchive)
  const awakeningMoments = useMemo<AwakeningMoment[]>(() => {
    if (!entries) return [];
    const moments: AwakeningMoment[] = [];

    entries.forEach(entry => {
      const date = format(new Date(entry.created_at), 'M月d日', { locale: zhCN });
      const personalAwakening = entry.personal_awakening as Record<string, string> | null;
      const responsibilityItems = entry.responsibility_items as string[] | null;

      if (entry.behavior_type || (responsibilityItems && responsibilityItems.length > 0)) {
        moments.push({
          id: `${entry.id}-behavior`,
          dayNumber: entry.day_number,
          date,
          layer: 'behavior',
          type: behaviorTypeNames[entry.behavior_type as string] || (entry.behavior_type as string) || '行为觉察',
          content: (personalAwakening?.behavior) ||
            (responsibilityItems && responsibilityItems.length > 0
              ? `发现可负责事项：${responsibilityItems[0]}`
              : `识别到${behaviorTypeNames[entry.behavior_type as string] || '行为'}模式`),
          subContent: responsibilityItems?.join('、'),
        });
      }

      if (entry.emotion_type || entry.emotion_need) {
        moments.push({
          id: `${entry.id}-emotion`,
          dayNumber: entry.day_number,
          date,
          layer: 'emotion',
          type: emotionTypeNames[entry.emotion_type as string] || (entry.emotion_type as string) || '情绪觉察',
          content: (personalAwakening?.emotion) ||
            (entry.emotion_need ? `内心需要：${entry.emotion_need}` : `感受到${emotionTypeNames[entry.emotion_type as string] || '情绪'}信号`),
          subContent: entry.emotion_need as string | undefined,
        });
      }

      if (entry.belief_type || entry.new_belief) {
        moments.push({
          id: `${entry.id}-belief`,
          dayNumber: entry.day_number,
          date,
          layer: 'belief',
          type: beliefTypeNames[entry.belief_type as string] || (entry.belief_type as string) || '信念转化',
          content: (personalAwakening?.belief) ||
            (entry.new_belief ? `新信念：${entry.new_belief}` : `松动了${beliefTypeNames[entry.belief_type as string] || '旧'}信念`),
          subContent: entry.old_belief ? `旧信念：${entry.old_belief}` : undefined,
        });
      }

      if (entry.giving_action || entry.smallest_progress) {
        moments.push({
          id: `${entry.id}-action`,
          dayNumber: entry.day_number,
          date,
          layer: 'action',
          type: entry.giving_action ? '给予行动' : '最小进步',
          content: (entry.giving_action as string) || (entry.smallest_progress as string) || '',
          subContent: entry.action_reflection as string | undefined,
        });
      }
    });

    return moments;
  }, [entries]);

  // Filter by active tab
  const filteredMoments = useMemo(() => {
    if (activeTab === 'all') return awakeningMoments;
    return awakeningMoments.filter(m => m.layer === activeTab);
  }, [awakeningMoments, activeTab]);

  // Group by day (descending)
  const groupedByDay = useMemo(() => {
    const groups: Record<number, AwakeningMoment[]> = {};
    filteredMoments.forEach(m => {
      if (!groups[m.dayNumber]) groups[m.dayNumber] = [];
      groups[m.dayNumber].push(m);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([day, moments]) => ({ day: Number(day), moments }));
  }, [filteredMoments]);

  // Default: show only the most recent 3 days
  const visibleGroups = isExpanded ? groupedByDay : groupedByDay.slice(0, 3);
  const hasMore = groupedByDay.length > 3;

  if (awakeningMoments.length === 0) return null;

  return (
    <Card className="shadow-sm overflow-hidden">
      {/* Header */}
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">觉醒档案</span>
            <span className="text-xs text-muted-foreground ml-1">共 {awakeningMoments.length} 个时刻</span>
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setIsExpanded(prev => !prev)}
            >
              {isExpanded ? (
                <><ChevronUp className="w-3.5 h-3.5 mr-1" />收起</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5 mr-1" />展开全部</>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2 space-y-3">
        {/* Tab Filter */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-8">
            <TabsTrigger value="all" className="flex-1 text-xs h-6">全部</TabsTrigger>
            {layerConfigs.map(config => (
              <TabsTrigger key={config.key} value={config.key} className="flex-1 text-xs h-6">
                {config.label.slice(0, 2)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Timeline */}
        {visibleGroups.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">暂无此类觉醒记录</p>
        ) : (
          <div className="space-y-4">
            {visibleGroups.map(({ day, moments }) => (
              <div key={day}>
                {/* Day label */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <Calendar className="w-3 h-3 text-amber-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">第 {day} 天</span>
                    <span className="text-xs text-muted-foreground">{moments[0]?.date}</span>
                  </div>
                </div>

                {/* Moment cards */}
                <div className="ml-3 pl-4 border-l-2 border-amber-200 dark:border-amber-800 space-y-2">
                  {moments.map(moment => {
                    const config = layerConfigs.find(c => c.key === moment.layer)!;
                    return (
                      <div
                        key={moment.id}
                        className={`rounded-lg border p-2.5 ${config.bgColor} ${config.borderColor}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${config.color} ${config.bgColor}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                              {moment.type && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${config.badgeBg}`}>
                                  {moment.type}
                                </span>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed">{moment.content}</p>
                            {moment.subContent && (
                              <p className="text-xs text-muted-foreground mt-0.5">{moment.subContent}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer link */}
        <div className="flex justify-center pt-1 border-t border-border/50">
          <Button
            variant="link"
            size="sm"
            className="text-xs text-amber-600 h-7"
            onClick={() => navigate('/wealth-awakening-archive')}
          >
            查看完整觉醒档案
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

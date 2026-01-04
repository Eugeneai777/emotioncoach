import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronRight, Star, Tent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 卡点类型映射
const behaviorTypeInfo: Record<string, { name: string; color: string }> = {
  mouth: { name: '嘴穷', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  hand: { name: '手穷', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
  eye: { name: '眼穷', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
  heart: { name: '心穷', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' },
};

const emotionTypeInfo: Record<string, { name: string; color: string }> = {
  anxiety: { name: '金钱焦虑', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' },
  scarcity: { name: '匮乏恐惧', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  comparison: { name: '比较自卑', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300' },
  shame: { name: '羞耻厌恶', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  guilt: { name: '消费内疚', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' },
};

const beliefTypeInfo: Record<string, { name: string; color: string }> = {
  lack: { name: '匮乏感', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  linear: { name: '线性思维', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
  stigma: { name: '金钱污名', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  unworthy: { name: '不配得感', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  relationship: { name: '关系恐惧', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
};

interface WealthJournalEntry {
  id: string;
  day_number: number;
  behavior_block?: string;
  emotion_block?: string;
  belief_block?: string;
  smallest_progress?: string;
  behavior_score?: number;
  emotion_score?: number;
  belief_score?: number;
  behavior_type?: string;
  emotion_type?: string;
  belief_type?: string;
  action_suggestion?: string;
  camp_id?: string | null;
  created_at: string;
}

interface WealthJournalCardProps {
  entry: WealthJournalEntry;
  onClick?: () => void;
}

function ScoreStars({ score }: { score?: number }) {
  if (!score) return <span className="text-muted-foreground text-xs">--</span>;
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3",
            i <= score ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function WealthJournalCard({ entry, onClick }: WealthJournalCardProps) {
  const avgScore = entry.behavior_score && entry.emotion_score && entry.belief_score
    ? ((entry.behavior_score + entry.emotion_score + entry.belief_score) / 3).toFixed(1)
    : null;

  const hasCamp = !!entry.camp_id;
  const hasBlockTypes = entry.behavior_type || entry.emotion_type || entry.belief_type;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        "bg-gradient-to-br from-amber-50/50 to-yellow-50/50",
        "dark:from-amber-950/20 dark:to-yellow-950/20",
        "border-amber-100 dark:border-amber-900"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-lg">📖</span>
              <span className="font-medium text-amber-800 dark:text-amber-200">
                Day {entry.day_number}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.created_at), 'M月d日', { locale: zhCN })}
              </span>
              {hasCamp && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <Tent className="w-3 h-3 mr-1" />
                  训练营
                </Badge>
              )}
            </div>

            {/* Block Type Badges */}
            {hasBlockTypes && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {entry.behavior_type && behaviorTypeInfo[entry.behavior_type] && (
                  <Badge variant="outline" className={cn("text-xs", behaviorTypeInfo[entry.behavior_type].color)}>
                    🎯 {behaviorTypeInfo[entry.behavior_type].name}
                  </Badge>
                )}
                {entry.emotion_type && emotionTypeInfo[entry.emotion_type] && (
                  <Badge variant="outline" className={cn("text-xs", emotionTypeInfo[entry.emotion_type].color)}>
                    💛 {emotionTypeInfo[entry.emotion_type].name}
                  </Badge>
                )}
                {entry.belief_type && beliefTypeInfo[entry.belief_type] && (
                  <Badge variant="outline" className={cn("text-xs", beliefTypeInfo[entry.belief_type].color)}>
                    💡 {beliefTypeInfo[entry.belief_type].name}
                  </Badge>
                )}
              </div>
            )}

            {/* Content Preview */}
            <div className="space-y-1 mb-3">
              {entry.belief_block && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  🧠 {entry.belief_block}
                </p>
              )}
              {entry.smallest_progress && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  🌱 {entry.smallest_progress}
                </p>
              )}
            </div>

            {/* Scores */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">行为</span>
                <ScoreStars score={entry.behavior_score} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">情绪</span>
                <ScoreStars score={entry.emotion_score} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">信念</span>
                <ScoreStars score={entry.belief_score} />
              </div>
            </div>
          </div>

          {/* Average Score & Arrow */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {avgScore && (
              <div className="text-center">
                <div className="text-xl font-bold text-amber-600">{avgScore}</div>
                <div className="text-xs text-muted-foreground">综合</div>
              </div>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

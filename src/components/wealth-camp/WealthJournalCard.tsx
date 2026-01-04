import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronRight, Star, Tent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
          <div className="flex-1">
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
          <div className="flex items-center gap-2">
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

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { wealthLayerColors } from "@/config/wealthStyleConfig";
import { JournalEntry } from "@/hooks/useWealthJournalEntries";
import { ChevronRight } from "lucide-react";

interface TodayAwakeningSnapshotProps {
  entry: JournalEntry;
  onClick?: () => void;
}

interface MiniLayerCardProps {
  emoji: string;
  label: string;
  content?: string;
  score?: number;
  colorKey: keyof typeof wealthLayerColors;
  awakening?: string;
}

function MiniLayerCard({ emoji, label, content, score, colorKey, awakening }: MiniLayerCardProps) {
  const colors = wealthLayerColors[colorKey];
  
  return (
    <div className={cn(
      "rounded-lg p-2.5 border transition-all",
      colors.bg, colors.bgDark, colors.border
    )}>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm">{emoji}</span>
        <span className={cn("text-xs font-medium", colors.text)}>{label}</span>
        {score !== undefined && (
          <span className={cn("ml-auto text-xs font-bold", colors.text)}>{score}</span>
        )}
      </div>
      {(content || awakening) && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {awakening || content}
        </p>
      )}
    </div>
  );
}

export function TodayAwakeningSnapshot({ entry, onClick }: TodayAwakeningSnapshotProps) {
  // Calculate average score
  const avgScore = entry.behavior_score && entry.emotion_score && entry.belief_score
    ? ((entry.behavior_score + entry.emotion_score + entry.belief_score) / 3).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card 
        className={cn(
          "shadow-sm cursor-pointer transition-all hover:shadow-md",
          "bg-gradient-to-br from-amber-50/80 to-orange-50/50",
          "dark:from-amber-950/30 dark:to-orange-950/20",
          "border-amber-200/60 dark:border-amber-800/40"
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="font-medium text-sm">今日觉醒 · Day {entry.day_number}</span>
            </div>
            <div className="flex items-center gap-1">
              {avgScore && (
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{avgScore}</span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Three Layer Cards */}
          <div className="grid grid-cols-3 gap-2">
            <MiniLayerCard
              emoji={wealthLayerColors.behavior.emoji}
              label={wealthLayerColors.behavior.label}
              colorKey="behavior"
              content={entry.behavior_type ? `${entry.behavior_type}` : undefined}
              awakening={(entry as any).behavior_awakening}
              score={entry.behavior_score}
            />
            <MiniLayerCard
              emoji={wealthLayerColors.emotion.emoji}
              label={wealthLayerColors.emotion.label}
              colorKey="emotion"
              content={entry.emotion_type ? `${entry.emotion_type}` : undefined}
              awakening={(entry as any).emotion_awakening}
              score={entry.emotion_score}
            />
            <MiniLayerCard
              emoji={wealthLayerColors.belief.emoji}
              label={wealthLayerColors.belief.label}
              colorKey="belief"
              content={entry.new_belief}
              awakening={(entry as any).belief_awakening}
              score={entry.belief_score}
            />
          </div>

          {/* New Belief Preview */}
          {entry.new_belief && (
            <div className="mt-2 p-2 bg-violet-50/80 dark:bg-violet-950/30 rounded-lg border border-violet-200/50 dark:border-violet-800/30">
              <p className="text-xs text-violet-700 dark:text-violet-300 line-clamp-1">
                💡 新信念: {entry.new_belief}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

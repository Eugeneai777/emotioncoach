import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// 卡点类型映射
const behaviorTypeInfo: Record<string, { name: string }> = {
  mouth: { name: '嘴穷' },
  hand: { name: '手穷' },
  eye: { name: '眼穷' },
  heart: { name: '心穷' },
};

const emotionTypeInfo: Record<string, { name: string }> = {
  anxiety: { name: '焦虑' },
  scarcity: { name: '匮乏' },
  comparison: { name: '自卑' },
  shame: { name: '羞耻' },
  guilt: { name: '内疚' },
};

const beliefTypeInfo: Record<string, { name: string }> = {
  lack: { name: '匮乏感' },
  linear: { name: '线性' },
  stigma: { name: '污名' },
  unworthy: { name: '不配得' },
  relationship: { name: '关系恐惧' },
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

export function WealthJournalCard({ entry, onClick }: WealthJournalCardProps) {
  // Get type labels
  const behaviorLabel = entry.behavior_type && behaviorTypeInfo[entry.behavior_type]?.name;
  const emotionLabel = entry.emotion_type && emotionTypeInfo[entry.emotion_type]?.name;
  const beliefLabel = entry.belief_type && beliefTypeInfo[entry.belief_type]?.name;
  
  // Build compact type string
  const typeLabels = [behaviorLabel, emotionLabel, beliefLabel].filter(Boolean);
  const typeString = typeLabels.length > 0 ? typeLabels.join(' · ') : '';

  return (
    <div 
      className={cn(
        "flex items-center justify-between py-3 px-4 cursor-pointer",
        "hover:bg-muted/50 transition-colors rounded-lg",
        "border-b border-border/50 last:border-b-0"
      )}
      onClick={onClick}
    >
      {/* Left: Day and Date */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-base font-medium text-amber-600 dark:text-amber-400 w-14 flex-shrink-0">
          Day {entry.day_number}
        </span>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {format(new Date(entry.created_at), 'M/d', { locale: zhCN })}
        </span>
        
        {/* Type Labels */}
        {typeString && (
          <span className="text-xs text-muted-foreground truncate">
            {typeString}
          </span>
        )}
      </div>

      {/* Right: Color bars and arrow */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Three Layer Mini Bars */}
        <div className="flex gap-0.5">
          <div 
            className="w-4 h-1 rounded-full bg-amber-500"
            style={{ opacity: Math.max(0.2, (entry.behavior_score || 0) / 5) }}
          />
          <div 
            className="w-4 h-1 rounded-full bg-pink-500"
            style={{ opacity: Math.max(0.2, (entry.emotion_score || 0) / 5) }}
          />
          <div 
            className="w-4 h-1 rounded-full bg-violet-500"
            style={{ opacity: Math.max(0.2, (entry.belief_score || 0) / 5) }}
          />
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}

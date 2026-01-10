import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Sparkles, Target, Heart, Lightbulb, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface JournalEntryDetailDialogProps {
  entry: JournalEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JournalEntryDetailDialog({ entry, open, onOpenChange }: JournalEntryDetailDialogProps) {
  if (!entry) return null;

  const getAwakeningIndex = (): number => {
    const scores = [entry.behavior_score, entry.emotion_score, entry.belief_score].filter(s => s && s > 0) as number[];
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(((avg - 1) / 4) * 100);
  };

  const awakeningIndex = getAwakeningIndex();

  const getStatusColor = (index: number) => {
    if (index >= 80) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '高度觉醒' };
    if (index >= 60) return { bg: 'bg-amber-100', text: 'text-amber-700', label: '稳步觉醒' };
    if (index >= 40) return { bg: 'bg-orange-100', text: 'text-orange-700', label: '初步觉醒' };
    return { bg: 'bg-red-100', text: 'text-red-700', label: '觉醒起步' };
  };

  const status = getStatusColor(awakeningIndex);

  const renderScoreStars = (score: number | null) => {
    if (!score) return <span className="text-muted-foreground text-xs">未记录</span>;
    const fullStars = Math.floor(score);
    const hasHalf = score - fullStars >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={cn(
              "w-3.5 h-3.5",
              i < fullStars 
                ? "fill-amber-400 text-amber-400" 
                : i === fullStars && hasHalf
                  ? "fill-amber-400/50 text-amber-400"
                  : "text-gray-200"
            )} 
          />
        ))}
        <span className="ml-1 text-sm font-medium">{score.toFixed(1)}</span>
      </div>
    );
  };

  const dimensionSections = [
    {
      key: 'behavior',
      icon: Target,
      label: '行为层',
      color: 'amber',
      score: entry.behavior_score,
      block: entry.behavior_block,
      blockLabel: '行为卡点',
      awakening: entry.personal_awakening?.behavior_awakening,
    },
    {
      key: 'emotion',
      icon: Heart,
      label: '情绪层',
      color: 'pink',
      score: entry.emotion_score,
      block: entry.emotion_need,
      blockLabel: '情绪需求',
      awakening: entry.personal_awakening?.emotion_awakening,
    },
    {
      key: 'belief',
      icon: Lightbulb,
      label: '信念层',
      color: 'violet',
      score: entry.belief_score,
      block: entry.new_belief,
      blockLabel: '新信念',
      awakening: entry.personal_awakening?.belief_awakening,
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-lg">Day {entry.day_number}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {format(new Date(entry.created_at), 'yyyy年M月d日', { locale: zhCN })}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
          <div className="space-y-4 pr-2">
            {/* Awakening Index Summary */}
            <div className={cn(
              "p-4 rounded-xl",
              status.bg
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">当日觉醒指数</div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-3xl font-bold", status.text)}>
                      {awakeningIndex}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <Badge variant="secondary" className={cn(status.bg, status.text)}>
                  {status.label}
                </Badge>
              </div>
            </div>

            {/* Three Dimensions */}
            <div className="space-y-3">
              {dimensionSections.map((dim) => {
                const colors = colorMap[dim.color];
                const hasContent = dim.score || dim.block || dim.awakening;
                
                if (!hasContent) return null;
                
                return (
                  <div 
                    key={dim.key}
                    className={cn(
                      "p-3 rounded-xl border",
                      colors.bg, colors.border
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <dim.icon className={cn("w-4 h-4", colors.text)} />
                      <span className={cn("font-medium text-sm", colors.text)}>{dim.label}</span>
                      <div className="ml-auto">
                        {renderScoreStars(dim.score)}
                      </div>
                    </div>

                    {dim.block && (
                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground">{dim.blockLabel}: </span>
                        <span className="text-sm">{dim.block}</span>
                      </div>
                    )}

                    {dim.awakening && (
                      <div className="flex items-start gap-1.5 pt-2 border-t border-dashed" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                        <Sparkles className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", colors.text)} />
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {dim.awakening}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Giving Action */}
            {entry.giving_action && (
              <>
                <Separator />
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-sm text-emerald-700">给予行动</span>
                  </div>
                  <p className="text-sm text-emerald-800">{entry.giving_action}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lock, CheckCircle2, Play, ChevronDown, ChevronUp, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WealthMeditationPlayer } from './WealthMeditationPlayer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WealthMeditationCourseOutlineProps {
  completedDays: number;
  campId: string;
  className?: string;
}

export function WealthMeditationCourseOutline({
  completedDays,
  campId,
  className,
}: WealthMeditationCourseOutlineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replayDay, setReplayDay] = useState<number | null>(null);

  // Fetch all 7 meditations
  const { data: meditations = [] } = useQuery({
    queryKey: ['wealth-meditations-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wealth_meditations')
        .select('day_number, title, description, audio_url, duration_seconds, reflection_prompts')
        .order('day_number', { ascending: true })
        .limit(7);
      if (error) throw error;
      return data || [];
    },
  });

  const replayMeditation = replayDay ? meditations.find(m => m.day_number === replayDay) : null;

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className={className}>
        <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="p-3 cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  7天冥想课程
                </span>
                <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
                  {completedDays}/7 已完成
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-amber-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-600" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-1.5 border-t border-amber-200/40 dark:border-amber-800/30 pt-2">
              {meditations.map((m) => {
                const dayNum = m.day_number;
                const isCompleted = dayNum <= completedDays;
                const isCurrent = dayNum === completedDays + 1;
                const isLocked = dayNum > completedDays + 1;
                const minutes = m.duration_seconds ? Math.round(m.duration_seconds / 60) : null;

                return (
                  <div
                    key={dayNum}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      isCompleted && "bg-amber-100/60 dark:bg-amber-900/20 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30",
                      isCurrent && "bg-amber-200/50 dark:bg-amber-800/30 ring-1 ring-amber-300 dark:ring-amber-700",
                      isLocked && "opacity-50"
                    )}
                    onClick={() => {
                      if (isCompleted) setReplayDay(dayNum);
                    }}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isCurrent ? (
                        <Play className="w-5 h-5 text-amber-600 fill-amber-600" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-semibold",
                          isCurrent ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
                        )}>
                          Day {dayNum}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-300/60 text-amber-800 font-medium">
                            今日
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm truncate",
                        isLocked ? "text-muted-foreground/60" : "text-foreground"
                      )}>
                        {m.title || `冥想 ${dayNum}`}
                      </p>
                    </div>

                    {/* Duration + replay hint */}
                    <div className="flex-shrink-0 text-right">
                      {minutes && (
                        <span className="text-xs text-muted-foreground">{minutes}分钟</span>
                      )}
                      {isCompleted && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400">回放</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Replay dialog */}
      <Dialog open={!!replayDay} onOpenChange={(open) => !open && setReplayDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>回放 Day {replayDay} 冥想</DialogTitle>
          </DialogHeader>
          {replayMeditation && (
            <WealthMeditationPlayer
              dayNumber={replayDay!}
              title={replayMeditation.title}
              description={replayMeditation.description}
              audioUrl={replayMeditation.audio_url}
              durationSeconds={replayMeditation.duration_seconds}
              reflectionPrompts={replayMeditation.reflection_prompts as string[] || []}
              onComplete={() => {}}
              isCompleted={true}
              savedReflection=""
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

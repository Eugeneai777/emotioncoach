import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, Loader2, Headphones, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioCache } from '@/hooks/useAudioCache';

interface StressMeditation {
  id: string;
  day_number: number;
  title: string;
  audio_url: string | null;
  duration_seconds: number;
}

export function MeditationOverviewCard() {
  const [open, setOpen] = useState(false);
  const [meditations, setMeditations] = useState<StressMeditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isCached, getCachedAudio } = useAudioCache();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('stress_meditations')
        .select('id, day_number, title, audio_url, duration_seconds')
        .eq('camp_type', 'emotion_stress_7')
        .order('day_number', { ascending: true });
      setMeditations(data || []);
      setLoading(false);
    };
    fetch();
    return () => { audioRef.current?.pause(); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const togglePlay = async (index: number) => {
    const med = meditations[index];
    if (!med.audio_url) return;

    if (playingIndex === index && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    audioRef.current?.pause();
    let src = med.audio_url;
    const cached = await getCachedAudio(med.audio_url);
    if (cached) src = cached;

    const audio = new Audio(src);
    audioRef.current = audio;
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPlayingIndex(null);
    });
    setPlayingIndex(index);
    await audio.play();
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (meditations.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors rounded-t-2xl">
            <CardTitle className="text-base flex items-center gap-2">
              <Headphones className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="flex-1">7天冥想课程</span>
              <span className="text-xs text-muted-foreground font-normal">{meditations.length}节</span>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-1.5 pt-0">
            {meditations.map((med, index) => {
              const active = playingIndex === index && isPlaying;
              return (
                <div
                  key={med.id}
                  onClick={() => togglePlay(index)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                    active
                      ? "bg-amber-100 dark:bg-amber-900/40"
                      : "hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                    active
                      ? "bg-amber-500 text-white"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                  )}>
                    {active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Day {med.day_number} · {med.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTime(med.duration_seconds)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAudioCache } from '@/hooks/useAudioCache';
import { Play, Pause, Download, Cloud, Loader2, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StressMeditation {
  id: string;
  day_number: number;
  title: string;
  script: string;
  audio_url: string | null;
  duration_seconds: number;
  camp_type: string;
}

export function MeditationZone() {
  const [meditations, setMeditations] = useState<StressMeditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isCached, cacheAudio, getCachedAudio, isLoading: isCaching } = useAudioCache();

  useEffect(() => {
    fetchMeditations();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchMeditations = async () => {
    try {
      const { data, error } = await supabase
        .from('stress_meditations')
        .select('*')
        .eq('camp_type', 'emotion_stress_7')
        .order('day_number', { ascending: true });

      if (error) throw error;
      setMeditations(data || []);
    } catch (e) {
      console.error('Failed to load meditations:', e);
    } finally {
      setLoading(false);
    }
  };

  const playMeditation = async (index: number) => {
    const med = meditations[index];
    if (!med.audio_url) return;

    // If same track, toggle play/pause
    if (currentIndex === index && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setCurrentIndex(index);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Try cached version first
    let src = med.audio_url;
    const cached = await getCachedAudio(med.audio_url);
    if (cached) src = cached;

    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      // Auto-play next
      if (index < meditations.length - 1) {
        playMeditation(index + 1);
      }
    });

    await audio.play();
    setIsPlaying(true);
  };

  const seekTo = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleCache = async (url: string) => {
    await cacheAudio(url);
  };

  const current = currentIndex !== null ? meditations[currentIndex] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Now Playing */}
      {current && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400">正在播放</p>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Day {current.day_number} · {current.title}
                </h3>
              </div>
            </div>

            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={1}
              onValueChange={seekTo}
              className="cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600 dark:text-amber-400">{formatTime(currentTime)}</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentIndex === 0}
                  onClick={() => currentIndex !== null && currentIndex > 0 && playMeditation(currentIndex - 1)}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => currentIndex !== null && playMeditation(currentIndex)}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentIndex === meditations.length - 1}
                  onClick={() => currentIndex !== null && currentIndex < meditations.length - 1 && playMeditation(currentIndex + 1)}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400">{formatTime(duration)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meditation List */}
      <div className="space-y-2">
        {meditations.map((med, index) => (
          <Card
            key={med.id}
            onClick={() => med.audio_url && playMeditation(index)}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]",
              currentIndex === index
                ? "ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/30"
                : "bg-card"
            )}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {/* Play indicator */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                currentIndex === index && isPlaying
                  ? "bg-amber-500 text-white"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              )}>
                {currentIndex === index && isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Day {med.day_number}
                  </span>
                  {!med.audio_url && (
                    <span className="text-xs text-muted-foreground">(生成中)</span>
                  )}
                </div>
                <h4 className="font-medium text-sm text-foreground truncate">{med.title}</h4>
              </div>

              {/* Duration & Cache */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {formatTime(med.duration_seconds)}
                </span>
                {med.audio_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCached(med.audio_url!)) handleCache(med.audio_url!);
                    }}
                    className={cn(
                      "p-1.5 rounded-full transition-colors",
                      isCached(med.audio_url)
                        ? "text-green-600 bg-green-50 dark:bg-green-900/30"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {isCached(med.audio_url) ? (
                      <Cloud className="w-3.5 h-3.5" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {meditations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>暂无冥想音频</p>
        </div>
      )}
    </div>
  );
}

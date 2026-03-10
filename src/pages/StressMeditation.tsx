import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, Volume2, ChevronLeft, ChevronRight, Loader2, Download, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAudioCache } from '@/hooks/useAudioCache';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StressMeditationData {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  script: string;
  audio_url: string | null;
  duration_seconds: number;
}

export default function StressMeditation() {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const navigate = useNavigate();
  const day = parseInt(dayNumber || '1', 10);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showScript, setShowScript] = useState(false);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { isCached, cacheAudio, getCachedAudio, isSupported: isCacheSupported, isLoading: isCaching } = useAudioCache();

  const { data: meditation, isLoading } = useQuery({
    queryKey: ['stress-meditation', day],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stress_meditations')
        .select('*')
        .eq('day_number', day)
        .eq('camp_type', 'emotion_stress_7')
        .single();
      if (error) throw error;
      return data as StressMeditationData;
    },
  });

  const isAudioCached = meditation?.audio_url ? isCached(meditation.audio_url) : false;

  // Load cached audio
  useEffect(() => {
    const loadCached = async () => {
      if (meditation?.audio_url && isCached(meditation.audio_url)) {
        const blobUrl = await getCachedAudio(meditation.audio_url);
        if (blobUrl) setCachedAudioUrl(blobUrl);
      }
    };
    loadCached();
    return () => {
      if (cachedAudioUrl) URL.revokeObjectURL(cachedAudioUrl);
    };
  }, [meditation?.audio_url]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || meditation?.duration_seconds || 0);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, [meditation]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); return; }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      toast.error('无法播放音频，请检查网络');
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const restart = () => {
    if (audioRef.current) { audioRef.current.currentTime = 0; setCurrentTime(0); }
  };

  const handleCacheAudio = async () => {
    if (!meditation?.audio_url) return;
    const success = await cacheAudio(meditation.audio_url);
    if (success) {
      const blobUrl = await getCachedAudio(meditation.audio_url);
      if (blobUrl) setCachedAudioUrl(blobUrl);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const effectiveDuration = duration || meditation?.duration_seconds || 600;
  const progress = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meditation) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="冥想未找到" onBack={() => navigate(-1)} />
        <div className="p-6 text-center text-muted-foreground">
          <p>第 {day} 天的冥想内容暂未上线</p>
          <Button onClick={() => navigate(-1)} className="mt-4">返回</Button>
        </div>
      </div>
    );
  }

  const scriptLines = meditation.script.split('\n').filter(l => l.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
      <PageHeader title={`Day ${day} · ${meditation.title}`} showBack />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Audio element */}
        {meditation.audio_url && (
          <audio
            ref={audioRef}
            src={cachedAudioUrl || encodeURI(meditation.audio_url)}
            preload="auto"
            playsInline
          />
        )}

        {/* Player Card */}
        <Card className="overflow-hidden border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
          <CardContent className="p-6 space-y-6">
            {/* Day info */}
            <div className="text-center space-y-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                🧘 Day {day} · 解压冥想
              </span>
              <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                {meditation.title}
              </h2>
              {meditation.description && (
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{meditation.description}</p>
              )}
            </div>

            {/* Visualizer */}
            <div className="relative h-20 flex items-center justify-center">
              <AnimatePresence>
                {isPlaying ? (
                  <motion.div
                    className="flex items-center gap-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {[...Array(7)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-emerald-500 dark:bg-emerald-400"
                        animate={{ height: [8, 20 + Math.random() * 20, 8] }}
                        transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-500/60">
                    {meditation.audio_url ? '点击播放开始冥想' : '音频生成中，请稍候...'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            {meditation.audio_url && (
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={effectiveDuration}
                  step={1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(effectiveDuration)}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="icon" onClick={restart}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
                <RotateCcw className="w-5 h-5" />
              </Button>

              <Button onClick={togglePlay} disabled={!meditation.audio_url}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </Button>

              {/* Cache button */}
              {isCacheSupported && meditation.audio_url && (
                <Button variant="ghost" size="icon" onClick={handleCacheAudio} disabled={isCaching || isAudioCached}
                  className={cn(
                    isAudioCached ? "text-green-600" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400"
                  )}>
                  {isCaching ? <Loader2 className="w-5 h-5 animate-spin" /> :
                    isAudioCached ? <CloudOff className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                </Button>
              )}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 px-4">
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <Slider value={[volume * 100]} max={100} step={1}
                onValueChange={(v) => setVolume(v[0] / 100)} className="flex-1" />
            </div>
          </CardContent>
        </Card>

        {/* Script toggle */}
        <Button variant="outline" onClick={() => setShowScript(!showScript)}
          className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300">
          {showScript ? '收起冥想文案' : '查看冥想文案'}
        </Button>

        {/* Script content */}
        <AnimatePresence>
          {showScript && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-5 space-y-3">
                  {scriptLines.map((line, i) => (
                    <p key={i} className={cn(
                      "text-sm leading-relaxed",
                      line.startsWith('（') ? "text-emerald-500/60 italic text-xs" : "text-emerald-800 dark:text-emerald-200"
                    )}>
                      {line}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day navigation */}
        <div className="flex justify-between pt-2 pb-8">
          <Button variant="ghost" disabled={day <= 1} onClick={() => navigate(`/stress-meditation/${day - 1}`)}
            className="text-emerald-600 dark:text-emerald-400">
            <ChevronLeft className="w-4 h-4 mr-1" /> 上一天
          </Button>
          <Button variant="ghost" disabled={day >= 7} onClick={() => navigate(`/stress-meditation/${day + 1}`)}
            className="text-emerald-600 dark:text-emerald-400">
            下一天 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

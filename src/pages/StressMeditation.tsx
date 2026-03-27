import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, Volume2, ChevronLeft, ChevronRight, Loader2, Download, CloudOff, MessageCircle, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAudioCache } from '@/hooks/useAudioCache';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getTodayCST } from '@/utils/dateUtils';

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
  const { user } = useAuth();
  const day = parseInt(dayNumber || '1', 10);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showScript, setShowScript] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  const [thought, setThought] = useState('');
  const [emotionImpact, setEmotionImpact] = useState('');
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
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

  // Mark meditation as completed in camp_daily_progress
  const markMeditationCompleted = useCallback(async () => {
    if (!user) return;
    try {
      const today = getTodayCST();
      const { data: activeCamp } = await supabase
        .from('training_camps')
        .select('id')
        .eq('user_id', user.id)
        .eq('camp_type', 'emotion_stress_7')
        .eq('status', 'active')
        .maybeSingle();

      if (!activeCamp) return;

      await supabase
        .from('camp_daily_progress')
        .upsert({
          camp_id: activeCamp.id,
          user_id: user.id,
          progress_date: today,
          declaration_completed: true,
          declaration_completed_at: new Date().toISOString(),
        }, {
          onConflict: 'camp_id,progress_date',
        });
    } catch (error) {
      console.error('标记冥想完成失败:', error);
    }
  }, [user]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || meditation?.duration_seconds || 0);
    const onEnd = () => {
      setIsPlaying(false);
      setHasListened(true);
      markMeditationCompleted();
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onPlaying = () => setIsBuffering(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onPlaying);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onPlaying);
    };
  }, [meditation, markMeditationCompleted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || isLoadingPlay) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); return; }
    setIsLoadingPlay(true);
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      // Retry: reload then play
      try {
        audio.load();
        await new Promise(resolve => {
          const handler = () => { audio.removeEventListener('canplay', handler); resolve(undefined); };
          audio.addEventListener('canplay', handler);
          setTimeout(() => { audio.removeEventListener('canplay', handler); resolve(undefined); }, 5000);
        });
        await audio.play();
        setIsPlaying(true);
      } catch {
        toast.error('音频加载失败，请稍后重试');
      }
    } finally {
      setIsLoadingPlay(false);
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
        <PageHeader title="冥想未找到" showBack />
        <div className="p-6 text-center text-muted-foreground">
          <p>第 {day} 天的冥想内容暂未上线</p>
          <Button onClick={() => navigate(-1)} className="mt-4">返回</Button>
        </div>
      </div>
    );
  }

  // Smart formatting for meditation script
  const formatScript = (script: string) => {
    const lines = script.split('\n').filter(l => l.trim());
    const paragraphs: string[][] = [];
    let current: string[] = [];
    
    for (const line of lines) {
      current.push(line);
      // Split into paragraphs every 3-5 sentences or on explicit breaks
      const sentenceCount = line.split(/[。！？…]+/).filter(Boolean).length;
      if (current.length >= 3 || sentenceCount >= 3) {
        paragraphs.push([...current]);
        current = [];
      }
    }
    if (current.length > 0) paragraphs.push(current);

    // If only 1 paragraph from line-based split, try sentence-based splitting
    if (paragraphs.length <= 1 && lines.length <= 2) {
      const allText = lines.join('');
      const sentences = allText.split(/(?<=[。！？…])/g).filter(s => s.trim());
      const sentParagraphs: string[][] = [];
      let sentCurrent: string[] = [];
      for (const s of sentences) {
        sentCurrent.push(s.trim());
        if (sentCurrent.length >= 4) {
          sentParagraphs.push([sentCurrent.join('')]);
          sentCurrent = [];
        }
      }
      if (sentCurrent.length > 0) sentParagraphs.push([sentCurrent.join('')]);
      if (sentParagraphs.length > 1) return sentParagraphs;
    }
    return paragraphs;
  };

  const breathingKeywords = ['吸气', '吐气', '呼气', '屏住呼吸', '深呼吸', '慢慢地呼吸', '自然呼吸'];
  
  const highlightBreathing = (text: string) => {
    const regex = new RegExp(`(${breathingKeywords.join('|')})`, 'g');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      breathingKeywords.includes(part) 
        ? <span key={i} className="text-emerald-600 dark:text-emerald-400 font-medium">{part}</span>
        : part
    );
  };

  const scriptParagraphs = formatScript(meditation.script);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
      <PageHeader title={`Day ${day} · ${meditation.title}`} showBack />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Audio element */}
        {meditation.audio_url && (
          <audio
            ref={audioRef}
            src={cachedAudioUrl || meditation.audio_url}
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

              <Button onClick={togglePlay} disabled={!meditation.audio_url || isLoadingPlay}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">
                {isLoadingPlay || isBuffering ? <Loader2 className="w-7 h-7 animate-spin" /> :
                  isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
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

        {/* Meditation Reflection Card */}
        <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-base font-semibold text-teal-800 dark:text-teal-200">冥想反思</h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-teal-700 dark:text-teal-300">
                刚刚冥想的时候，有没有一个想法或事情在你脑海里出现？
              </label>
              <Textarea
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder="比如：工作压力、和家人的关系、对未来的担忧..."
                className="bg-white/70 dark:bg-white/5 border-teal-200 dark:border-teal-700 focus-visible:ring-teal-400 min-h-[72px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-teal-700 dark:text-teal-300">
                这个想法和事情如何影响你的情绪？
              </label>
              <Textarea
                value={emotionImpact}
                onChange={(e) => setEmotionImpact(e.target.value)}
                placeholder="比如：让我感到焦虑、有点难过、心里不踏实..."
                className="bg-white/70 dark:bg-white/5 border-teal-200 dark:border-teal-700 focus-visible:ring-teal-400 min-h-[72px]"
              />
            </div>

            <Button
              onClick={() => navigate('/emotion-coach', {
                state: {
                  meditationReflection: {
                    thought: thought.trim(),
                    emotionImpact: emotionImpact.trim(),
                    dayNumber: day,
                  }
                }
              })}
              disabled={!thought.trim() && !emotionImpact.trim()}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-5 text-base"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              情绪教练梳理
            </Button>

            <AnimatePresence>
              {hasListened && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button
                    variant="ghost"
                    onClick={() => { setHasListened(false); restart(); }}
                    className="w-full text-sm text-teal-600 dark:text-teal-400"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    再听一次
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
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
                <CardContent className="px-6 py-5 space-y-4">
                  {scriptParagraphs.map((paragraph, pi) => (
                    <div key={pi} className="space-y-1">
                      {paragraph.map((line, li) => {
                        const isFirst = pi === 0 && li === 0;
                        const isStageDir = line.startsWith('（') || line.startsWith('(');
                        return (
                          <p key={li} className={cn(
                            "leading-7",
                            isStageDir 
                              ? "text-emerald-500/60 italic text-sm" 
                              : isFirst 
                                ? "text-base font-semibold text-emerald-900 dark:text-emerald-100"
                                : "text-base text-emerald-800 dark:text-emerald-200"
                          )}>
                            {isStageDir ? line : highlightBreathing(line)}
                          </p>
                        );
                      })}
                    </div>
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

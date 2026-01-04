import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WealthMeditationPlayerProps {
  dayNumber: number;
  title: string;
  description?: string;
  audioUrl: string;
  durationSeconds: number;
  reflectionPrompts: string[];
  onComplete: (reflection: string) => void;
  isCompleted?: boolean;
}

export function WealthMeditationPlayer({
  dayNumber,
  title,
  description,
  audioUrl,
  durationSeconds,
  reflectionPrompts,
  onComplete,
  isCompleted = false,
}: WealthMeditationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [hasListened, setHasListened] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setHasListened(true);
      setShowReflection(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    onComplete(reflection);
  };

  const progress = durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

  if (isCompleted) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">今日冥想已完成</h3>
              <p className="text-sm text-amber-600 dark:text-amber-400">Day {dayNumber} · {title}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
      <CardContent className="p-0">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-2">
            <span className="text-2xl">🧘</span>
            <span>今日冥想 · Day {dayNumber}</span>
          </div>
          <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100">{title}</h3>
          {description && (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{description}</p>
          )}
        </div>

        {/* Player */}
        <div className="px-6 pb-4">
          <div className="bg-white/60 dark:bg-black/20 rounded-2xl p-4">
            {/* Waveform / Progress visualization */}
            <div className="relative h-16 mb-4 flex items-center justify-center">
              <AnimatePresence>
                {isPlaying && (
                  <motion.div 
                    className="flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-amber-500 rounded-full"
                        animate={{
                          height: [12, 24 + Math.random() * 16, 12],
                        }}
                        transition={{
                          duration: 0.5 + Math.random() * 0.3,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {!isPlaying && (
                <div className="text-amber-500/50 text-sm">
                  {hasListened ? '冥想已完成，可以重新播放' : '点击播放开始冥想'}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={restart}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={togglePlay}
                className={cn(
                  "w-14 h-14 rounded-full",
                  "bg-amber-500 hover:bg-amber-600 text-white",
                  "shadow-lg shadow-amber-500/30"
                )}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>

              <div className="flex items-center gap-2 flex-1">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={(v) => setVolume(v[0])}
                  className="w-20"
                />
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <Slider
                value={[currentTime]}
                max={durationSeconds}
                step={1}
                onValueChange={handleSeek}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-amber-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(durationSeconds)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reflection Section */}
        <AnimatePresence>
          {(showReflection || hasListened) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-amber-200 dark:border-amber-800"
            >
              <div className="p-6">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                  <span>📝</span> 冥想后反思
                </h4>
                
                <div className="space-y-2 mb-4">
                  {reflectionPrompts.map((prompt, index) => (
                    <p key={index} className="text-sm text-amber-700 dark:text-amber-300">
                      {index + 1}. {prompt}
                    </p>
                  ))}
                </div>

                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="记录你的冥想感受..."
                  className="bg-white/60 dark:bg-black/20 border-amber-200 dark:border-amber-700 min-h-[100px] resize-none"
                />

                <Button
                  onClick={handleComplete}
                  disabled={!reflection.trim()}
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  完成冥想，开始财富梳理
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

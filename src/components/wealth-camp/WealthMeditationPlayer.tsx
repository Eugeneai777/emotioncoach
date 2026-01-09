import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Check, Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import MeditationVideoBackground, { VideoBackgroundType } from './MeditationVideoBackground';

interface WealthMeditationPlayerProps {
  dayNumber: number;
  title: string;
  description?: string;
  audioUrl: string;
  durationSeconds: number;
  reflectionPrompts: string[];
  onComplete: (reflection: string) => void;
  isCompleted?: boolean;
  savedReflection?: string;
  onRedo?: () => void;
  onStartCoaching?: () => void;
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
  savedReflection,
  onRedo,
  onStartCoaching,
}: WealthMeditationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [hasListened, setHasListened] = useState(false);
  const videoBackground: VideoBackgroundType = 'water'; // 默认水面背景
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 当从已完成状态切换回播放器时，重置状态
  useEffect(() => {
    if (!isCompleted) {
      setCurrentTime(0);
      setIsPlaying(false);
      setShowReflection(false);
      // 保留 hasListened，这样用户可以直接写反思
    }
  }, [isCompleted]);

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
  }, [isCompleted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio play failed:', err);
      setIsPlaying(false);
      toast.error('无法播放音频：请检查静音/系统媒体权限，或稍后重试');
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


  // 复制冥想感受
  const handleCopyReflection = async () => {
    if (!savedReflection) return;
    
    try {
      await navigator.clipboard.writeText(savedReflection);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('复制失败，请手动复制');
    }
  };

  if (isCompleted) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6 space-y-4">
          {/* 成功动画 */}
          <motion.div 
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-3">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">冥想完成！</h3>
            <p className="text-sm text-muted-foreground mt-1">Day {dayNumber} · {title}</p>
          </motion.div>
          
          {/* 冥想感受摘要（带复制） */}
          {savedReflection && (
            <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-amber-600 dark:text-amber-400">📝 我的冥想感受</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyReflection}
                  className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      复制
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200 line-clamp-2">
                {savedReflection}
              </p>
            </div>
          )}
          
          {/* 主CTA：开始教练梳理 */}
          {onStartCoaching && (
            <Button 
              onClick={onStartCoaching}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-5 text-base"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              开始教练梳理
            </Button>
          )}
          
          {/* 次要操作 */}
          <div className="flex justify-center gap-4 text-sm">
            {onRedo && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={onRedo}
                className="text-amber-600 hover:text-amber-700"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                重新冥想
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
      <CardContent className="p-0">
        <audio 
          ref={audioRef} 
          src={encodeURI(audioUrl)} 
          preload="metadata"
          onError={() => {
            const code = audioRef.current?.error?.code;
            console.error('Audio load error:', { src: audioUrl, code });
            toast.error('音频加载失败：请刷新页面后重试');
            setIsPlaying(false);
          }}
        />
        
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
          <div className="relative bg-white/60 dark:bg-black/20 rounded-2xl p-4 overflow-hidden">
            {/* Video Background Layer */}
            <MeditationVideoBackground
              backgroundType={videoBackground}
              isActive={isPlaying || videoBackground !== null}
              className="z-0"
            />
            
            {/* Content Layer */}
            <div className="relative z-10">
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
                          className={cn(
                            "w-1 rounded-full",
                            videoBackground ? "bg-white" : "bg-amber-500"
                          )}
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
                  <div className={cn(
                    "text-sm",
                    videoBackground ? "text-white/70" : "text-amber-500/50"
                  )}>
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
                className={cn(
                  videoBackground 
                    ? "text-white/80 hover:text-white hover:bg-white/20" 
                    : "text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                )}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={togglePlay}
                className={cn(
                  "w-14 h-14 rounded-full shadow-lg",
                  videoBackground 
                    ? "bg-white/90 hover:bg-white text-slate-800" 
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30"
                )}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>

              <div className="flex items-center gap-2 flex-1">
                <Volume2 className={cn("w-4 h-4", videoBackground ? "text-white/80" : "text-amber-600")} />
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
              <div className={cn(
                "flex justify-between text-xs",
                videoBackground ? "text-white/80" : "text-amber-600"
              )}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(durationSeconds)}</span>
              </div>
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
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                  <span>📝</span> 冥想后反思
                </h4>
                
                {/* 今日冥想主题 */}
                <div className="bg-amber-100/50 dark:bg-amber-900/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <span className="font-medium">今日主题：</span>{title}
                  </p>
                  {description && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{description}</p>
                  )}
                </div>

                {/* 引导提问 */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    选择一个角度深入分享（或自由书写）：
                  </p>
                  <div className="space-y-2">
                    {reflectionPrompts.length > 0 ? (
                      reflectionPrompts.map((prompt, index) => (
                        <p key={index} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <span className="text-amber-500">•</span> {prompt}
                        </p>
                      ))
                    ) : (
                      <>
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <span className="text-amber-500">•</span> 冥想中你注意到了什么身体感受？（紧绷、放松、某处不适...）
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <span className="text-amber-500">•</span> 有什么画面、记忆或想法浮现了吗？
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <span className="text-amber-500">•</span> 你对金钱的感受有什么变化？
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="尽量描述具体的感受，比如'我想到小时候爸爸说的一句话...' 而不是'感觉还好'。越具体，教练的梳理越有价值 ✨"
                  className="bg-white/60 dark:bg-black/20 border-amber-200 dark:border-amber-700 min-h-[120px] resize-none"
                />
                
                {/* 字数提示 */}
                <div className="flex justify-between items-center mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <span>{reflection.length < 30 && reflection.length > 0 ? '💡 再多写一点，帮助教练更好地理解你' : ''}</span>
                  <span>{reflection.length} 字</span>
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={!reflection.trim() || reflection.length < 10}
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
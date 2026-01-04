import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, Check, Image, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MeditationAmbientPlayer, { SoundType } from './MeditationAmbientPlayer';
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
}

// 音效与背景的映射关系
const SOUND_TO_BACKGROUND_MAP: Record<NonNullable<SoundType>, VideoBackgroundType> = {
  ocean: 'water',
  stream: 'water',
  rain: 'clouds',
  forest: 'forest',
  fire: 'fire',
  wind: 'aurora',
};

// 背景与推荐音效的映射关系
const BACKGROUND_TO_SOUND_MAP: Record<NonNullable<VideoBackgroundType>, SoundType> = {
  water: 'ocean',
  forest: 'forest',
  fire: 'fire',
  stars: 'wind',
  clouds: 'rain',
  sunset: 'ocean',
  aurora: 'wind',
  snow: 'wind',
};

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
}: WealthMeditationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [hasListened, setHasListened] = useState(false);
  const [videoBackground, setVideoBackground] = useState<VideoBackgroundType>(null);
  const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);
  const [currentSound, setCurrentSound] = useState<SoundType>(null);
  const [isAutoSync, setIsAutoSync] = useState(true);
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

  // 处理音效变化，自动同步背景
  const handleSoundChange = useCallback((sound: SoundType) => {
    setCurrentSound(sound);
    if (isAutoSync && sound) {
      const matchedBackground = SOUND_TO_BACKGROUND_MAP[sound];
      if (matchedBackground) {
        setVideoBackground(matchedBackground);
      }
    } else if (isAutoSync && !sound) {
      // 如果关闭音效且自动同步开启，也关闭背景
      setVideoBackground(null);
    }
  }, [isAutoSync]);

  // 处理背景变化，自动同步音效
  const handleBackgroundChange = useCallback((bg: VideoBackgroundType) => {
    setVideoBackground(bg);
    if (isAutoSync && bg) {
      const matchedSound = BACKGROUND_TO_SOUND_MAP[bg];
      if (matchedSound && matchedSound !== currentSound) {
        setCurrentSound(matchedSound);
      }
    } else if (isAutoSync && !bg) {
      // 如果关闭背景且自动同步开启，也关闭音效
      setCurrentSound(null);
    }
  }, [isAutoSync, currentSound]);

  const progress = durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

  // 背景选项配置
  const backgroundOptions: Array<{ type: VideoBackgroundType; label: string; icon: string }> = [
    { type: 'water', label: '水面', icon: '💧' },
    { type: 'forest', label: '森林', icon: '🌲' },
    { type: 'fire', label: '篝火', icon: '🔥' },
    { type: 'stars', label: '星空', icon: '⭐' },
    { type: 'clouds', label: '云海', icon: '☁️' },
    { type: 'sunset', label: '日落', icon: '🌅' },
    { type: 'aurora', label: '极光', icon: '🌌' },
    { type: 'snow', label: '雪景', icon: '❄️' },
  ];

  if (isCompleted) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">今日冥想已完成</h3>
              <p className="text-sm text-amber-600 dark:text-amber-400">Day {dayNumber} · {title}</p>
            </div>
          </div>
          
          {/* 显示已保存的反思摘要 */}
          {savedReflection && (
            <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">📝 我的冥想感受</p>
              <p className="text-sm text-amber-800 dark:text-amber-200 line-clamp-3">
                {savedReflection}
              </p>
            </div>
          )}
          
          {/* 重新冥想按钮 */}
          {onRedo && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重新冥想
            </Button>
          )}
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
          onError={(e) => console.error('Audio load error:', e)}
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

            {/* Video Background Selector */}
            <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm",
                    videoBackground ? "text-white/70" : "text-muted-foreground"
                  )}>
                    🎬 视频背景
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAutoSync(!isAutoSync)}
                    className={cn(
                      "h-5 px-1.5 text-[10px] rounded-full transition-all",
                      isAutoSync 
                        ? "bg-amber-500/20 text-amber-600 ring-1 ring-amber-500/30" 
                        : videoBackground
                          ? "text-white/50 hover:text-white/70"
                          : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                    title={isAutoSync ? "自动联动已开启" : "自动联动已关闭"}
                  >
                    <Link2 className="w-3 h-3 mr-0.5" />
                    联动
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackgroundOptions(!showBackgroundOptions)}
                  className={cn(
                    "h-6 px-2 text-xs",
                    videoBackground ? "text-white/70 hover:text-white" : "text-muted-foreground"
                  )}
                >
                  <Image className="w-3 h-3 mr-1" />
                  {showBackgroundOptions ? '收起' : '选择'}
                </Button>
              </div>
              
              <AnimatePresence>
                {showBackgroundOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1 flex-wrap"
                  >
                    {backgroundOptions.map(({ type, label, icon }) => (
                      <Button
                        key={type}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 px-2 rounded-full transition-all",
                          videoBackground === type 
                            ? 'bg-amber-500/20 text-amber-600 ring-1 ring-amber-500/30' 
                            : videoBackground
                              ? 'text-white/70 hover:text-white hover:bg-white/20'
                              : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'
                        )}
                        onClick={() => handleBackgroundChange(videoBackground === type ? null : type)}
                      >
                        <span className="text-sm mr-1">{icon}</span>
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Ambient Sound */}
            <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-700/50">
              <MeditationAmbientPlayer 
                isPlaying={isPlaying} 
                enableHighQuality 
                currentSound={currentSound}
                onSoundChange={handleSoundChange}
              />
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
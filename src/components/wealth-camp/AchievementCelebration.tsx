import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Award, X, Sparkles, Trophy, Star, Flame, Crown } from 'lucide-react';
import { achievements } from '@/config/awakeningLevelConfig';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Category theme configuration
const categoryThemes = {
  milestone: {
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    bg: 'from-amber-100/50 to-orange-100/50',
    icon: <Trophy className="w-5 h-5" />,
    label: '里程碑成就',
    color: 'text-amber-600',
  },
  streak: {
    gradient: 'from-orange-400 via-red-500 to-pink-500',
    bg: 'from-orange-100/50 to-red-100/50',
    icon: <Flame className="w-5 h-5" />,
    label: '连续打卡',
    color: 'text-orange-600',
  },
  growth: {
    gradient: 'from-violet-400 via-purple-500 to-pink-500',
    bg: 'from-violet-100/50 to-purple-100/50',
    icon: <Star className="w-5 h-5" />,
    label: '成长突破',
    color: 'text-violet-600',
  },
  social: {
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    bg: 'from-emerald-100/50 to-teal-100/50',
    icon: <Crown className="w-5 h-5" />,
    label: '社交影响',
    color: 'text-emerald-600',
  },
};

interface AchievementCelebrationProps {
  achievementKeys: string[];
  onClose: () => void;
}

export function AchievementCelebration({ achievementKeys, onClose }: AchievementCelebrationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Get achievement details
  const unlockedAchievements = achievementKeys
    .map(key => achievements.find(a => a.key === key))
    .filter(Boolean);

  const currentAchievement = unlockedAchievements[currentIndex];
  const categoryTheme = currentAchievement 
    ? categoryThemes[currentAchievement.category as keyof typeof categoryThemes] || categoryThemes.milestone
    : categoryThemes.milestone;

  // Enhanced confetti with multiple bursts
  const fireConfetti = useCallback(() => {
    // Center burst with larger particles
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6', '#ec4899'],
      scalar: 1.2,
    });

    // Side bursts with delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#fbbf24', '#f97316', '#fb923c'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#fbbf24', '#f97316', '#fb923c'],
      });
    }, 150);

    // Star-shaped burst
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 360,
        origin: { y: 0.4, x: 0.5 },
        shapes: ['star'],
        colors: ['#fcd34d', '#fbbf24'],
        scalar: 1.5,
      });
    }, 300);
  }, []);

  // Fire confetti on mount and index change
  useEffect(() => {
    if (unlockedAchievements.length > 0) {
      fireConfetti();
    }
  }, [currentIndex, fireConfetti, unlockedAchievements.length]);

  // Auto-advance or close after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < unlockedAchievements.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        handleClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, unlockedAchievements.length]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleNext = () => {
    if (currentIndex < unlockedAchievements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  if (!currentAchievement || unlockedAchievements.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={handleClose}
        >
          {/* Floating particles background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-amber-400/30"
                initial={{ 
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400), 
                  y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20,
                  opacity: 0 
                }}
                animate={{ 
                  y: -20,
                  opacity: [0, 1, 0],
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "linear"
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50, rotateX: -15 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
            className="relative mx-4 w-full max-w-sm perspective-1000"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 z-10 bg-white/90 rounded-full shadow-lg hover:bg-white"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Achievement card with gradient border */}
            <div className={cn(
              "relative overflow-hidden rounded-3xl p-1 shadow-2xl",
              `bg-gradient-to-br ${categoryTheme.gradient}`
            )}>
              {/* Animated border glow */}
              <motion.div
                className="absolute inset-0 opacity-50"
                animate={{
                  background: [
                    `linear-gradient(0deg, transparent, rgba(255,255,255,0.3), transparent)`,
                    `linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)`,
                    `linear-gradient(360deg, transparent, rgba(255,255,255,0.3), transparent)`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div className="rounded-[22px] bg-white p-6 text-center relative overflow-hidden">
                {/* Decorative background */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-40 -z-10",
                  `bg-gradient-to-br ${categoryTheme.bg}`
                )} />

                {/* Rays animation */}
                <motion.div
                  className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "absolute top-1/2 left-1/2 w-1 h-32 origin-bottom",
                        `bg-gradient-to-t ${categoryTheme.gradient} opacity-10`
                      )}
                      style={{ transform: `rotate(${i * 30}deg) translateX(-50%)` }}
                    />
                  ))}
                </motion.div>
                
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.7, delay: 0.1, bounce: 0.5 }}
                  className="relative mx-auto mb-4"
                >
                  {/* Glow effect */}
                  <motion.div
                    className={cn(
                      "absolute inset-0 rounded-full blur-xl opacity-50",
                      `bg-gradient-to-br ${categoryTheme.gradient}`
                    )}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  <div className={cn(
                    "w-28 h-28 mx-auto rounded-full flex items-center justify-center shadow-xl relative",
                    `bg-gradient-to-br ${categoryTheme.gradient}`
                  )}>
                    <motion.span 
                      className="text-6xl"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                    >
                      {currentAchievement.icon}
                    </motion.span>
                  </div>
                  
                  {/* Sparkle decorations */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <Sparkles className="absolute -top-2 -right-2 w-7 h-7 text-amber-400 drop-shadow-lg" />
                    <Sparkles className="absolute -bottom-1 -left-3 w-6 h-6 text-orange-400 drop-shadow-lg" />
                    <Star className="absolute top-0 -left-4 w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                  </motion.div>
                </motion.div>

                {/* Text content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.p 
                    className={cn("text-sm font-medium mb-1", categoryTheme.color)}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    🎉 成就解锁！
                  </motion.p>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {currentAchievement.name}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4 px-4">
                    {currentAchievement.description}
                  </p>

                  {/* Category badge */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium",
                      `bg-gradient-to-r ${categoryTheme.gradient} text-white shadow-lg`
                    )}
                  >
                    {categoryTheme.icon}
                    {categoryTheme.label}
                  </motion.div>
                </motion.div>

                {/* Progress indicator for multiple achievements */}
                {unlockedAchievements.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center gap-2 mt-5"
                  >
                    {unlockedAchievements.map((_, idx) => (
                      <motion.div
                        key={idx}
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all",
                          idx === currentIndex 
                            ? `bg-gradient-to-r ${categoryTheme.gradient} scale-125` 
                            : idx < currentIndex 
                              ? 'bg-emerald-400'
                              : 'bg-slate-200'
                        )}
                        animate={idx === currentIndex ? { scale: [1.25, 1.4, 1.25] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-5 flex gap-2 justify-center"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    className="text-xs"
                  >
                    关闭
                  </Button>
                  {currentIndex < unlockedAchievements.length - 1 && (
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className={cn(
                        "text-xs text-white",
                        `bg-gradient-to-r ${categoryTheme.gradient} hover:opacity-90`
                      )}
                    >
                      下一个 ({currentIndex + 1}/{unlockedAchievements.length})
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Enhanced toast-style mini celebration
export function showAchievementToast(achievementKey: string) {
  const achievement = achievements.find(a => a.key === achievementKey);
  if (!achievement) return;

  // Multi-burst confetti
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.75, x: 0.5 },
    colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'],
  });

  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 45,
      origin: { x: 0.2, y: 0.8 },
      colors: ['#fbbf24', '#f97316'],
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 45,
      origin: { x: 0.8, y: 0.8 },
      colors: ['#fbbf24', '#f97316'],
    });
  }, 100);
}
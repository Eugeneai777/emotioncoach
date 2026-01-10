import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Award, X, Sparkles } from 'lucide-react';
import { achievements } from '@/config/awakeningLevelConfig';
import { Button } from '@/components/ui/button';

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

  // Fire confetti on mount
  useEffect(() => {
    if (unlockedAchievements.length > 0) {
      fireConfetti();
    }
  }, [currentIndex]);

  // Auto-advance or close after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < unlockedAchievements.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        handleClose();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentIndex, unlockedAchievements.length]);

  const fireConfetti = () => {
    // Center burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6'],
    });

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#fbbf24', '#f97316'],
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#fbbf24', '#f97316'],
      });
    }, 200);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!currentAchievement || unlockedAchievements.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative mx-4 w-full max-w-sm"
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

            {/* Achievement card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-1 shadow-2xl">
              <div className="rounded-[22px] bg-white p-6 text-center">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-amber-100/50 to-orange-100/50 -z-10" />
                
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                  className="relative mx-auto mb-4"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-5xl">{currentAchievement.icon}</span>
                  </div>
                  
                  {/* Sparkle decorations */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400" />
                    <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-orange-400" />
                  </motion.div>
                </motion.div>

                {/* Text content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm text-amber-600 font-medium mb-1">🎉 成就解锁！</p>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {currentAchievement.name}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    {currentAchievement.description}
                  </p>

                  {/* Category badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full text-amber-700 text-xs font-medium">
                    <Award className="w-3.5 h-3.5" />
                    {currentAchievement.category === 'milestone' && '里程碑成就'}
                    {currentAchievement.category === 'streak' && '连续打卡'}
                    {currentAchievement.category === 'growth' && '成长突破'}
                    {currentAchievement.category === 'social' && '社交影响'}
                  </div>
                </motion.div>

                {/* Progress indicator for multiple achievements */}
                {unlockedAchievements.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center gap-1.5 mt-5"
                  >
                    {unlockedAchievements.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentIndex ? 'bg-amber-500' : 'bg-amber-200'
                        }`}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Tap hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-xs text-muted-foreground/60 mt-4"
                >
                  点击任意处继续
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast-style mini celebration for single achievement
export function showAchievementToast(achievementKey: string) {
  const achievement = achievements.find(a => a.key === achievementKey);
  if (!achievement) return;

  // Fire a small confetti burst
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8, x: 0.5 },
    colors: ['#f59e0b', '#ef4444', '#8b5cf6'],
  });
}

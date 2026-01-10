import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AwakeningLevel } from '@/config/awakeningLevelConfig';
import confetti from 'canvas-confetti';
import { Sparkles, Star, ArrowRight } from 'lucide-react';

interface LevelUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLevel: AwakeningLevel;
  previousLevel?: AwakeningLevel;
}

export const LevelUpDialog = ({ 
  open, 
  onOpenChange, 
  newLevel,
  previousLevel 
}: LevelUpDialogProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      // 延迟显示内容，让动画更流畅
      setTimeout(() => setShowContent(true), 200);
      
      // 触发庆祝动画
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    } else {
      setShowContent(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 rounded-2xl overflow-hidden border border-amber-500/30"
            >
              {/* 顶部装饰 */}
              <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
              
              <div className="p-8 text-center relative">
                {/* 背景光效 */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
                
                {/* 等级图标 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="relative z-10 mb-4"
                >
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <span className="text-5xl">{newLevel.icon}</span>
                  </div>
                  
                  {/* 闪烁星星 */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0"
                  >
                    <Sparkles className="absolute -top-2 right-4 h-6 w-6 text-amber-300" />
                    <Star className="absolute -bottom-1 left-6 h-5 w-5 text-amber-400 fill-amber-400" />
                    <Sparkles className="absolute top-1/2 -left-4 h-4 w-4 text-orange-300" />
                  </motion.div>
                </motion.div>

                {/* 升级文字 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative z-10 space-y-3"
                >
                  <h2 className="text-amber-100 text-lg">恭喜升级！</h2>
                  
                  {/* 等级变化 */}
                  <div className="flex items-center justify-center gap-3 py-2">
                    {previousLevel && (
                      <>
                        <div className="text-center">
                          <div className="text-2xl mb-1">{previousLevel.icon}</div>
                          <div className="text-sm text-slate-400">Lv.{previousLevel.level}</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-amber-400" />
                      </>
                    )}
                    <div className="text-center">
                      <div className="text-3xl mb-1">{newLevel.icon}</div>
                      <div className="text-sm text-amber-400 font-medium">Lv.{newLevel.level}</div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white">{newLevel.name}</h3>
                  <p className="text-slate-300 text-sm">{newLevel.description}</p>
                </motion.div>

                {/* 按钮 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative z-10 mt-6"
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
                    onClick={() => onOpenChange(false)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    继续觉醒之旅
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

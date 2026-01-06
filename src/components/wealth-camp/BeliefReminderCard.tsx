import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoriteBeliefs } from '@/hooks/useFavoriteBeliefs';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface BeliefReminderCardProps {
  campId?: string;
  onDismiss?: () => void;
  className?: string;
}

export function BeliefReminderCard({ campId, onDismiss, className }: BeliefReminderCardProps) {
  const { reminderBeliefs, isLoading } = useFavoriteBeliefs(campId);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || reminderBeliefs.length === 0 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 shadow-lg overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-200/30 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-yellow-200/30 to-transparent rounded-full blur-xl" />
          
          <CardContent className="p-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    今日信念提醒
                  </h3>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                    冥想前，让这些信念陪伴你
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-amber-600 hover:bg-amber-100/50"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Beliefs */}
            <div className="space-y-2">
              {reminderBeliefs.map((belief, index) => (
                <motion.div
                  key={belief.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="flex items-start gap-2 p-3 bg-white/60 dark:bg-white/10 rounded-lg border border-amber-100 dark:border-amber-800/50"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed font-medium">
                    "{belief.belief_text}"
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Affirmation Prompt */}
            <div className="mt-3 text-center">
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 italic">
                ✨ 深呼吸，让这些信念在心中生根 ✨
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

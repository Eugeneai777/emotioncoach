import { motion } from 'framer-motion';
import { Sparkles, Share2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionWitnessCardProps {
  aiWitness: string;
  transitionLabel: string;
  totalCount?: number;
  onShare?: () => void;
  className?: string;
}

const transitionColors: Record<string, { bg: string; text: string; border: string }> = {
  '心穷→心富': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  '匮乏→丰盛': { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  '恐惧→信任': { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  '封闭→开放': { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  '条件→无条件': { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
};

export function ActionWitnessCard({
  aiWitness,
  transitionLabel,
  totalCount,
  onShare,
  className
}: ActionWitnessCardProps) {
  const colors = transitionColors[transitionLabel] || transitionColors['心穷→心富'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-5',
        colors.bg,
        colors.border,
        className
      )}
    >
      {/* Decorative sparkles */}
      <div className="absolute top-3 right-3 opacity-20">
        <Sparkles className="w-12 h-12" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('p-1.5 rounded-lg', colors.bg)}>
          <Sparkles className={cn('w-4 h-4', colors.text)} />
        </div>
        <span className="text-sm font-medium text-muted-foreground">AI 见证</span>
      </div>

      {/* Transition label */}
      <motion.div
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold mb-3',
          colors.bg,
          colors.text,
          'border',
          colors.border
        )}
      >
        <Trophy className="w-3.5 h-3.5" />
        {transitionLabel}
      </motion.div>

      {/* AI witness statement */}
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-base leading-relaxed font-medium text-foreground mb-4"
      >
        "{aiWitness}"
      </motion.p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {totalCount && totalCount > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            🎯 第 <span className="font-semibold text-foreground">{totalCount}</span> 次行为跃迁
          </motion.span>
        )}
        
        {onShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className={cn('gap-1.5', colors.text, 'hover:bg-background/50')}
          >
            <Share2 className="w-4 h-4" />
            分享
          </Button>
        )}
      </div>
    </motion.div>
  );
}

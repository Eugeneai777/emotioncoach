import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sparkles, Star, Bell, BellOff, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoriteBeliefs } from '@/hooks/useFavoriteBeliefs';
import { motion, AnimatePresence } from 'framer-motion';

interface NewBeliefsCollectionProps {
  beliefs: string[];
  campId?: string;
  className?: string;
}

export function NewBeliefsCollection({ beliefs, campId, className }: NewBeliefsCollectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    isFavorited, 
    isReminder, 
    addFavorite, 
    removeFavorite, 
    toggleReminder,
    reminderCount,
    isAddingFavorite,
    isTogglingReminder,
  } = useFavoriteBeliefs(campId);

  if (!beliefs || beliefs.length === 0) return null;

  const handleToggleFavorite = (belief: string) => {
    if (isFavorited(belief)) {
      removeFavorite(belief);
    } else {
      addFavorite({ beliefText: belief });
    }
  };

  const handleToggleReminder = (belief: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFavorited(belief)) {
      // First add to favorites, then set as reminder
      addFavorite({ beliefText: belief });
      // Toggle reminder will be handled after favorite is added
      setTimeout(() => {
        toggleReminder({ beliefText: belief, isReminder: true });
      }, 500);
    } else {
      toggleReminder({ beliefText: belief, isReminder: !isReminder(belief) });
    }
  };

  const displayBeliefs = isExpanded ? beliefs : beliefs.slice(0, 5);

  return (
    <Card className={cn(
      "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 border-green-200 dark:border-green-800 shadow-sm",
      className
    )}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
          <Sparkles className="w-4 h-4" />
          我的新信念收集
          <span className="ml-auto text-xs font-normal text-green-600 dark:text-green-400">
            {beliefs.length}条 · 提醒{reminderCount}/3
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Hint */}
        <p className="text-xs text-green-600/80 dark:text-green-400/80">
          ⭐ 收藏信念 · 🔔 设为每日提醒（最多3条，冥想前展示）
        </p>

        {/* Beliefs List */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayBeliefs.map((belief, index) => {
              const favorited = isFavorited(belief);
              const reminder = isReminder(belief);
              
              return (
                <motion.div
                  key={belief}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-start gap-2 p-2.5 rounded-lg transition-all",
                    reminder 
                      ? "bg-amber-100/70 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"
                      : favorited
                        ? "bg-green-100/70 dark:bg-green-900/30 border border-green-300 dark:border-green-700"
                        : "bg-green-100/50 dark:bg-green-900/20"
                  )}
                >
                  {/* Belief Text */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-relaxed",
                      reminder 
                        ? "text-amber-800 dark:text-amber-200 font-medium"
                        : "text-green-800 dark:text-green-200"
                    )}>
                      {reminder && <Bell className="w-3 h-3 inline mr-1 text-amber-600" />}
                      {belief}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Reminder Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        reminder 
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-200/50"
                          : "text-muted-foreground hover:text-amber-600 hover:bg-amber-100/50"
                      )}
                      onClick={(e) => handleToggleReminder(belief, e)}
                      disabled={isTogglingReminder || (!reminder && reminderCount >= 3)}
                      title={reminder ? "取消每日提醒" : reminderCount >= 3 ? "最多3条提醒" : "设为每日提醒"}
                    >
                      {reminder ? (
                        <Bell className="w-4 h-4 fill-current" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Favorite Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        favorited 
                          ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100/50"
                          : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-100/50"
                      )}
                      onClick={() => handleToggleFavorite(belief)}
                      disabled={isAddingFavorite}
                      title={favorited ? "取消收藏" : "收藏信念"}
                    >
                      <Star className={cn("w-4 h-4", favorited && "fill-current")} />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Expand/Collapse Button */}
        {beliefs.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-green-600 hover:text-green-700 hover:bg-green-100/50"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>收起 <ChevronUp className="w-4 h-4 ml-1" /></>
            ) : (
              <>查看全部 ({beliefs.length}条) <ChevronDown className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

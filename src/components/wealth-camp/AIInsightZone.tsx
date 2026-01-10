import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Lightbulb, Target, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightZoneProps {
  weekNumber?: number;
  focusAreas?: string[];
  adjustmentReason?: string;
  reminderBeliefs?: string[];
  smartNotifications?: Array<{
    id: string;
    message: string;
    type?: string;
  }>;
  className?: string;
}

export function AIInsightZone({
  weekNumber = 1,
  focusAreas = [],
  adjustmentReason,
  reminderBeliefs = [],
  smartNotifications = [],
  className,
}: AIInsightZoneProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = focusAreas.length > 0 || reminderBeliefs.length > 0 || smartNotifications.length > 0;

  if (!hasContent) {
    return null;
  }

  // Collapsed preview
  const previewText = adjustmentReason 
    ? `本周重点: ${focusAreas.slice(0, 2).join('、')}`
    : smartNotifications.length > 0 
      ? smartNotifications[0].message.slice(0, 30) + '...'
      : reminderBeliefs.length > 0
        ? reminderBeliefs[0].slice(0, 30) + '...'
        : 'AI 洞察';

  const notificationCount = (focusAreas.length > 0 ? 1 : 0) + reminderBeliefs.length + smartNotifications.length;

  return (
    <Card className={cn(
      "shadow-sm transition-all duration-300",
      isExpanded 
        ? "bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-violet-200 dark:border-violet-800"
        : "bg-background/80",
      className
    )}>
      <CardContent className="p-0">
        {/* Collapsed Header - Always Visible */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-medium text-sm flex items-center gap-2">
                🤖 AI 今日建议
                {notificationCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                    {notificationCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {previewText}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Weekly Training Focus */}
                {focusAreas.length > 0 && adjustmentReason && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm text-blue-800 dark:text-blue-200">
                        第{weekNumber}周训练重点
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      {adjustmentReason}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {focusAreas.map((area) => (
                        <Badge 
                          key={area} 
                          variant="secondary" 
                          className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Belief Reminders */}
                {reminderBeliefs.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-sm text-amber-800 dark:text-amber-200">
                        收藏的信念提醒
                      </span>
                    </div>
                    <div className="space-y-2">
                      {reminderBeliefs.slice(0, 3).map((belief, index) => (
                        <div 
                          key={index} 
                          className="text-xs text-amber-700 dark:text-amber-300 italic"
                        >
                          "{belief}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart Notifications */}
                {smartNotifications.length > 0 && (
                  <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4 text-violet-600" />
                      <span className="font-medium text-sm text-violet-800 dark:text-violet-200">
                        智能提醒
                      </span>
                    </div>
                    <div className="space-y-2">
                      {smartNotifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="text-xs text-violet-700 dark:text-violet-300"
                        >
                          {notification.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

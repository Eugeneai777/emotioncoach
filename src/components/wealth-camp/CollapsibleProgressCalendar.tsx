import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Flame, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { cardBaseStyles } from '@/config/cardStyleConfig';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { UserCampMode } from '@/hooks/useUserCampMode';

interface CollapsibleProgressCalendarProps {
  userMode: UserCampMode;
  currentDay: number;
  totalDays: number;
  completedDays: number[];
  makeupDays: number[];
  streak: number;
  onMakeupClick: (dayNumber: number) => void;
  activeMakeupDay?: number | null;
  justCompletedDay?: number | null;
  // Post-camp cycle data
  daysSinceGraduation?: number;
  cycleMeditationDay?: number;
  cycleWeek?: number;
  postCampCheckinDates?: string[];
  className?: string;
}

export function CollapsibleProgressCalendar({
  userMode,
  currentDay,
  totalDays,
  completedDays,
  makeupDays,
  streak,
  onMakeupClick,
  activeMakeupDay,
  justCompletedDay,
  daysSinceGraduation = 0,
  cycleMeditationDay = 1,
  cycleWeek = 1,
  postCampCheckinDates = [],
  className,
}: CollapsibleProgressCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMakeupMenu, setShowMakeupMenu] = useState(false);
  const [celebratingDay, setCelebratingDay] = useState<number | null>(null);

  // Handle celebration animation
  useState(() => {
    if (justCompletedDay) {
      setCelebratingDay(justCompletedDay);
      const timer = setTimeout(() => setCelebratingDay(null), 3000);
      return () => clearTimeout(timer);
    }
  });

  const isPostCampMode = userMode === 'graduate' || userMode === 'partner';
  const completedCount = completedDays.length;
  const totalCheckins = isPostCampMode 
    ? completedCount + postCampCheckinDates.length 
    : completedCount;

  // Generate week data for post-camp mode
  const weeksData = useMemo(() => {
    if (!isPostCampMode) return [];
    
    const weeks: Array<{
      weekNumber: number;
      label: string;
      completedCount: number;
      days: Array<{
        dayNumber: number;
        isCompleted: boolean;
        isCurrent: boolean;
        isToday: boolean;
      }>;
    }> = [];
    
    // Week 1: Training camp (always 7 days)
    weeks.push({
      weekNumber: 1,
      label: '训练营',
      completedCount: Math.min(completedDays.length, 7),
      days: Array.from({ length: 7 }, (_, i) => ({
        dayNumber: i + 1,
        isCompleted: completedDays.includes(i + 1),
        isCurrent: false,
        isToday: false,
      })),
    });
    
    // Ensure we always display at least the current week (cycleWeek + 1 represents "post-camp week number")
    // When cycleWeek = 1, we're in the first post-camp week, so display Week 2
    const displayWeeks = Math.max(cycleWeek + 1, 2);
    
    // Post-camp weeks (Week 2 onwards = 持续觉醒)
    for (let w = 2; w <= displayWeeks; w++) {
      const weekDays: typeof weeks[0]['days'] = [];
      const weekStartDayIndex = (w - 2) * 7; // Day index relative to post-graduation (0-indexed)
      
      for (let d = 1; d <= 7; d++) {
        const dayIndex = weekStartDayIndex + d; // 1-indexed day count since graduation
        const isCurrentWeek = w === displayWeeks;
        const isToday = isCurrentWeek && d === cycleMeditationDay;
        
        // Check completion: use postCampCheckinDates length as indicator
        const isCompleted = dayIndex <= postCampCheckinDates.length;
        
        weekDays.push({
          dayNumber: d,
          isCompleted,
          isCurrent: isToday,
          isToday,
        });
      }
      
      weeks.push({
        weekNumber: w,
        label: w === displayWeeks ? '本周' : '持续觉醒',
        completedCount: weekDays.filter(d => d.isCompleted).length,
        days: weekDays,
      });
    }
    
    return weeks;
  }, [isPostCampMode, completedDays, cycleWeek, cycleMeditationDay, postCampCheckinDates]);

  // Generate dots for camp mode
  const campDots = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNumber = i + 1;
      const isCompleted = completedDays.includes(dayNumber);
      const canMakeup = makeupDays.includes(dayNumber);
      const isCurrent = dayNumber === currentDay;
      const isFuture = dayNumber > currentDay;
      const isActiveMakeup = dayNumber === activeMakeupDay;
      const isCelebrating = dayNumber === celebratingDay;

      return {
        dayNumber,
        isCompleted,
        canMakeup,
        isCurrent,
        isFuture,
        isActiveMakeup,
        isCelebrating,
      };
    });
  }, [totalDays, completedDays, makeupDays, currentDay, activeMakeupDay, celebratingDay]);

  const renderDot = (dot: typeof campDots[0], size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    
    return (
      <motion.div
        key={dot.dayNumber}
        animate={dot.isCelebrating ? {
          scale: [1, 1.3, 1.1],
          boxShadow: [
            '0 0 0 0 rgba(34, 197, 94, 0)',
            '0 0 12px 4px rgba(34, 197, 94, 0.6)',
            '0 0 6px 2px rgba(34, 197, 94, 0.3)',
          ]
        } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn(
          sizeClass, "rounded-full transition-all duration-300",
          dot.isCelebrating && "bg-gradient-to-br from-green-400 to-emerald-500 ring-2 ring-green-400 ring-offset-1 ring-offset-background",
          !dot.isCelebrating && dot.isActiveMakeup && "bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-amber-400 ring-offset-1 ring-offset-background animate-pulse",
          !dot.isCelebrating && !dot.isActiveMakeup && dot.isCompleted && "bg-amber-500 dark:bg-amber-400",
          !dot.isCelebrating && !dot.isActiveMakeup && dot.canMakeup && !dot.isCompleted && "border-2 border-dashed border-amber-400 bg-amber-100/50 dark:bg-amber-900/30",
          !dot.isCelebrating && !dot.isActiveMakeup && dot.isCurrent && !dot.isCompleted && !activeMakeupDay && "bg-amber-300 ring-2 ring-amber-500 ring-offset-1 ring-offset-background",
          !dot.isCelebrating && !dot.isActiveMakeup && dot.isCurrent && !dot.isCompleted && activeMakeupDay && "bg-amber-200/60 dark:bg-amber-700/40",
          !dot.isCelebrating && !dot.isActiveMakeup && dot.isFuture && "bg-muted/40",
          !dot.isCelebrating && !dot.isActiveMakeup && !dot.isCompleted && !dot.canMakeup && !dot.isCurrent && !dot.isFuture && "bg-red-200 dark:bg-red-900/40"
        )}
        title={`Day ${dot.dayNumber}`}
      />
    );
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className={className}>
      <div className={cn(
        cardBaseStyles.container,
        "transition-all duration-300",
        activeMakeupDay 
          ? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-amber-300 dark:border-amber-700 shadow-md"
          : "bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/60 dark:border-amber-800/40"
      )}>
        {/* Collapsed Header - Always visible */}
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isPostCampMode ? (
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    持续觉醒 · 第{daysSinceGraduation + 1}天
                  </span>
                ) : (
                  <span className={cn(
                    "text-sm font-medium",
                    activeMakeupDay 
                      ? "text-amber-900 dark:text-amber-100" 
                      : "text-amber-800 dark:text-amber-200"
                  )}>
                    {activeMakeupDay ? `补打 Day ${activeMakeupDay}` : `Day ${currentDay}/${totalDays}`}
                  </span>
                )}
                
                {!activeMakeupDay && (
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-medium">{streak}天连续</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{totalCheckins}次</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-amber-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-amber-600" />
                )}
              </div>
            </div>
            
            {/* Mini dots preview (collapsed state) */}
            {!isExpanded && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {isPostCampMode ? (
                    // Show current week for post-camp
                    Array.from({ length: 7 }, (_, i) => {
                      const dayInWeek = i + 1;
                      const isToday = dayInWeek === cycleMeditationDay;
                      const daysSinceGradStart = (cycleWeek) * 7 + dayInWeek - 7; // Approximate
                      const isCompleted = daysSinceGradStart <= postCampCheckinDates.length && dayInWeek < cycleMeditationDay;
                      
                      return (
                        <div
                          key={i}
                          className={cn(
                            "w-3 h-3 rounded-full transition-all",
                            isCompleted && "bg-amber-500 dark:bg-amber-400",
                            isToday && !isCompleted && "bg-amber-300 ring-2 ring-amber-500 ring-offset-1",
                            !isCompleted && !isToday && "bg-muted/40"
                          )}
                        />
                      );
                    })
                  ) : (
                    campDots.map(dot => renderDot(dot))
                  )}
                </div>
                
                {/* Post-camp hint to expand */}
                {isPostCampMode && (
                  <div className="text-xs text-amber-600/70 dark:text-amber-400/70">
                    第{cycleWeek + 1}周 · 点击查看完整历史
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="px-4 pb-4"
              >
                <div className="border-t border-amber-200 dark:border-amber-800 pt-4 space-y-4">
                  {isPostCampMode ? (
                    // Post-camp: Multi-week view with staggered animations
                    <div className="space-y-3">
                      {weeksData.map((week, weekIndex) => (
                        <motion.div 
                          key={week.weekNumber} 
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: weekIndex * 0.1,
                            ease: 'easeOut'
                          }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-amber-700 dark:text-amber-300">
                              第{week.weekNumber}周（{week.label}）
                            </span>
                            <span className="text-amber-600 dark:text-amber-400">
                              ⭐ {week.completedCount}/7
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {week.days.map((day, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ 
                                  duration: 0.2, 
                                  delay: weekIndex * 0.1 + i * 0.03,
                                  ease: 'easeOut'
                                }}
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                  day.isCompleted && "bg-amber-500 text-white",
                                  day.isToday && !day.isCompleted && "bg-amber-300 ring-2 ring-amber-500 text-amber-800",
                                  !day.isCompleted && !day.isToday && "bg-muted/30 text-muted-foreground"
                                )}
                              >
                                {day.dayNumber}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Stats summary */}
                      <div className="pt-2 border-t border-amber-200/50 dark:border-amber-700/50">
                        <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
                          <span>总打卡：{totalCheckins}次</span>
                          <span>当前连续：{streak}天</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Camp mode: 7-day detailed view
                    <div className="space-y-3">
                      <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                        7天觉醒旅程
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {campDots.map(dot => (
                          <div key={dot.dayNumber} className="flex flex-col items-center gap-1">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                dot.isCompleted && "bg-amber-500 text-white",
                                dot.isCurrent && !dot.isCompleted && !activeMakeupDay && "bg-amber-300 ring-2 ring-amber-500 text-amber-800",
                                dot.isActiveMakeup && "bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-amber-400 animate-pulse",
                                dot.canMakeup && !dot.isCompleted && !dot.isActiveMakeup && "border-2 border-dashed border-amber-400 text-amber-600 cursor-pointer hover:bg-amber-100",
                                dot.isFuture && "bg-muted/30 text-muted-foreground",
                                !dot.isCompleted && !dot.canMakeup && !dot.isCurrent && !dot.isFuture && !dot.isActiveMakeup && "bg-red-100 text-red-400"
                              )}
                              onClick={() => {
                                if (dot.canMakeup && !dot.isCompleted && !dot.isActiveMakeup) {
                                  onMakeupClick(dot.dayNumber);
                                }
                              }}
                            >
                              {dot.dayNumber}
                            </div>
                            {/* Milestone markers */}
                            {[3, 5, 7].includes(dot.dayNumber) && (
                              <span className="text-[10px] text-amber-600/60">
                                {dot.dayNumber === 3 && '行为'}
                                {dot.dayNumber === 5 && '情绪'}
                                {dot.dayNumber === 7 && '信念'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Makeup entry (if has makeup days and not currently making up) */}
                      {!activeMakeupDay && makeupDays.length > 0 && (
                        <div className="pt-2 border-t border-amber-200/50 dark:border-amber-700/50">
                          <DropdownMenu open={showMakeupMenu} onOpenChange={setShowMakeupMenu}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                {makeupDays.length}天待补卡
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                              {makeupDays.map((dayNumber) => (
                                <DropdownMenuItem
                                  key={dayNumber}
                                  onClick={() => {
                                    onMakeupClick(dayNumber);
                                    setShowMakeupMenu(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                                  补打 Day {dayNumber}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

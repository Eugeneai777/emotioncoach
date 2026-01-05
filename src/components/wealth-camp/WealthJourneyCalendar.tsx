import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Check, Star, Sparkles, Calendar, TrendingUp, ChevronRight, Flame, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface JournalEntry {
  id: string;
  day_number: number;
  behavior_type?: string | null;
  emotion_type?: string | null;
  belief_type?: string | null;
  personal_awakening?: unknown;
  new_belief?: string | null;
  created_at: string;
}

interface WealthJourneyCalendarProps {
  startDate: string;
  currentDay: number;
  totalDays: number;
  checkInDates: string[];
  journalEntries: JournalEntry[];
  makeupDaysLimit?: number;
  onDayClick?: (dayNumber: number, dateStr: string, entry?: JournalEntry) => void;
  onMakeupClick?: (dayNumber: number, dateStr: string) => void;
}

// 里程碑配置
const MILESTONES = {
  7: { label: '行为觉醒', icon: '🎯', color: 'from-blue-400 to-cyan-500' },
  14: { label: '情绪觉醒', icon: '💛', color: 'from-amber-400 to-yellow-500' },
  21: { label: '信念觉醒', icon: '✨', color: 'from-purple-400 to-pink-500' },
};

// 根据卡点类型获取觉醒强度（热力图颜色）
const getAwakeningIntensity = (entry?: JournalEntry): number => {
  if (!entry) return 0;
  let intensity = 0;
  if (entry.behavior_type) intensity += 1;
  if (entry.emotion_type) intensity += 1;
  if (entry.belief_type) intensity += 1;
  if (entry.personal_awakening) intensity += 1;
  if (entry.new_belief) intensity += 1;
  return Math.min(intensity, 5); // Max 5 levels
};

// 热力图颜色映射
const getHeatmapColor = (intensity: number): string => {
  const colors = [
    'bg-muted/30', // 0 - 未完成
    'bg-amber-100 dark:bg-amber-900/40', // 1
    'bg-amber-200 dark:bg-amber-800/50', // 2
    'bg-amber-300 dark:bg-amber-700/60', // 3
    'bg-amber-400 dark:bg-amber-600/70', // 4
    'bg-amber-500 dark:bg-amber-500/80', // 5 - 最高强度
  ];
  return colors[intensity] || colors[0];
};

export function WealthJourneyCalendar({
  startDate,
  currentDay,
  totalDays,
  checkInDates,
  journalEntries,
  makeupDaysLimit = 3,
  onDayClick,
  onMakeupClick,
}: WealthJourneyCalendarProps) {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const start = new Date(startDate);

  // 构建日历数据
  const calendarDays = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNumber = i + 1;
      const date = addDays(start, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = journalEntries.find(e => e.day_number === dayNumber);
      // 完整打卡 = 有 behavior_type（教练梳理完成）
      const isCompleted = !!entry?.behavior_type || checkInDates.includes(dateStr);
      const isCurrent = dayNumber === currentDay;
      const isFuture = dayNumber > currentDay;
      const isPast = dayNumber < currentDay;
      // 可补卡 = 过去的天 + 未完成教练梳理 + 在补卡期限内
      const isMissed = isPast && !isCompleted;
      const canMakeup = isPast && !entry?.behavior_type && (currentDay - dayNumber) <= makeupDaysLimit;
      const isMilestone = MILESTONES[dayNumber as keyof typeof MILESTONES];
      const intensity = getAwakeningIntensity(entry);

      return {
        dayNumber,
        date,
        dateStr,
        isCompleted,
        isCurrent,
        isFuture,
        isPast,
        isMissed,
        canMakeup,
        isMilestone,
        entry,
        intensity,
      };
    });
  }, [startDate, currentDay, totalDays, checkInDates, journalEntries, makeupDaysLimit]);

  // 统计数据
  const stats = useMemo(() => {
    const completed = calendarDays.filter(d => d.isCompleted).length;
    const missed = calendarDays.filter(d => d.isMissed).length;
    const streak = calculateStreak(calendarDays, currentDay);
    const avgIntensity = calendarDays.filter(d => d.intensity > 0).length > 0
      ? calendarDays.filter(d => d.intensity > 0).reduce((sum, d) => sum + d.intensity, 0) / calendarDays.filter(d => d.intensity > 0).length
      : 0;
    return { completed, missed, streak, avgIntensity };
  }, [calendarDays, currentDay]);

  const handleDayClick = (day: typeof calendarDays[0]) => {
    if (day.isFuture) return;
    
    setSelectedDay(day.dayNumber === selectedDay ? null : day.dayNumber);
    
    if (day.entry && onDayClick) {
      onDayClick(day.dayNumber, day.dateStr, day.entry);
    }
  };

  const handleViewDetail = (entry: JournalEntry) => {
    navigate(`/wealth-journal/${entry.id}`);
  };

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
          <div className="text-lg font-bold text-amber-600">{stats.completed}</div>
          <div className="text-xs text-muted-foreground">已打卡</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
          <div className="text-lg font-bold text-orange-600 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4" />
            {stats.streak}
          </div>
          <div className="text-xs text-muted-foreground">连续</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
          <div className="text-lg font-bold text-yellow-600">{stats.avgIntensity.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">觉醒强度</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
          <div className="text-lg font-bold text-red-500">{stats.missed}</div>
          <div className="text-xs text-muted-foreground">待补卡</div>
        </div>
      </div>

      {/* 21天旅程地图 */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              21天觉醒旅程
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded bg-amber-100" />
              <span>低</span>
              <span className="w-3 h-3 rounded bg-amber-300" />
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span>高</span>
            </div>
          </div>

          {/* 周标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className="text-xs text-center text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => (
              <motion.div
                key={day.dayNumber}
                whileHover={!day.isFuture ? { scale: 1.1 } : {}}
                whileTap={!day.isFuture ? { scale: 0.95 } : {}}
                className={cn(
                  "aspect-square relative flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer",
                  // 基础热力图颜色
                  day.isCompleted ? getHeatmapColor(day.intensity) : 'bg-muted/20',
                  // 当前天高亮
                  day.isCurrent && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background",
                  // 未来天禁用
                  day.isFuture && "opacity-30 cursor-not-allowed",
                  // 已错过可补卡
                  day.canMakeup && "border-2 border-dashed border-amber-400 animate-pulse",
                  // 已错过不可补卡
                  day.isMissed && !day.canMakeup && "bg-red-100/50 dark:bg-red-900/20",
                  // 选中状态
                  selectedDay === day.dayNumber && "ring-2 ring-primary"
                )}
                onClick={() => handleDayClick(day)}
              >
                {/* 里程碑标记 */}
                {day.isMilestone && (
                  <div className="absolute -top-1 -right-1 z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "w-4 h-4 rounded-full bg-gradient-to-r flex items-center justify-center text-[10px]",
                        day.isMilestone.color
                      )}
                    >
                      <Star className="w-2.5 h-2.5 text-white fill-white" />
                    </motion.div>
                  </div>
                )}

                {/* 完成状态图标 */}
                {day.isCompleted ? (
                  <div className="relative">
                    <span className={cn(
                      day.intensity >= 4 ? "text-white" : "text-amber-700 dark:text-amber-300"
                    )}>
                      {day.dayNumber}
                    </span>
                    <Check className={cn(
                      "absolute -bottom-1 -right-2 w-3 h-3",
                      day.intensity >= 4 ? "text-white" : "text-green-500"
                    )} />
                  </div>
                ) : day.isMissed ? (
                  <div className="relative">
                    <span className="text-red-400">{day.dayNumber}</span>
                    {!day.canMakeup && (
                      <X className="absolute -bottom-1 -right-2 w-3 h-3 text-red-400" />
                    )}
                  </div>
                ) : (
                  <span className={cn(
                    day.isCurrent ? "text-amber-600 font-bold" : "text-muted-foreground"
                  )}>
                    {day.dayNumber}
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* 里程碑说明 */}
          <div className="mt-4 flex justify-between">
            {Object.entries(MILESTONES).map(([day, milestone]) => {
              const dayData = calendarDays.find(d => d.dayNumber === parseInt(day));
              const isReached = dayData?.isCompleted || (currentDay > parseInt(day));
              
              return (
                <div
                  key={day}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-opacity",
                    isReached ? "opacity-100" : "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full bg-gradient-to-r flex items-center justify-center",
                    milestone.color,
                    !isReached && "grayscale"
                  )}>
                    <span className="text-sm">{milestone.icon}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Day {day}</span>
                  <span className="text-xs font-medium">{milestone.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 选中日详情 */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <DayDetailCard
              day={calendarDays.find(d => d.dayNumber === selectedDay)!}
              onViewDetail={handleViewDetail}
              onMakeup={onMakeupClick}
              onClose={() => setSelectedDay(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 计算连续打卡天数
function calculateStreak(days: ReturnType<typeof Array.from<any>>, currentDay: number): number {
  let streak = 0;
  for (let i = currentDay - 1; i >= 0; i--) {
    if (days[i]?.isCompleted) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// 日期详情卡片
interface DayDetailCardProps {
  day: {
    dayNumber: number;
    date: Date;
    dateStr: string;
    isCompleted: boolean;
    isMissed: boolean;
    canMakeup: boolean;
    isMilestone?: { label: string; icon: string; color: string };
    entry?: JournalEntry;
    intensity: number;
  };
  onViewDetail: (entry: JournalEntry) => void;
  onMakeup?: (dayNumber: number, dateStr: string) => void;
  onClose: () => void;
}

function DayDetailCard({ day, onViewDetail, onMakeup, onClose }: DayDetailCardProps) {
  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium flex items-center gap-2">
              {day.isMilestone && <span>{day.isMilestone.icon}</span>}
              Day {day.dayNumber}
              {day.isMilestone && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400">
                  {day.isMilestone.label}
                </span>
              )}
            </h4>
            <p className="text-sm text-muted-foreground">
              {format(day.date, 'M月d日 EEEE', { locale: zhCN })}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 判断逻辑：有完整打卡记录(behavior_type)才显示日记，否则显示补卡 */}
        {day.entry && day.entry.behavior_type ? (
          <div className="space-y-3">
            {/* 卡点类型标签 */}
            <div className="flex flex-wrap gap-1">
              {day.entry.behavior_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  🎯 {day.entry.behavior_type}
                </span>
              )}
              {day.entry.emotion_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400">
                  💛 {day.entry.emotion_type}
                </span>
              )}
              {day.entry.belief_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  💡 {day.entry.belief_type}
                </span>
              )}
            </div>

            {/* 觉醒洞察 */}
            {day.entry.personal_awakening && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
                {typeof day.entry.personal_awakening === 'string' 
                  ? day.entry.personal_awakening 
                  : '已记录觉醒洞察'}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onViewDetail(day.entry!)}
            >
              查看日记详情
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : day.canMakeup ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {day.entry ? '冥想已完成，教练梳理未完成' : '该日未打卡'}，可以补卡
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-amber-400 text-amber-600 hover:bg-amber-50"
              onClick={() => onMakeup?.(day.dayNumber, day.dateStr)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              补打这一天
            </Button>
          </div>
        ) : day.isMissed ? (
          <p className="text-sm text-red-500">
            该日未打卡，已超过补卡期限
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            当日打卡将在此显示
          </p>
        )}
      </CardContent>
    </Card>
  );
}

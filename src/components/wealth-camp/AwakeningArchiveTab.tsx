import { Target, Heart, Brain, Lightbulb, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WealthProgressChart } from './WealthProgressChart';
import { WealthJourneyCalendar } from './WealthJourneyCalendar';
import { ProfileEvolutionCard } from './ProfileEvolutionCard';
import { ActionTrackingStats } from './ActionTrackingStats';
import { ActionCompletionChart } from './ActionCompletionChart';
import { useWealthJournalEntries } from '@/hooks/useWealthJournalEntries';
import { useProfileEvolution } from '@/hooks/useProfileEvolution';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Match WealthProgressChart's expected entry type
interface ChartJournalEntry {
  day_number: number;
  behavior_score: number | null;
  emotion_score: number | null;
  belief_score: number | null;
  created_at: string;
}

interface AwakeningArchiveTabProps {
  campId?: string;
  entries: ChartJournalEntry[];
  onMakeupClick?: (dayNumber: number, dateStr: string) => void;
}

export function AwakeningArchiveTab({ campId, entries, onMakeupClick }: AwakeningArchiveTabProps) {
  const navigate = useNavigate();
  const { stats, entries: fullEntries } = useWealthJournalEntries({ campId });
  const { profile: wealthProfile, evolutionInsight } = useProfileEvolution(campId);

  // Fetch camp data for calendar
  const { data: camp } = useQuery({
    queryKey: ['wealth-camp-for-archive', campId],
    queryFn: async () => {
      if (!campId) return null;
      const { data, error } = await supabase
        .from('training_camps')
        .select('start_date, duration_days, check_in_dates')
        .eq('id', campId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!campId,
  });

  // Calculate current day
  const currentDay = camp?.start_date 
    ? Math.max(1, Math.ceil((Date.now() - new Date(camp.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="text-xl font-semibold mb-2">觉醒之旅即将开始</h2>
        <p className="text-muted-foreground">完成第一天的教练梳理后，这里将展示你的成长轨迹</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Insight Card */}
      <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-amber-100 text-sm">觉醒天数</p>
              <p className="text-4xl font-bold">{stats?.totalDays}<span className="text-lg font-normal">/21天</span></p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
          
          {stats && stats.trendChange !== 0 && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${stats.trendChange > 0 ? 'bg-green-500/30' : 'bg-amber-500/30'}`}>
              <TrendingUp className={`w-5 h-5 ${stats.trendChange > 0 ? 'text-green-200' : 'text-amber-200 rotate-180'}`} />
              <span className="text-sm">
                {stats.trendChange > 0 
                  ? `综合评分提升 ${stats.trendChange.toFixed(1)} 分，觉醒正在发生！`
                  : `当前正在经历调整期，这是觉醒的必经之路`
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Three Dimension Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats?.avgBehavior || '0.0'}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">行为流动</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 mx-auto mb-1 text-pink-600" />
            <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">{stats?.avgEmotion || '0.0'}</p>
            <p className="text-xs text-pink-600 dark:text-pink-400">情绪流动</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4 text-center">
            <Brain className="w-5 h-5 mx-auto mb-1 text-violet-600" />
            <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{stats?.avgBelief || '0.0'}</p>
            <p className="text-xs text-violet-600 dark:text-violet-400">信念松动</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <WealthProgressChart entries={entries} />

      {/* Journey Calendar - 旅程回顾 */}
      {camp && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">21天旅程回顾</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <WealthJourneyCalendar
              startDate={camp.start_date}
              currentDay={currentDay}
              totalDays={camp.duration_days || 21}
              checkInDates={Array.isArray(camp.check_in_dates) ? camp.check_in_dates as string[] : []}
              journalEntries={fullEntries.map(e => ({
                id: e.id,
                day_number: e.day_number,
                behavior_type: e.behavior_block as string | undefined,
                emotion_type: e.emotion_signal as string | undefined,
                belief_type: e.old_belief as string | undefined,
                personal_awakening: (e.behavior_awakening || e.emotion_awakening || e.belief_awakening) as string | undefined,
                new_belief: e.new_belief as string | undefined,
                created_at: e.created_at,
              }))}
              makeupDaysLimit={3}
              onDayClick={(dayNumber, dateStr, entry) => {
                if (entry && (entry as any).behavior_type) {
                  navigate(`/wealth-journal/${entry.id}`);
                }
              }}
              onMakeupClick={onMakeupClick}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Completion Rate Chart */}
      <ActionCompletionChart entries={fullEntries as any} />

      {/* Action Tracking Stats */}
      <ActionTrackingStats entries={fullEntries as any} />

      {/* Core Sticking Points */}
      {stats && (stats.dominantBehavior || stats.dominantEmotion || stats.dominantBelief) && (
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              我的核心卡点画像
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.dominantBehavior && (
              <div className="flex items-start gap-3 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                  🎯
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    行为层：{stats.dominantBehavior.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    出现 {stats.dominantBehavior.count} 次 · 占比 {Math.round(stats.dominantBehavior.count / stats.totalDays * 100)}%
                  </p>
                </div>
              </div>
            )}
            
            {stats.dominantEmotion && (
              <div className="flex items-start gap-3 p-3 bg-pink-100/50 dark:bg-pink-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-600">
                  💛
                </div>
                <div>
                  <p className="font-medium text-pink-800 dark:text-pink-200">
                    情绪层：{stats.dominantEmotion.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    出现 {stats.dominantEmotion.count} 次 · 占比 {Math.round(stats.dominantEmotion.count / stats.totalDays * 100)}%
                  </p>
                </div>
              </div>
            )}
            
            {stats.dominantBelief && (
              <div className="flex items-start gap-3 p-3 bg-violet-100/50 dark:bg-violet-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-600">
                  💡
                </div>
                <div>
                  <p className="font-medium text-violet-800 dark:text-violet-200">
                    信念层：{stats.dominantBelief.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    出现 {stats.dominantBelief.count} 次 · 占比 {Math.round(stats.dominantBelief.count / stats.totalDays * 100)}%
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Beliefs Collection */}
      {stats?.uniqueNewBeliefs && stats.uniqueNewBeliefs.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-800 dark:text-green-200">
              <Sparkles className="w-5 h-5" />
              我的新信念收集
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              这些是你在觉醒旅程中发现的赋能信念
            </p>
            <div className="space-y-2">
              {stats.uniqueNewBeliefs.slice(0, 5).map((belief, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm text-green-800 dark:text-green-200">{belief}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Evolution Card */}
      {wealthProfile && entries.length >= 2 && (
        <ProfileEvolutionCard
          currentProfile={wealthProfile}
          evolutionInsight={evolutionInsight}
        />
      )}
    </div>
  );
}

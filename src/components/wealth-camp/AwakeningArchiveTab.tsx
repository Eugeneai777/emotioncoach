import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WealthProgressChart } from './WealthProgressChart';
import { WealthJourneyCalendar } from './WealthJourneyCalendar';
import { ProfileEvolutionCard } from './ProfileEvolutionCard';
import { ActionTrackingStats } from './ActionTrackingStats';
import { ArchiveHeroCard } from './ArchiveHeroCard';
import { NewBeliefsCollection } from './NewBeliefsCollection';
import { WeeklyComparisonChart } from './WeeklyComparisonChart';
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
    <div className="space-y-4">
      {/* Section 1: Hero Card - 成长概览 */}
      <ArchiveHeroCard
        totalDays={stats?.totalDays || 0}
        maxDays={21}
        avgBehavior={stats?.avgBehavior || '0.0'}
        avgEmotion={stats?.avgEmotion || '0.0'}
        avgBelief={stats?.avgBelief || '0.0'}
        trendChange={stats?.trendChange || 0}
      />

      {/* Section 2: Weekly Comparison - 周维度对比 */}
      <WeeklyComparisonChart entries={entries} />

      {/* Section 3: Deep Insights - Tabs */}
      <Card className="shadow-sm">
        <Tabs defaultValue="chart" className="w-full">
          <CardHeader className="pb-0 pt-3 px-3">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="chart" className="text-xs">成长曲线</TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs">旅程日历</TabsTrigger>
              <TabsTrigger value="action" className="text-xs">行动追踪</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-3 pt-3">
            <TabsContent value="chart" className="mt-0">
              <WealthProgressChart entries={entries} />
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
              {camp ? (
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
                  compact={true}
                  onDayClick={(dayNumber, dateStr, entry) => {
                    if (entry && (entry as any).behavior_type) {
                      navigate(`/wealth-journal/${entry.id}`);
                    }
                  }}
                  onMakeupClick={onMakeupClick}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  加载日历中...
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="action" className="mt-0">
              <ActionTrackingStats entries={fullEntries as any} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Section 4: Growth Imprints - 成长印记 */}
      {/* Profile Evolution Card - 我的财富画像 */}
      {wealthProfile && (
        <ProfileEvolutionCard
          currentProfile={wealthProfile}
          evolutionInsight={evolutionInsight}
          stickingPoints={stats ? {
            dominantBehavior: stats.dominantBehavior,
            dominantEmotion: stats.dominantEmotion,
            dominantBelief: stats.dominantBelief,
            totalDays: stats.totalDays,
          } : undefined}
        />
      )}

      {/* New Beliefs Collection with Favorite/Reminder - 我的新信念收集 */}
      {stats?.uniqueNewBeliefs && stats.uniqueNewBeliefs.length > 0 && (
        <NewBeliefsCollection 
          beliefs={stats.uniqueNewBeliefs} 
          campId={campId}
        />
      )}
    </div>
  );
}

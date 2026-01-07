import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WealthProgressChart } from './WealthProgressChart';
import { WealthJourneyCalendar } from './WealthJourneyCalendar';
import { ProfileEvolutionCard } from './ProfileEvolutionCard';
import { ActionTrackingStats } from './ActionTrackingStats';
import { CompactProgressHeader } from './CompactProgressHeader';
import { NewBeliefsCollection } from './NewBeliefsCollection';
import { WeeklyComparisonChart } from './WeeklyComparisonChart';
import { GrowthComparisonCard } from './GrowthComparisonCard';
import { FourPersonalityCard } from './FourPersonalityCard';
import { ReactionPatternCard } from './ReactionPatternCard';
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
  currentDay: number;
  entries: ChartJournalEntry[];
  onMakeupClick?: (dayNumber: number, dateStr: string) => void;
}

export function AwakeningArchiveTab({ campId, currentDay, entries, onMakeupClick }: AwakeningArchiveTabProps) {
  const navigate = useNavigate();
  const { stats, entries: fullEntries, awakeningIndex } = useWealthJournalEntries({ campId });
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
      {/* 第一层：紧凑进度概览 */}
      <CompactProgressHeader
        currentDay={stats?.totalDays || 0}
        maxDays={21}
        awakeningIndex={awakeningIndex}
        avgBehavior={stats?.avgBehavior}
        avgEmotion={stats?.avgEmotion}
        avgBelief={stats?.avgBelief}
        trendChange={stats?.trendChange || 0}
      />

      {/* 第二层：成长轨迹 - Tab切换查看详情 */}
      <Card className="shadow-sm">
        <Tabs defaultValue="chart" className="w-full">
          <CardHeader className="pb-0 pt-3 px-3">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="chart" className="text-xs">成长曲线</TabsTrigger>
              <TabsTrigger value="assessment" className="text-xs">测评对比</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">周对比</TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs">日历</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-3 pt-3">
            {/* 成长曲线 */}
            <TabsContent value="chart" className="mt-0">
              <WealthProgressChart 
                entries={fullEntries.map(e => ({
                  day_number: e.day_number,
                  behavior_score: e.behavior_score ?? null,
                  emotion_score: e.emotion_score ?? null,
                  belief_score: e.belief_score ?? null,
                  created_at: e.created_at,
                }))} 
                embedded={true}
              />
            </TabsContent>

            {/* 周维度对比 */}
            <TabsContent value="weekly" className="mt-0">
              <WeeklyComparisonChart entries={entries} className="border-0 shadow-none" />
            </TabsContent>
            
            {/* 旅程日历 */}
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

            {/* 测评对比 - Before/After */}
            <TabsContent value="assessment" className="mt-0">
              <GrowthComparisonCard
                campId={campId}
                currentDay={currentDay}
                avgBehavior={stats?.avgBehavior || '0.0'}
                avgEmotion={stats?.avgEmotion || '0.0'}
                avgBelief={stats?.avgBelief || '0.0'}
                dominantBehavior={typeof stats?.dominantBehavior === 'object' ? stats.dominantBehavior.name : stats?.dominantBehavior}
                dominantEmotion={typeof stats?.dominantEmotion === 'object' ? stats.dominantEmotion.name : stats?.dominantEmotion}
                dominantBelief={typeof stats?.dominantBelief === 'object' ? stats.dominantBelief.name : stats?.dominantBelief}
                embedded={true}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* 第三层：成长印记 - 收藏式设计 */}
      <div className="space-y-4">
        {/* 四穷人格画像 */}
        <FourPersonalityCard campId={campId} currentDay={currentDay} />

        {/* 反应模式画像 */}
        <ReactionPatternCard campId={campId} currentDay={currentDay} />

        {/* 我的财富画像 */}
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
            awakeningIndex={awakeningIndex}
          />
        )}

        {/* 我的新信念收集 */}
        {stats?.uniqueNewBeliefs && stats.uniqueNewBeliefs.length > 0 && (
          <NewBeliefsCollection 
            beliefs={stats.uniqueNewBeliefs} 
            campId={campId}
          />
        )}

        {/* 行动追踪统计 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span>🎯</span>
              行动追踪
            </h3>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ActionTrackingStats entries={fullEntries as any} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

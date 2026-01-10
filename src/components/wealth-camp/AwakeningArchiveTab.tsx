import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WealthProgressChart } from './WealthProgressChart';
import { WealthJourneyCalendar } from './WealthJourneyCalendar';
import { ProfileEvolutionCard } from './ProfileEvolutionCard';
import { ActionTrackingStats } from './ActionTrackingStats';
import { JournalHealthGauge } from './JournalHealthGauge';
import { TodayAwakeningSnapshot } from './TodayAwakeningSnapshot';
import { NewBeliefsCollection } from './NewBeliefsCollection';
import { WeeklyComparisonChart } from './WeeklyComparisonChart';
import { GrowthComparisonCard } from './GrowthComparisonCard';
import { FourPersonalityCard } from './FourPersonalityCard';
import { ReactionPatternCard } from './ReactionPatternCard';
import { CampSummaryReport } from './CampSummaryReport';
import { useWealthJournalEntries } from '@/hooks/useWealthJournalEntries';
import { useProfileEvolution } from '@/hooks/useProfileEvolution';
import { useCampSummary } from '@/hooks/useCampSummary';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Loader2 } from 'lucide-react';

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
  const { stats, entries: fullEntries, awakeningIndex, peakIndex, currentAvg } = useWealthJournalEntries({ campId });
  const { profile: wealthProfile, evolutionInsight } = useProfileEvolution(campId);

  // Camp summary - auto-generate for Day 7+ completion
  const { summary: campSummary, loading: summaryLoading, generating, generateSummary } = useCampSummary(
    campId || null,
    currentDay >= 7 && entries.length >= 5 // Auto-generate if Day 7+ and has enough entries
  );

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

  // Fetch user profile for summary display
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-for-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      return data;
    },
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

  // Get latest entry for today's snapshot
  const latestEntry = fullEntries.length > 0 ? fullEntries[fullEntries.length - 1] : null;

  // Calculate consecutive days (simplified - could be enhanced with actual check-in data)
  const consecutiveDays = stats?.totalDays || 0;

  return (
    <div className="space-y-4">
      {/* 7天总结报告入口/展示 */}
      {currentDay >= 7 && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">7天成长报告</h3>
                  <p className="text-xs text-amber-700">
                    {campSummary ? '查看你的完整成长记录' : '生成你的专属成长总结'}
                  </p>
                </div>
              </div>
              {campSummary ? (
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800"
                  onClick={() => navigate(`/partner/graduate?campId=${campId}`)}
                >
                  查看报告
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => generateSummary()}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      生成中
                    </>
                  ) : (
                    '生成报告'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 第一层：统一觉醒仪表盘 - 与测评报告风格一致 */}
      <JournalHealthGauge
        awakeningIndex={awakeningIndex}
        behaviorScore={parseFloat(stats?.avgBehavior || '0')}
        emotionScore={parseFloat(stats?.avgEmotion || '0')}
        beliefScore={parseFloat(stats?.avgBelief || '0')}
        trendChange={stats?.trendChange || 0}
        currentDay={currentDay}
        totalDays={camp?.duration_days || 7}
        consecutiveDays={consecutiveDays}
        peakIndex={peakIndex}
        currentAvg={currentAvg}
      />

      {/* 第二层：今日觉醒快照 */}
      {latestEntry && (
        <TodayAwakeningSnapshot 
          entry={latestEntry} 
          onClick={() => navigate(`/wealth-journal/${latestEntry.id}`)}
        />
      )}

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
                  totalDays={camp.duration_days || 7}
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

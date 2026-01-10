import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WealthProgressChart } from './WealthProgressChart';
import { ActionTrackingStats } from './ActionTrackingStats';
import { GrowthHighlightsCard } from './GrowthHighlightsCard';
import { GameProgressCard } from './GameProgressCard';
import { NewBeliefsCollection } from './NewBeliefsCollection';
import { WeeklyComparisonChart } from './WeeklyComparisonChart';
import { GrowthComparisonCard } from './GrowthComparisonCard';
import { CombinedPersonalityCard } from './CombinedPersonalityCard';
import { JournalTimelineView } from './JournalTimelineView';
import { useWealthJournalEntries } from '@/hooks/useWealthJournalEntries';
import { useCampSummary } from '@/hooks/useCampSummary';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [actionsOpen, setActionsOpen] = useState(false);
  const { stats, entries: fullEntries, awakeningIndex, peakIndex, currentAvg } = useWealthJournalEntries({ campId });
  const { baseline } = useAssessmentBaseline();

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

  // Calculate stats for highlights
  const consecutiveDays = stats?.totalDays || 0;
  const beliefsCount = stats?.uniqueNewBeliefs?.length || 0;
  const givingActionsCount = stats?.givingActions?.length || 0;
  
  // Calculate awakening change from first to latest
  const awakeningChange = awakeningIndex && peakIndex 
    ? Math.round(awakeningIndex - (fullEntries[0]?.behavior_score || 0) * 20)
    : 0;
  
  // Action completion rate (simplified)
  const actionCompletionRate = givingActionsCount > 0 
    ? Math.min(100, Math.round((givingActionsCount / consecutiveDays) * 100)) 
    : 0;

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

      {/* 我的财富觉醒之旅 - 游戏化进度卡片 */}
      <GameProgressCard currentDayNumber={currentDay} streak={consecutiveDays} />

      {/* 成长亮点 - 横向滚动 */}
      <GrowthHighlightsCard
        consecutiveDays={consecutiveDays}
        awakeningChange={awakeningChange}
        beliefsCount={beliefsCount}
        actionCompletionRate={actionCompletionRate}
        givingActionsCount={givingActionsCount}
        peakAwakening={peakIndex}
      />

      {/* 第二层：成长可视化 - Tab切换 */}
      <Card className="shadow-sm">
        <Tabs defaultValue="chart" className="w-full">
          <CardHeader className="pb-0 pt-3 px-3">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="chart" className="text-xs">📈 曲线</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">📅 时间轴</TabsTrigger>
              <TabsTrigger value="assessment" className="text-xs">🔄 对比</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">📊 周报</TabsTrigger>
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
                baseline={baseline ? {
                  behavior_score: baseline.behavior_score,
                  emotion_score: baseline.emotion_score,
                  belief_score: baseline.belief_score,
                } : null}
              />
            </TabsContent>

            {/* 历史日记时间轴 */}
            <TabsContent value="timeline" className="mt-0">
              <JournalTimelineView 
                entries={fullEntries.map(e => ({
                  id: e.id,
                  day_number: e.day_number,
                  behavior_score: e.behavior_score ?? null,
                  emotion_score: e.emotion_score ?? null,
                  belief_score: e.belief_score ?? null,
                  behavior_block: (e.behavior_block as string) || null,
                  emotion_need: (e.emotion_need as string) || null,
                  new_belief: e.new_belief || null,
                  giving_action: e.giving_action || null,
                  personal_awakening: e.personal_awakening as any,
                  created_at: e.created_at,
                }))} 
                baseline={baseline ? {
                  behavior_score: baseline.behavior_score,
                  emotion_score: baseline.emotion_score,
                  belief_score: baseline.belief_score,
                  awakeningStart: baseline.awakeningStart,
                } : null}
                className="border-0 shadow-none"
              />
            </TabsContent>

            {/* 周维度对比 */}
            <TabsContent value="weekly" className="mt-0">
              <WeeklyComparisonChart entries={entries} className="border-0 shadow-none" />
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

      {/* 第三层：成长印记 - 可折叠卡片组 */}
      <div className="space-y-3">
        {/* 财富人格 - 合并四穷+反应模式，默认折叠 */}
        <CombinedPersonalityCard campId={campId} currentDay={currentDay} />

        {/* 信念宝库 - 默认展开 */}
        {stats?.uniqueNewBeliefs && stats.uniqueNewBeliefs.length > 0 && (
          <NewBeliefsCollection 
            beliefs={stats.uniqueNewBeliefs} 
            campId={campId}
          />
        )}

        {/* 行动足迹 - 可折叠 */}
        <Card className="shadow-sm">
          <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 pt-4 px-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span>🎯</span>
                    行动足迹
                  </h3>
                  <div className="flex items-center gap-2">
                    {givingActionsCount > 0 && (
                      <span className="text-xs text-muted-foreground">{givingActionsCount} 次给予</span>
                    )}
                    {actionsOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 border-t">
                <ActionTrackingStats entries={fullEntries as any} />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  );
}

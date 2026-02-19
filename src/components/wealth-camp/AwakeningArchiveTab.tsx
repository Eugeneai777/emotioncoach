import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WealthProgressChart } from './WealthProgressChart';
import { GameProgressCard } from './GameProgressCard';
import { CompactAchievementGrid } from './CompactAchievementGrid';
import { CombinedPersonalityCard } from './CombinedPersonalityCard';
import { useWealthJournalEntries } from '@/hooks/useWealthJournalEntries';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { useCampSummary } from '@/hooks/useCampSummary';
import { Trophy, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
  const { stats, entries: fullEntries, isLoading: entriesLoading } = useWealthJournalEntries({ campId });
  const { baseline } = useAssessmentBaseline(campId);
  const { progress } = useAwakeningProgress();
  const { summary: campSummary } = useCampSummary(campId || null, false);

  const displayEntries = fullEntries.length > 0 ? fullEntries : entries;
  const consecutiveDays = stats?.totalDays || 0;

  if (entriesLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4 animate-pulse">🌱</div>
        <p className="text-muted-foreground">加载成长数据中...</p>
      </div>
    );
  }

  if (!displayEntries || displayEntries.length === 0) {
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
      {/* 毕业成就卡片 */}
      {campSummary && (
        <Card className="shadow-sm overflow-hidden border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-teal-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-800">🎓 训练营毕业证书</h3>
                  <p className="text-xs text-emerald-600/80">
                    {campSummary.generated_at 
                      ? format(new Date(campSummary.generated_at), 'yyyy年M月d日', { locale: zhCN }) + ' 毕业'
                      : '已完成7天训练营'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-600">
                  +{campSummary.awakening_growth || 0}
                </div>
                <div className="text-xs text-emerald-600/70">觉醒成长</div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/partner/graduate')}
              className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              size="sm"
            >
              查看完整报告
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 游戏化进度卡片 */}
      <GameProgressCard currentDayNumber={currentDay} streak={consecutiveDays} />

      {/* 成长曲线 - 直接展示 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-3 px-3">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <span>📈</span> 成长曲线
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
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
            baselineAwakening={progress?.baseline_awakening}
          />
        </CardContent>
      </Card>

      {/* 成就徽章墙 */}
      <CompactAchievementGrid />

      {/* 财富人格 */}
      <CombinedPersonalityCard campId={campId} currentDay={currentDay} />
    </div>
  );
}

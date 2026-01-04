import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function ScoreDisplay({ label, score, color }: { label: string; score?: number; color: string }) {
  if (!score) return null;
  
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i <= score ? `fill-${color}-500 text-${color}-500` : "text-muted-foreground/30"
              )}
              style={{ fill: i <= score ? `var(--${color})` : undefined }}
            />
          ))}
        </div>
        <span className="font-medium">{score}/5</span>
      </div>
    </div>
  );
}

export default function WealthJournalDetail() {
  const { entryId } = useParams();
  const navigate = useNavigate();

  const { data: entry, isLoading } = useQuery({
    queryKey: ['wealth-journal-entry', entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wealth_journal_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!entryId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">日记不存在</p>
        <Button onClick={() => navigate('/wealth-journal')}>返回日记列表</Button>
      </div>
    );
  }

  const avgScore = entry.behavior_score && entry.emotion_score && entry.belief_score
    ? ((entry.behavior_score + entry.emotion_score + entry.belief_score) / 3).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">📖 财富日记 · Day {entry.day_number}</h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(entry.created_at), 'yyyy年M月d日 EEEE', { locale: zhCN })}
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Meditation Reflection */}
        {entry.meditation_reflection && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2 text-base">
                <span>🧘</span> 冥想感受
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 dark:text-blue-300">{entry.meditation_reflection}</p>
            </CardContent>
          </Card>
        )}

        {/* Behavior Block */}
        {entry.behavior_block && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2 text-base">
                <span>🎯</span> 今日行为卡点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 dark:text-amber-300">{entry.behavior_block}</p>
            </CardContent>
          </Card>
        )}

        {/* Emotion Block */}
        {entry.emotion_block && (
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-pink-200 dark:border-pink-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-pink-800 dark:text-pink-200 flex items-center gap-2 text-base">
                <span>💗</span> 今日情绪卡点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-pink-700 dark:text-pink-300">{entry.emotion_block}</p>
            </CardContent>
          </Card>
        )}

        {/* Belief Block */}
        {entry.belief_block && (
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-800 dark:text-violet-200 flex items-center gap-2 text-base">
                <span>🧠</span> 今日信念卡点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-violet-700 dark:text-violet-300">{entry.belief_block}</p>
            </CardContent>
          </Card>
        )}

        {/* Smallest Progress */}
        {entry.smallest_progress && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2 text-base">
                <span>🌱</span> 明日最小进步
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 dark:text-green-300">{entry.smallest_progress}</p>
            </CardContent>
          </Card>
        )}

        {/* Scores */}
        {(entry.behavior_score || entry.emotion_score || entry.belief_score) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span>📊</span> 今日流动度评分
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">行为流动度</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i <= (entry.behavior_score || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{entry.behavior_score}/5</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">情绪流动度</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i <= (entry.emotion_score || 0) ? "fill-pink-500 text-pink-500" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{entry.emotion_score}/5</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">信念松动度</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i <= (entry.belief_score || 0) ? "fill-violet-500 text-violet-500" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{entry.belief_score}/5</span>
                </div>
              </div>
              {avgScore && (
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">综合评分</span>
                  <span className="text-2xl font-bold text-amber-600">{avgScore}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Insight */}
        {entry.ai_insight && Object.keys(entry.ai_insight).length > 0 && (
          <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 border-cyan-200 dark:border-cyan-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-cyan-800 dark:text-cyan-200 flex items-center gap-2 text-base">
                <span>🤖</span> AI 洞察
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyan-700 dark:text-cyan-300">
                {typeof entry.ai_insight === 'object' && 'summary' in entry.ai_insight 
                  ? String(entry.ai_insight.summary)
                  : JSON.stringify(entry.ai_insight)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

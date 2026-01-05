import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Share2, TrendingUp, Lightbulb, Target, Gift, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AiInsight {
  behavior_analysis?: string;
  emotion_analysis?: string;
  belief_analysis?: string;
  overall_insight?: string;
  encouragement?: string;
  trend_insight?: string;
  focus_suggestion?: string;
  summary?: string;
}

interface PersonalAwakening {
  behavior_experience?: string;
  awakening_moment?: string;
  emotion_signal?: string;
  belief_origin?: string;
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

  const aiInsight = entry.ai_insight as AiInsight | null;
  const personalAwakening = entry.personal_awakening as PersonalAwakening | null;
  const responsibilityItems = entry.responsibility_items as string[] | null;

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
        {/* 个人化觉醒回顾卡片 - 核心展示 */}
        {(personalAwakening || entry.old_belief || entry.new_belief || entry.giving_action) && (
          <Card className="bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/30 border-amber-300 dark:border-amber-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2 text-base">
                <span>📖</span> 我的觉醒时刻
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 行为经历 */}
              {personalAwakening?.behavior_experience && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> 行为经历
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">{personalAwakening.behavior_experience}</p>
                </div>
              )}
              
              {/* 觉醒时刻 */}
              {personalAwakening?.awakening_moment && (
                <div className="p-3 bg-gradient-to-r from-amber-200/50 to-yellow-200/50 dark:from-amber-800/30 dark:to-yellow-800/30 rounded-lg border border-amber-300/50">
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">💡 觉醒时刻</p>
                  <p className="text-amber-900 dark:text-amber-100 font-medium">"{personalAwakening.awakening_moment}"</p>
                </div>
              )}
              
              {/* 情绪信号与内心需求 */}
              {(personalAwakening?.emotion_signal || entry.emotion_need) && (
                <div className="p-3 bg-pink-50/50 dark:bg-pink-900/20 rounded-lg">
                  <p className="text-xs text-pink-600 dark:text-pink-400 mb-1">💛 情绪信号</p>
                  {personalAwakening?.emotion_signal && (
                    <p className="text-sm text-pink-800 dark:text-pink-200">{personalAwakening.emotion_signal}</p>
                  )}
                  {entry.emotion_need && (
                    <p className="text-sm text-pink-700 dark:text-pink-300 mt-1 italic">
                      → 内心真正需要的是：{entry.emotion_need}
                    </p>
                  )}
                </div>
              )}
              
              {/* 信念对比 */}
              {(entry.old_belief || entry.new_belief) && (
                <div className="p-3 bg-violet-50/50 dark:bg-violet-900/20 rounded-lg space-y-2">
                  <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">💡 信念转变</p>
                  {entry.belief_source && (
                    <p className="text-xs text-muted-foreground">来源：{entry.belief_source}</p>
                  )}
                  {entry.old_belief && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 shrink-0">❌</span>
                      <p className="text-sm text-muted-foreground line-through">{entry.old_belief}</p>
                    </div>
                  )}
                  {entry.new_belief && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 shrink-0">✅</span>
                      <p className="text-sm text-violet-800 dark:text-violet-200 font-medium">{entry.new_belief}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 责任事项 */}
              {responsibilityItems && responsibilityItems.length > 0 && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">✅ 我能负责的事</p>
                  <div className="space-y-1">
                    {responsibilityItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 给予行动 */}
              {entry.giving_action && (
                <div className="p-3 bg-rose-50/50 dark:bg-rose-900/20 rounded-lg">
                  <p className="text-xs text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                    <Gift className="w-3 h-3" /> 今日给予
                  </p>
                  <p className="text-sm text-rose-800 dark:text-rose-200 font-medium">{entry.giving_action}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              {aiInsight?.behavior_analysis && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 italic">
                  💡 {aiInsight.behavior_analysis}
                </p>
              )}
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
              {aiInsight?.emotion_analysis && (
                <p className="mt-2 text-sm text-pink-600 dark:text-pink-400 italic">
                  💡 {aiInsight.emotion_analysis}
                </p>
              )}
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
              {aiInsight?.belief_analysis && (
                <p className="mt-2 text-sm text-violet-600 dark:text-violet-400 italic">
                  💡 {aiInsight.belief_analysis}
                </p>
              )}
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

        {/* AI Insight - Enhanced Display */}
        {aiInsight && Object.keys(aiInsight).length > 0 && (
          <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 border-cyan-200 dark:border-cyan-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-cyan-800 dark:text-cyan-200 flex items-center gap-2 text-base">
                <span>🤖</span> AI 洞察
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Insight */}
              {aiInsight.overall_insight && (
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-600 mt-1 shrink-0" />
                  <p className="text-cyan-700 dark:text-cyan-300">{aiInsight.overall_insight}</p>
                </div>
              )}

              {/* Trend Insight */}
              {aiInsight.trend_insight && (
                <div className="flex items-start gap-2 bg-cyan-100/50 dark:bg-cyan-900/30 p-3 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-cyan-600 mt-1 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">趋势分析</p>
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">{aiInsight.trend_insight}</p>
                  </div>
                </div>
              )}

              {/* Focus Suggestion */}
              {aiInsight.focus_suggestion && (
                <div className="flex items-start gap-2 bg-cyan-100/50 dark:bg-cyan-900/30 p-3 rounded-lg">
                  <Target className="w-4 h-4 text-cyan-600 mt-1 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">关注建议</p>
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">{aiInsight.focus_suggestion}</p>
                  </div>
                </div>
              )}

              {/* Encouragement */}
              {aiInsight.encouragement && (
                <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 rounded-lg text-center">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    ✨ {aiInsight.encouragement}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

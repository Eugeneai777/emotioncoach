import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Share2, TrendingUp, Lightbulb, Target, Gift, CheckCircle2, Heart, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { JournalLayerCard } from '@/components/wealth-camp/JournalLayerCard';
import { useToast } from '@/hooks/use-toast';

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
  awakening_moment?: string;        // 行为层觉醒 (兼容旧数据)
  behavior_awakening?: string;      // 行为层觉醒 (新字段)
  emotion_signal?: string;
  emotion_awakening?: string;       // 情绪层觉醒 (新字段)
  belief_origin?: string;
  belief_awakening?: string;        // 信念层觉醒 (新字段)
}

export default function WealthJournalDetail() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: `财富日记 · Day ${entry?.day_number}`,
      text: entry?.new_belief 
        ? `今日新信念：${entry.new_belief}` 
        : '我正在参加21天财富觉醒训练营',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "链接已复制",
          description: "可以分享给好友查看",
        });
      }
    } catch (error) {
      // User cancelled or share failed, copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "链接已复制", 
          description: "可以分享给好友查看",
        });
      } catch {
        toast({
          title: "分享失败",
          variant: "destructive",
        });
      }
    }
  };

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

  // 获取各层的觉醒时刻 (兼容新旧字段 + 前端备用生成)
  const behaviorAwakening = personalAwakening?.behavior_awakening || personalAwakening?.awakening_moment;
  
  // 情绪层觉醒：优先用数据库字段，否则生成"如何获得内心需求"的指导
  const emotionAwakening = personalAwakening?.emotion_awakening || 
    (entry.emotion_need ? `原来获得${entry.emotion_need}的方式，不是紧握金钱，而是信任生命的流动` : undefined);
  
  // 信念层觉醒：优先用数据库字段，否则从 old_belief + new_belief 生成
  const beliefAwakening = personalAwakening?.belief_awakening || 
    (entry.old_belief && entry.new_belief 
      ? `原来"${entry.old_belief}"只是过去的保护，现在我可以选择"${entry.new_belief}"`
      : entry.new_belief 
        ? `原来我可以选择相信：${entry.new_belief}` 
        : undefined);

  // 判断各层是否有内容
  const hasBehaviorLayer = entry.behavior_block || personalAwakening?.behavior_experience || behaviorAwakening;
  const hasEmotionLayer = entry.emotion_block || personalAwakening?.emotion_signal || entry.emotion_need || emotionAwakening;
  const hasBeliefLayer = entry.belief_block || entry.old_belief || entry.new_belief || beliefAwakening;
  const hasTransformLayer = (responsibilityItems && responsibilityItems.length > 0) || entry.giving_action || entry.smallest_progress;

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
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* 冥想感受 - 开篇 */}
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

        {/* 第一层：行为层 */}
        {hasBehaviorLayer && (
          <JournalLayerCard
            stepNumber={1}
            title="行为层"
            emoji="🎯"
            colorScheme="amber"
            awakeningMoment={behaviorAwakening}
            awakeningLabel="行为觉醒时刻"
          >
            {/* 行为经历 */}
            {personalAwakening?.behavior_experience && (
              <div className="p-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> 行为经历
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">{personalAwakening.behavior_experience}</p>
              </div>
            )}
            
            {/* 行为卡点 */}
            {entry.behavior_block && (
              <div className="p-3 bg-amber-50/80 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">🔒 行为卡点</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{entry.behavior_block}</p>
              </div>
            )}

          </JournalLayerCard>
        )}

        {/* 第二层：情绪层 */}
        {hasEmotionLayer && (
          <JournalLayerCard
            stepNumber={2}
            title="情绪层"
            emoji="💛"
            colorScheme="pink"
            awakeningMoment={emotionAwakening}
            awakeningLabel="情绪觉醒时刻"
          >
            {/* 情绪卡点 - 放到最上面 */}
            {entry.emotion_block && (
              <div className="p-3 bg-pink-100/50 dark:bg-pink-900/30 rounded-lg">
                <p className="text-xs text-pink-600 dark:text-pink-400 mb-1">🔒 情绪卡点</p>
                <p className="text-sm text-pink-800 dark:text-pink-200">{entry.emotion_block}</p>
              </div>
            )}

            {/* 情绪信号 (原内心真正需要) */}
            {entry.emotion_need && (
              <div className="p-3 bg-pink-50/80 dark:bg-pink-900/20 rounded-lg">
                <p className="text-xs text-pink-600 dark:text-pink-400 mb-1 flex items-center gap-1">
                  <Heart className="w-3 h-3" /> 情绪信号
                </p>
                <p className="text-sm text-pink-700 dark:text-pink-300 font-medium">{entry.emotion_need}</p>
              </div>
            )}
          </JournalLayerCard>
        )}

        {/* 第三层：信念层 */}
        {hasBeliefLayer && (
          <JournalLayerCard
            stepNumber={3}
            title="信念层"
            emoji="🧠"
            colorScheme="violet"
            awakeningMoment={beliefAwakening}
            awakeningLabel="信念觉醒时刻"
          >
            {/* 信念来源 */}
            {entry.belief_source && (
              <div className="p-3 bg-violet-100/50 dark:bg-violet-900/30 rounded-lg">
                <p className="text-xs text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> 信念来源
                </p>
                <p className="text-sm text-violet-800 dark:text-violet-200">{entry.belief_source}</p>
              </div>
            )}
            
            {/* 信念卡点 - 移到信念转变上面 */}
            {entry.belief_block && (
              <div className="p-3 bg-violet-50/80 dark:bg-violet-900/20 rounded-lg">
                <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">🔒 信念卡点</p>
                <p className="text-sm text-violet-700 dark:text-violet-300">{entry.belief_block}</p>
              </div>
            )}

          </JournalLayerCard>
        )}

        {/* 第四层：转化层 */}
        {hasTransformLayer && (
          <JournalLayerCard
            stepNumber={4}
            title="转化层"
            emoji="🌱"
            colorScheme="emerald"
          >
            {/* 责任事项 */}
            {responsibilityItems && responsibilityItems.length > 0 && (
              <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">✅ 我能负责的事</p>
                <div className="space-y-1.5">
                  {responsibilityItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-800 dark:text-emerald-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 给予行动 */}
            {entry.giving_action && (
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                  <Gift className="w-3 h-3" /> 今日给予
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">{entry.giving_action}</p>
              </div>
            )}
            
            {/* 最小进步 */}
            {entry.smallest_progress && (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">🌱 明日最小进步</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{entry.smallest_progress}</p>
              </div>
            )}
          </JournalLayerCard>
        )}

        {/* 流动度评分 */}
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

        {/* AI 洞察 */}
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

import { useNavigate } from 'react-router-dom';
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, Sparkles, BookOpen, Share2, ChevronRight, Calendar, Target, Heart, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { BackfillMemoriesButton } from '@/components/wealth-camp/BackfillMemoriesButton';

interface AwakeningMoment {
  id: string;
  dayNumber: number;
  date: string;
  layer: 'behavior' | 'emotion' | 'belief' | 'action';
  type: string;
  content: string;
  subContent?: string;
}

interface LayerConfig {
  key: 'behavior' | 'emotion' | 'belief' | 'action';
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const layerConfigs: LayerConfig[] = [
  { key: 'behavior', label: '行为觉醒', icon: <Target className="w-4 h-4" />, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-200 dark:border-amber-800' },
  { key: 'emotion', label: '情绪觉醒', icon: <Heart className="w-4 h-4" />, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950/30', borderColor: 'border-pink-200 dark:border-pink-800' },
  { key: 'belief', label: '信念觉醒', icon: <Brain className="w-4 h-4" />, color: 'text-violet-600', bgColor: 'bg-violet-50 dark:bg-violet-950/30', borderColor: 'border-violet-200 dark:border-violet-800' },
  { key: 'action', label: '行动转化', icon: <Zap className="w-4 h-4" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-800' },
];

const behaviorTypeNames: Record<string, string> = {
  mouth: '嘴穷', hand: '手穷', eye: '眼穷', heart: '心穷',
};

const emotionTypeNames: Record<string, string> = {
  anxiety: '金钱焦虑', scarcity: '匮乏恐惧', comparison: '比较自卑', shame: '羞耻厌恶', guilt: '消费内疚',
};

const beliefTypeNames: Record<string, string> = {
  lack: '匮乏感', linear: '线性思维', stigma: '金钱污名', unworthy: '不配得感', relationship: '关系恐惧',
};

export default function WealthAwakeningArchive() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['wealth-journal-archive'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wealth_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('day_number', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // 解析觉醒时刻
  const awakeningMoments = useMemo<AwakeningMoment[]>(() => {
    if (!entries) return [];
    
    const moments: AwakeningMoment[] = [];
    
    entries.forEach(entry => {
      const date = format(new Date(entry.created_at), 'M月d日', { locale: zhCN });
      const personalAwakening = entry.personal_awakening as Record<string, string> | null;
      
      // 行为层觉醒
      if (entry.behavior_type || entry.responsibility_items?.length > 0) {
        moments.push({
          id: `${entry.id}-behavior`,
          dayNumber: entry.day_number,
          date,
          layer: 'behavior',
          type: behaviorTypeNames[entry.behavior_type] || entry.behavior_type || '行为觉察',
          content: personalAwakening?.behavior || 
            (entry.responsibility_items?.length > 0 ? `发现可负责事项：${entry.responsibility_items[0]}` : `识别到${behaviorTypeNames[entry.behavior_type] || '行为'}模式`),
          subContent: entry.responsibility_items?.join('、'),
        });
      }
      
      // 情绪层觉醒
      if (entry.emotion_type || entry.emotion_need) {
        moments.push({
          id: `${entry.id}-emotion`,
          dayNumber: entry.day_number,
          date,
          layer: 'emotion',
          type: emotionTypeNames[entry.emotion_type] || entry.emotion_type || '情绪觉察',
          content: personalAwakening?.emotion || 
            (entry.emotion_need ? `内心需要：${entry.emotion_need}` : `感受到${emotionTypeNames[entry.emotion_type] || '情绪'}信号`),
          subContent: entry.emotion_need,
        });
      }
      
      // 信念层觉醒
      if (entry.belief_type || entry.new_belief) {
        moments.push({
          id: `${entry.id}-belief`,
          dayNumber: entry.day_number,
          date,
          layer: 'belief',
          type: beliefTypeNames[entry.belief_type] || entry.belief_type || '信念转化',
          content: personalAwakening?.belief || 
            (entry.new_belief ? `新信念：${entry.new_belief}` : `松动了${beliefTypeNames[entry.belief_type] || '旧'}信念`),
          subContent: entry.old_belief ? `旧信念：${entry.old_belief}` : undefined,
        });
      }
      
      // 行动转化
      if (entry.giving_action || entry.smallest_progress) {
        moments.push({
          id: `${entry.id}-action`,
          dayNumber: entry.day_number,
          date,
          layer: 'action',
          type: entry.giving_action ? '给予行动' : '最小进步',
          content: entry.giving_action || entry.smallest_progress || '',
          subContent: entry.action_reflection,
        });
      }
    });
    
    return moments;
  }, [entries]);

  // 按层筛选
  const filteredMoments = useMemo(() => {
    if (activeTab === 'all') return awakeningMoments;
    return awakeningMoments.filter(m => m.layer === activeTab);
  }, [awakeningMoments, activeTab]);

  // 按天分组
  const groupedByDay = useMemo(() => {
    const groups: Record<number, AwakeningMoment[]> = {};
    filteredMoments.forEach(m => {
      if (!groups[m.dayNumber]) groups[m.dayNumber] = [];
      groups[m.dayNumber].push(m);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([day, moments]) => ({ day: Number(day), moments }));
  }, [filteredMoments]);

  // 里程碑洞察
  const milestones = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    const insights: { week: number; insight: string; icon: string }[] = [];
    
    // 第一周里程碑
    const week1Entries = entries.filter(e => e.day_number <= 7);
    if (week1Entries.length >= 3) {
      const dominantEmotion = week1Entries
        .filter(e => e.emotion_type)
        .reduce((acc: Record<string, number>, e) => {
          acc[e.emotion_type] = (acc[e.emotion_type] || 0) + 1;
          return acc;
        }, {});
      const topEmotion = Object.entries(dominantEmotion).sort((a, b) => b[1] - a[1])[0];
      if (topEmotion) {
        insights.push({
          week: 1,
          insight: `你发现了核心情绪模式：${emotionTypeNames[topEmotion[0]] || topEmotion[0]}`,
          icon: '🔍',
        });
      }
    }
    
    // 第二周里程碑
    const week2Entries = entries.filter(e => e.day_number > 7 && e.day_number <= 14);
    if (week2Entries.length >= 3) {
      const newBeliefs = week2Entries.filter(e => e.new_belief).length;
      if (newBeliefs >= 2) {
        insights.push({
          week: 2,
          insight: `你成功转化了 ${newBeliefs} 个限制性信念`,
          icon: '✨',
        });
      }
    }
    
    // 第三周里程碑
    const week3Entries = entries.filter(e => e.day_number > 14);
    if (week3Entries.length >= 3) {
      const givingActions = week3Entries.filter(e => e.giving_action).length;
      if (givingActions >= 2) {
        insights.push({
          week: 3,
          insight: `你完成了 ${givingActions} 次给予行动，财富能量开始流动`,
          icon: '🌟',
        });
      }
    }
    
    return insights;
  }, [entries]);

  const handleShare = () => {
    toast.success('财富觉醒分享功能即将上线');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">📚 财富觉醒</h1>
          </div>
        </div>
        <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-xl font-semibold mb-2">你的财富觉醒正在书写</h2>
          <p className="text-muted-foreground mb-6">完成教练对话后，这里将收录你的每一个觉醒时刻</p>
          <Button onClick={() => navigate('/wealth-camp-checkin')}>
            开始今日觉醒
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20">
      <DynamicOGMeta pageKey="wealthAwakeningArchive" />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              财富觉醒
            </h1>
            <p className="text-xs text-muted-foreground">你的专属成长记录</p>
          </div>
          <BackfillMemoriesButton />
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            分享
          </Button>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 总览卡片 */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">觉醒时刻</p>
                <p className="text-4xl font-bold">{awakeningMoments.length}<span className="text-lg font-normal">个</span></p>
                <p className="text-amber-100 text-sm mt-1">
                  来自 {entries.length} 天的觉醒旅程
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                ✨
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 里程碑洞察 */}
        {milestones.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                觉醒里程碑
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg"
                >
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">第 {m.week} 周</p>
                    <p className="text-sm font-medium">{m.insight}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 层次筛选 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">全部</TabsTrigger>
            {layerConfigs.map(config => (
              <TabsTrigger key={config.key} value={config.key} className="flex-1 text-xs">
                {config.label.slice(0, 2)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 时间线 */}
        <div className="space-y-6">
          {groupedByDay.map(({ day, moments }) => (
            <div key={day} className="relative">
              {/* 日期标签 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold">第 {day} 天</p>
                  <p className="text-xs text-muted-foreground">{moments[0]?.date}</p>
                </div>
              </div>

              {/* 觉醒卡片 */}
              <div className="ml-4 pl-6 border-l-2 border-amber-200 dark:border-amber-800 space-y-3">
                {moments.map((moment, index) => {
                  const config = layerConfigs.find(c => c.key === moment.layer)!;
                  return (
                    <motion.div
                      key={moment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`${config.bgColor} ${config.borderColor}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center ${config.color}`}>
                              {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                                {moment.type && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20">
                                    {moment.type}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm">{moment.content}</p>
                              {moment.subContent && (
                                <p className="text-xs text-muted-foreground mt-1">{moment.subContent}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              每一个觉醒时刻都是你成长的印记
            </p>
            <Button
              variant="link"
              className="text-amber-600 mt-2"
              onClick={() => navigate('/wealth-awakening-progress')}
            >
              查看完整进度分析 <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

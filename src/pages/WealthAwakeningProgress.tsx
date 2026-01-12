import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet";
import { ArrowLeft, TrendingUp, Sparkles, Target, Heart, Brain, Lightbulb, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
const behaviorTypeNames: Record<string, string> = {
  mouth: '嘴穷',
  hand: '手穷',
  eye: '眼穷',
  heart: '心穷',
};

const emotionTypeNames: Record<string, string> = {
  anxiety: '金钱焦虑',
  scarcity: '匮乏恐惧',
  comparison: '比较自卑',
  shame: '羞耻厌恶',
  guilt: '消费内疚',
};

const beliefTypeNames: Record<string, string> = {
  lack: '匮乏感',
  linear: '线性思维',
  stigma: '金钱污名',
  unworthy: '不配得感',
  relationship: '关系恐惧',
};

const newBeliefMap: Record<string, string> = {
  lack: '钱是流动的能量，流出去也会流回来',
  linear: '财富可以轻松流向我',
  stigma: '财富让我创造更多价值',
  unworthy: '我值得拥有丰盛',
  relationship: '财富让我更有能力爱人',
};

export default function WealthAwakeningProgress() {
  const navigate = useNavigate();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['wealth-journal-all-entries'],
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

  // 计算统计数据
  const stats = useMemo(() => {
    if (!entries || entries.length === 0) return null;

    const totalDays = entries.length;
    const avgBehavior = entries.reduce((sum, e) => sum + (e.behavior_score || 0), 0) / totalDays;
    const avgEmotion = entries.reduce((sum, e) => sum + (e.emotion_score || 0), 0) / totalDays;
    const avgBelief = entries.reduce((sum, e) => sum + (e.belief_score || 0), 0) / totalDays;

    // 统计卡点类型分布
    const behaviorTypes: Record<string, number> = {};
    const emotionTypes: Record<string, number> = {};
    const beliefTypes: Record<string, number> = {};

    entries.forEach(e => {
      if (e.behavior_type) behaviorTypes[e.behavior_type] = (behaviorTypes[e.behavior_type] || 0) + 1;
      if (e.emotion_type) emotionTypes[e.emotion_type] = (emotionTypes[e.emotion_type] || 0) + 1;
      if (e.belief_type) beliefTypes[e.belief_type] = (beliefTypes[e.belief_type] || 0) + 1;
    });

    // 找出最常见的卡点
    const dominantBehavior = Object.entries(behaviorTypes).sort((a, b) => b[1] - a[1])[0];
    const dominantEmotion = Object.entries(emotionTypes).sort((a, b) => b[1] - a[1])[0];
    const dominantBelief = Object.entries(beliefTypes).sort((a, b) => b[1] - a[1])[0];

    // 计算趋势（前7天 vs 后7天）
    const firstWeek = entries.slice(0, Math.min(7, entries.length));
    const lastWeek = entries.slice(-Math.min(7, entries.length));
    
    const firstWeekAvg = firstWeek.reduce((sum, e) => sum + ((e.behavior_score || 0) + (e.emotion_score || 0) + (e.belief_score || 0)) / 3, 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, e) => sum + ((e.behavior_score || 0) + (e.emotion_score || 0) + (e.belief_score || 0)) / 3, 0) / lastWeek.length;
    const trendChange = lastWeekAvg - firstWeekAvg;

    // 收集新信念
    const newBeliefs = entries.filter(e => e.new_belief).map(e => e.new_belief);
    const uniqueNewBeliefs = [...new Set(newBeliefs)];

    // 收集给予行动
    const givingActions = entries.filter(e => e.giving_action).map(e => e.giving_action);

    return {
      totalDays,
      avgBehavior: avgBehavior.toFixed(1),
      avgEmotion: avgEmotion.toFixed(1),
      avgBelief: avgBelief.toFixed(1),
      dominantBehavior: dominantBehavior ? { type: dominantBehavior[0], count: dominantBehavior[1] } : null,
      dominantEmotion: dominantEmotion ? { type: dominantEmotion[0], count: dominantEmotion[1] } : null,
      dominantBelief: dominantBelief ? { type: dominantBelief[0], count: dominantBelief[1] } : null,
      trendChange,
      uniqueNewBeliefs,
      givingActions,
      behaviorTypes,
      emotionTypes,
      beliefTypes,
    };
  }, [entries]);

  // 图表数据
  const chartData = useMemo(() => {
    if (!entries) return [];
    return entries.map(e => ({
      day: `D${e.day_number}`,
      dayNumber: e.day_number,
      行为流动度: e.behavior_score || 0,
      情绪流动度: e.emotion_score || 0,
      信念松动度: e.belief_score || 0,
      综合: ((e.behavior_score || 0) + (e.emotion_score || 0) + (e.belief_score || 0)) / 3,
    }));
  }, [entries]);

  // 雷达图数据
  const radarData = useMemo(() => {
    if (!stats) return [];
    return [
      { dimension: '行为流动', value: parseFloat(stats.avgBehavior), fullMark: 5 },
      { dimension: '情绪流动', value: parseFloat(stats.avgEmotion), fullMark: 5 },
      { dimension: '信念松动', value: parseFloat(stats.avgBelief), fullMark: 5 },
    ];
  }, [stats]);

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
            <h1 className="font-semibold">✨ 财富觉醒进度</h1>
          </div>
        </div>
        <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold mb-2">觉醒之旅即将开始</h2>
          <p className="text-muted-foreground mb-6">完成第一天的教练梳理后，这里将展示你的成长轨迹</p>
          <Button onClick={() => navigate('/wealth-camp-checkin')}>
            开始今日打卡
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20">
      <Helmet>
        <title>财富觉醒进度 - 有劲AI</title>
        <meta name="description" content="追踪你的7天财富觉醒之旅" />
        <meta property="og:title" content="有劲AI • 觉醒进度" />
        <meta property="og:description" content="7天信念转变，见证财富觉醒的每一步成长" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/wealth-awakening-progress" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">✨ 财富觉醒进度</h1>
            <p className="text-xs text-muted-foreground">7天信念转变追踪</p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 核心洞察卡片 */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-amber-100 text-sm">觉醒天数</p>
                <p className="text-4xl font-bold">{stats?.totalDays}<span className="text-lg font-normal">/7天</span></p>
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

        {/* 三维度平均分 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold text-amber-700">{stats?.avgBehavior}</p>
              <p className="text-xs text-amber-600">行为流动</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 border-pink-200 dark:border-pink-800">
            <CardContent className="p-4 text-center">
              <Heart className="w-5 h-5 mx-auto mb-1 text-pink-600" />
              <p className="text-2xl font-bold text-pink-700">{stats?.avgEmotion}</p>
              <p className="text-xs text-pink-600">情绪流动</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 border-violet-200 dark:border-violet-800">
            <CardContent className="p-4 text-center">
              <Brain className="w-5 h-5 mx-auto mb-1 text-violet-600" />
              <p className="text-2xl font-bold text-violet-700">{stats?.avgBelief}</p>
              <p className="text-xs text-violet-600">信念松动</p>
            </CardContent>
          </Card>
        </div>

        {/* 成长曲线图 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              21天觉醒曲线
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="综合" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* 三维度折线图 */}
            <ResponsiveContainer width="100%" height={150} className="mt-4">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line type="monotone" dataKey="行为流动度" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="情绪流动度" stroke="#ec4899" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="信念松动度" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>行为</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span>情绪</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span>信念</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主导卡点发现 */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              我的核心卡点画像
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.dominantBehavior && (
              <div className="flex items-start gap-3 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                  🎯
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    行为层：{behaviorTypeNames[stats.dominantBehavior.type] || stats.dominantBehavior.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    出现 {stats.dominantBehavior.count} 次 · 占比 {Math.round(stats.dominantBehavior.count / stats.totalDays * 100)}%
                  </p>
                </div>
              </div>
            )}
            
            {stats?.dominantEmotion && (
              <div className="flex items-start gap-3 p-3 bg-pink-100/50 dark:bg-pink-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-600">
                  💛
                </div>
                <div>
                  <p className="font-medium text-pink-800 dark:text-pink-200">
                    情绪层：{emotionTypeNames[stats.dominantEmotion.type] || stats.dominantEmotion.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    出现 {stats.dominantEmotion.count} 次 · 占比 {Math.round(stats.dominantEmotion.count / stats.totalDays * 100)}%
                  </p>
                </div>
              </div>
            )}
            
            {stats?.dominantBelief && (
              <div className="flex items-start gap-3 p-3 bg-violet-100/50 dark:bg-violet-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-600">
                  💡
                </div>
                <div>
                  <p className="font-medium text-violet-800 dark:text-violet-200">
                    信念层：{beliefTypeNames[stats.dominantBelief.type] || stats.dominantBelief.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    出现 {stats.dominantBelief.count} 次 · 占比 {Math.round(stats.dominantBelief.count / stats.totalDays * 100)}%
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 信念转变轨迹 */}
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
              
              {/* 推荐的新信念（基于主导信念类型） */}
              {stats.dominantBelief && newBeliefMap[stats.dominantBelief.type] && (
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">💡 今日推荐信念</p>
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    "{newBeliefMap[stats.dominantBelief.type]}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 给予行动记录 */}
        {stats?.givingActions && stats.givingActions.length > 0 && (
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 border-rose-200 dark:border-rose-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-rose-800 dark:text-rose-200">
                <Gift className="w-5 h-5" />
                我的给予足迹
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                财富流动从给予开始，你已经给予了 {stats.givingActions.length} 次
              </p>
              <div className="space-y-2">
                {stats.givingActions.slice(-5).map((action, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-rose-100/50 dark:bg-rose-900/20 rounded-lg">
                    <span className="text-rose-600">🎁</span>
                    <span className="text-sm text-rose-800 dark:text-rose-200">{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 查看详细日记入口 */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/wealth-journal')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                📖
              </div>
              <div>
                <p className="font-medium">查看完整日记</p>
                <p className="text-sm text-muted-foreground">回顾每一天的觉醒细节</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
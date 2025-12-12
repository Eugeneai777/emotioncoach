import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmotionAnalytics } from '@/hooks/useEmotionAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Brain, Heart, Zap, Target, TrendingUp, Calendar, Activity } from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export const EmotionAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const { analytics, loading } = useEmotionAnalytics(timeRange);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-12 text-center text-muted-foreground">
          暂无数据，开始你的第一次情绪对话吧 🌿
        </CardContent>
      </Card>
    );
  }

  const { totalSessions, totalBriefings, topEmotions, topNeeds, topReactions, topActions, emotionTrend, avgIntensity } = analytics;

  // 没有足够数据时的提示
  if (totalBriefings === 0 && topEmotions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-teal-50/50 to-cyan-50/50">
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            完成几次情绪对话后，这里会显示你的情绪分析 📊
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 时间范围选择 */}
      <div className="flex justify-end">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="week" className="text-xs">近7天</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">近30天</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">全部</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 概览统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="对话次数"
          value={totalSessions}
          color="bg-teal-500"
        />
        <StatCard
          icon={<Heart className="w-4 h-4" />}
          label="情绪简报"
          value={totalBriefings}
          color="bg-cyan-500"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="平均强度"
          value={avgIntensity ? `${avgIntensity}/10` : '-'}
          color="bg-amber-500"
        />
        <StatCard
          icon={<Target className="w-4 h-4" />}
          label="识别情绪"
          value={topEmotions.length}
          color="bg-purple-500"
        />
      </div>

      {/* 情绪分布 */}
      {topEmotions.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              最常见的情绪
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* 条形图 */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topEmotions.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={60}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}次`, '出现次数']}
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {topEmotions.slice(0, 6).map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* 标签列表 */}
              <div className="flex flex-wrap gap-2 content-start">
                {topEmotions.map((emotion, index) => (
                  <span
                    key={emotion.name}
                    className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {emotion.name} ({emotion.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 需求分析 */}
      {topNeeds.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              情绪背后的需求
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* 饼图 */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topNeeds}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {topNeeds.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}次`, '出现次数']}
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* 需求列表 */}
              <div className="space-y-2">
                {topNeeds.map((need, index) => (
                  <div key={need.name} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm flex-1 truncate">{need.name}</span>
                    <span className="text-xs text-muted-foreground">{need.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 反应模式 & 行动选择 */}
      <div className="grid md:grid-cols-2 gap-4">
        {topReactions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                习惯性反应
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topReactions.map((reaction, index) => (
                  <div key={reaction.name} className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${reaction.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 truncate">
                      {reaction.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {topActions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                常选的行动
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topActions.map((action, index) => (
                  <div key={action.name} className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${action.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 truncate">
                      {action.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 情绪趋势 */}
      {emotionTrend.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-500" />
              情绪记录趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emotionTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.slice(5)} // 只显示月-日
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value}次`, '记录次数']}
                    labelFormatter={(label) => `日期: ${label}`}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// 统计卡片组件
const StatCard = ({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string; 
  color: string;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-md ${color} text-white`}>
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

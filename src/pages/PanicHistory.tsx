import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Clock, MessageCircle, TrendingDown, Calendar } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface PanicSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  reminders_viewed: number;
  cycles_completed: number;
  breathing_completed: boolean;
  outcome: string | null;
}

const PanicHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['panic-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('panic_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data as PanicSession[];
    },
    enabled: !!user?.id
  });

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.outcome === 'feel_better').length;
    const avgDuration = sessions
      .filter(s => s.duration_seconds)
      .reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / Math.max(1, sessions.filter(s => s.duration_seconds).length);
    const avgReminders = sessions.reduce((sum, s) => sum + s.reminders_viewed, 0) / totalSessions;
    const successRate = (completedSessions / totalSessions) * 100;

    return {
      totalSessions,
      completedSessions,
      avgDuration: Math.round(avgDuration),
      avgReminders: Math.round(avgReminders * 10) / 10,
      successRate: Math.round(successRate)
    };
  }, [sessions]);

  // 生成过去14天的频率数据
  const frequencyData = React.useMemo(() => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const count = sessions.filter(s => {
        const sessionDate = new Date(s.started_at);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      }).length;

      data.push({
        date: format(date, 'MM/dd'),
        count,
        fullDate: format(date, 'M月d日', { locale: zhCN })
      });
    }
    return data;
  }, [sessions]);

  // 按时段分布数据
  const hourlyData = React.useMemo(() => {
    const hours: { [key: string]: number } = {
      '凌晨(0-6)': 0,
      '上午(6-12)': 0,
      '下午(12-18)': 0,
      '晚上(18-24)': 0
    };

    sessions.forEach(s => {
      const hour = new Date(s.started_at).getHours();
      if (hour < 6) hours['凌晨(0-6)']++;
      else if (hour < 12) hours['上午(6-12)']++;
      else if (hour < 18) hours['下午(12-18)']++;
      else hours['晚上(18-24)']++;
    });

    return Object.entries(hours).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const getOutcomeLabel = (outcome: string | null) => {
    switch (outcome) {
      case 'feel_better': return '好转';
      case 'continued': return '继续练习';
      case 'exited': return '提前退出';
      default: return '未完成';
    }
  };

  const getOutcomeColor = (outcome: string | null) => {
    switch (outcome) {
      case 'feel_better': return 'text-emerald-600 bg-emerald-100';
      case 'continued': return 'text-teal-600 bg-teal-100';
      case 'exited': return 'text-amber-600 bg-amber-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-teal-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">请先登录查看历史记录</p>
            <Button onClick={() => navigate('/auth')}>去登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">历史分析</h1>
              <p className="text-sm text-slate-500">追踪你的缓解进展 🌊</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Shield className="w-16 h-16 text-teal-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">暂无记录</h3>
              <p className="text-slate-500 mb-6">使用恐慌按钮后，这里会显示你的记录和分析</p>
              <Button onClick={() => navigate('/energy-studio')} variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                前往恐慌按钮
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 统计卡片 */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/80">
                  <CardContent className="pt-4 text-center">
                    <div className="text-3xl font-bold text-teal-600">{stats.totalSessions}</div>
                    <div className="text-sm text-slate-500">总使用次数</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/80">
                  <CardContent className="pt-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600">{stats.successRate}%</div>
                    <div className="text-sm text-slate-500">好转率</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/80">
                  <CardContent className="pt-4 text-center">
                    <div className="text-3xl font-bold text-cyan-600">{formatDuration(stats.avgDuration)}</div>
                    <div className="text-sm text-slate-500">平均时长</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/80">
                  <CardContent className="pt-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.avgReminders}</div>
                    <div className="text-sm text-slate-500">平均提醒数</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 频率趋势图 */}
            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-teal-500" />
                  过去14天频率
                </CardTitle>
                <CardDescription>追踪发生频率的变化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={frequencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 rounded shadow-lg border">
                                <p className="text-sm font-medium">{payload[0].payload.fullDate}</p>
                                <p className="text-sm text-teal-600">{payload[0].value} 次</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#14b8a6" 
                        strokeWidth={2}
                        dot={{ fill: '#14b8a6', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 时段分布图 */}
            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-500" />
                  发生时段分布
                </CardTitle>
                <CardDescription>了解易发时段</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 历史记录列表 */}
            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-500" />
                  历史记录
                </CardTitle>
                <CardDescription>查看每次缓解的详情</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 20).map((session) => (
                    <div 
                      key={session.id} 
                      className="flex items-center justify-between p-3 bg-teal-50/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {format(new Date(session.started_at), 'M月d日 HH:mm', { locale: zhCN })}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getOutcomeColor(session.outcome)}`}>
                            {getOutcomeLabel(session.outcome)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.duration_seconds)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {session.reminders_viewed} 条提醒
                          </span>
                          {session.breathing_completed && (
                            <span className="text-emerald-600">完成呼吸</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sessions.length > 20 && (
                    <p className="text-center text-sm text-slate-500 pt-2">
                      仅显示最近20条记录
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default PanicHistory;

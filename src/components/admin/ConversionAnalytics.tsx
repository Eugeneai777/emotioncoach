import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, MousePointerClick, AlertCircle, CreditCard, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ['#14b8a6', '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6'];

const ConversionAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [featureKey, setFeatureKey] = useState('emotion_button');

  const getDateFilter = () => {
    if (timeRange === 'all') return null;
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return subDays(new Date(), days).toISOString();
  };

  // 获取漏斗数据
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['conversion-funnel', featureKey, timeRange],
    queryFn: async () => {
      let query = supabase
        .from('conversion_events')
        .select('event_type, visitor_id, user_id')
        .eq('feature_key', featureKey);
      
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 计算各阶段的独立用户数
      const uniqueUsers = new Map<string, Set<string>>();
      const eventTypes = ['first_visit', 'feature_use', 'free_limit_reached', 'purchase_dialog_shown', 'purchase_initiated', 'purchase_completed'];
      
      eventTypes.forEach(type => uniqueUsers.set(type, new Set()));

      data?.forEach(event => {
        const userId = event.user_id || event.visitor_id;
        if (userId && uniqueUsers.has(event.event_type)) {
          uniqueUsers.get(event.event_type)!.add(userId);
        }
      });

      return eventTypes.map(type => ({
        name: getEventLabel(type),
        value: uniqueUsers.get(type)?.size || 0,
        type,
      }));
    },
  });

  // 获取每日趋势
  const { data: trendData } = useQuery({
    queryKey: ['conversion-trend', featureKey, timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from('conversion_events')
        .select('event_type, created_at')
        .eq('feature_key', featureKey)
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;

      // 按日期分组
      const dailyStats: Record<string, { visits: number; uses: number; purchases: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), 'MM-dd');
        dailyStats[date] = { visits: 0, uses: 0, purchases: 0 };
      }

      data?.forEach(event => {
        const date = format(new Date(event.created_at), 'MM-dd');
        if (dailyStats[date]) {
          if (event.event_type === 'first_visit') dailyStats[date].visits++;
          if (event.event_type === 'feature_use') dailyStats[date].uses++;
          if (event.event_type === 'purchase_completed') dailyStats[date].purchases++;
        }
      });

      return Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats,
      }));
    },
  });

  const getEventLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'first_visit': '访问页面',
      'feature_use': '使用功能',
      'free_limit_reached': '达到免费上限',
      'purchase_dialog_shown': '弹窗展示',
      'purchase_initiated': '点击购买',
      'purchase_completed': '支付成功',
    };
    return labels[type] || type;
  };

  // 计算转化率
  const calculateRates = () => {
    if (!funnelData) return null;
    
    const getValue = (type: string) => funnelData.find(d => d.type === type)?.value || 0;
    
    const visitors = getValue('first_visit');
    const users = getValue('feature_use');
    const limitReached = getValue('free_limit_reached');
    const completed = getValue('purchase_completed');
    
    return {
      visitToUse: visitors > 0 ? ((users / visitors) * 100).toFixed(1) : '0',
      freeToPaid: limitReached > 0 ? ((completed / limitReached) * 100).toFixed(1) : '0',
      overallConversion: visitors > 0 ? ((completed / visitors) * 100).toFixed(2) : '0',
    };
  };

  const rates = calculateRates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">转化分析</h2>
          <p className="text-muted-foreground">追踪免费用户到付费用户的转化漏斗</p>
        </div>
        <div className="flex gap-2">
          <Select value={featureKey} onValueChange={setFeatureKey}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emotion_button">情绪按钮</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">近7天</SelectItem>
              <SelectItem value="30d">近30天</SelectItem>
              <SelectItem value="90d">近90天</SelectItem>
              <SelectItem value="all">全部</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-500" />
              <span className="text-sm text-muted-foreground">总访问</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {funnelData?.find(d => d.type === 'first_visit')?.value || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-cyan-500" />
              <span className="text-sm text-muted-foreground">使用功能</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {funnelData?.find(d => d.type === 'feature_use')?.value || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              访问→使用: {rates?.visitToUse}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">达到上限</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {funnelData?.find(d => d.type === 'free_limit_reached')?.value || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">付费成功</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {funnelData?.find(d => d.type === 'purchase_completed')?.value || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              免费→付费: {rates?.freeToPaid}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 转化率卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            总体转化率
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {rates?.overallConversion}%
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            从访问到付费的整体转化率
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 转化漏斗 */}
        <Card>
          <CardHeader>
            <CardTitle>转化漏斗</CardTitle>
            <CardDescription>各阶段用户数量</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 每日趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>每日趋势</CardTitle>
            <CardDescription>访问、使用、付费趋势</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visits" name="访问" fill="#14b8a6" />
                <Bar dataKey="uses" name="使用" fill="#06b6d4" />
                <Bar dataKey="purchases" name="付费" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConversionAnalytics;

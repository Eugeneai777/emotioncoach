import { useState, useEffect, useMemo } from "react";
import { triggerEmergencyAlert } from "@/lib/emergencyAlertService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfMonth, startOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { 
  TrendingUp, TrendingDown, AlertTriangle, Check, RefreshCw, 
  DollarSign, Activity, Users, Bell, Settings, PieChart as PieChartIcon,
  AlertCircle, Lightbulb, Phone
} from "lucide-react";
import VoiceCostAnalysis from "./VoiceCostAnalysis";
import { 
  calculateFeatureProfitability, 
  DEFAULT_FEATURE_QUOTA, 
  FEATURE_NAME_MAP,
  type FeatureProfitability 
} from "@/utils/apiCostTracker";

interface CostLog {
  id: string;
  user_id: string | null;
  function_name: string;
  feature_key: string | null;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  estimated_cost_cny: number;
  created_at: string;
}

interface AlertSetting {
  id: string;
  alert_type: string;
  threshold_cny: number;
  is_active: boolean;
  notify_email: string | null;
  notify_wecom: boolean;
}

interface BillingCorrection {
  id: string;
  user_id: string;
  alert_id: string | null;
  correction_type: 'refund' | 'charge';
  original_amount: number;
  expected_amount: number;
  correction_amount: number;
  feature_key: string | null;
  feature_name: string | null;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface CostAlert {
  id: string;
  alert_type: string;
  user_id: string | null;
  threshold_cny: number;
  actual_cost_cny: number;
  alert_message: string;
  is_acknowledged: boolean;
  created_at: string;
  correction_status?: 'pending' | 'corrected' | 'skipped' | 'failed';
  correction_id?: string | null;
  metadata?: {
    feature_key?: string;
    feature_name?: string;
    expected_amount?: number;
    actual_amount?: number;
    deviation_percentage?: number;
    cost_source?: string;
  };
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  'daily_total': '每日总成本',
  'monthly_total': '每月总成本',
  'single_user_daily': '单用户每日',
  'single_call': '单次调用',
  'billing_mismatch': '扣费异常'
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function CostMonitorDashboard() {
  const [costLogs, setCostLogs] = useState<CostLog[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [corrections, setCorrections] = useState<BillingCorrection[]>([]);
  const [featureSettings, setFeatureSettings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [checkingMismatch, setCheckingMismatch] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, settingsRes, alertsRes, featureSettingsRes, correctionsRes] = await Promise.all([
        supabase
          .from('api_cost_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase.from('cost_alert_settings').select('*'),
        supabase
          .from('cost_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('package_feature_settings')
          .select('feature_id, cost_per_use, feature_items!inner(item_key)'),
        supabase
          .from('billing_corrections')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (logsRes.data) setCostLogs(logsRes.data);
      if (settingsRes.data) setAlertSettings(settingsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data as CostAlert[]);
      if (correctionsRes.data) setCorrections(correctionsRes.data as BillingCorrection[]);
      
      // 构建功能配额映射
      if (featureSettingsRes.data) {
        const quotaMap: Record<string, number> = {};
        featureSettingsRes.data.forEach((item: any) => {
          const featureKey = item.feature_items?.item_key;
          if (featureKey) {
            quotaMap[featureKey] = item.cost_per_use || 1;
          }
        });
        setFeatureSettings(quotaMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const runMismatchCheck = async (autoCorrect: boolean = false, dryRun: boolean = false) => {
    if (autoCorrect) {
      setAutoFixing(true);
    } else {
      setCheckingMismatch(true);
    }
    try {
      const { data, error } = await supabase.functions.invoke('check-billing-mismatch', {
        body: { autoCorrect, dryRun }
      });
      if (error) throw error;
      
      if (autoCorrect && !dryRun) {
        toast.success(
          `自动修复完成: 成功 ${data.corrections_successful} 条, 失败 ${data.corrections_failed} 条`
        );
      } else if (dryRun) {
        toast.info(`试运行完成: 发现 ${data.new_mismatches_found} 条异常, 待修复 ${data.pending_corrections} 条`);
      } else {
        toast.success(`扣费异常检查完成，发现 ${data.new_mismatches_found} 条异常`);
      }
      fetchData();
    } catch (error) {
      console.error('Error running mismatch check:', error);
      toast.error(autoCorrect ? '自动修复失败' : '扣费异常检查失败');
    } finally {
      setCheckingMismatch(false);
      setAutoFixing(false);
    }
  };

  const runAlertCheck = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-cost-alerts');
      if (error) throw error;
      toast.success(`预警检查完成，发现 ${data.alerts_count} 个新预警`);

      // 触发紧急告警推送 - 包含具体预警详情
      if (data.alerts_count > 0 && data.alerts?.length > 0) {
        const alertDetails = data.alerts.map((a: any) => a.alert_message).join('\n');
        const alertTypes = data.alerts.map((a: any) => a.alert_type).join(', ');
        const maxCost = Math.max(...data.alerts.map((a: any) => a.actual_cost_cny || 0));
        
        triggerEmergencyAlert({
          source: 'cost_monitor',
          level: data.alerts_count >= 3 ? 'critical' : 'high',
          alertType: 'cost_alert_triggered',
          message: `成本预警: ${alertDetails}`,
          details: `预警类型: ${alertTypes}\n预警数量: ${data.alerts_count} 个\n最高实际成本: ¥${maxCost.toFixed(2)}\n${data.alerts.map((a: any) => `• ${a.alert_message} (阈值 ¥${a.threshold_cny}, 实际 ¥${a.actual_cost_cny?.toFixed(2)})`).join('\n')}`,
        });
      }

      fetchData();
    } catch (error) {
      console.error('Error running alert check:', error);
      toast.error('预警检查失败');
    } finally {
      setChecking(false);
    }
  };

  const updateAlertSetting = async (id: string, updates: Partial<AlertSetting>) => {
    try {
      const { error } = await supabase
        .from('cost_alert_settings')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      toast.success('设置已更新');
      fetchData();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('更新失败');
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('cost_alerts')
        .update({ 
          is_acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq('id', alertId);
      if (error) throw error;
      toast.success('已确认');
      fetchData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('操作失败');
    }
  };

  const acknowledgeAllAlerts = async () => {
    const pendingAlerts = alerts.filter(a => !a.is_acknowledged);
    if (pendingAlerts.length === 0) {
      toast.info('没有待处理的预警');
      return;
    }
    try {
      const { error } = await supabase
        .from('cost_alerts')
        .update({ 
          is_acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .in('id', pendingAlerts.map(a => a.id));
      if (error) throw error;
      toast.success(`已确认 ${pendingAlerts.length} 条预警`);
      fetchData();
    } catch (error) {
      console.error('Error acknowledging all alerts:', error);
      toast.error('操作失败');
    }
  };

  // 计算统计数据
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    const monthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(subDays(monthStart, 1));

    const todayLogs = costLogs.filter(l => new Date(l.created_at) >= today);
    const yesterdayLogs = costLogs.filter(l => {
      const d = new Date(l.created_at);
      return d >= yesterday && d < today;
    });
    const monthLogs = costLogs.filter(l => new Date(l.created_at) >= monthStart);

    const todayCost = todayLogs.reduce((sum, l) => sum + Number(l.estimated_cost_cny), 0);
    const yesterdayCost = yesterdayLogs.reduce((sum, l) => sum + Number(l.estimated_cost_cny), 0);
    const monthCost = monthLogs.reduce((sum, l) => sum + Number(l.estimated_cost_cny), 0);

    const dailyChange = yesterdayCost > 0 ? ((todayCost - yesterdayCost) / yesterdayCost * 100) : 0;
    
    const pendingAlerts = alerts.filter(a => !a.is_acknowledged).length;
    
    const monthlySetting = alertSettings.find(s => s.alert_type === 'monthly_total');
    const monthlyBudget = monthlySetting?.threshold_cny || 2000;
    const budgetUsage = (monthCost / monthlyBudget) * 100;

    return { todayCost, yesterdayCost, monthCost, dailyChange, pendingAlerts, budgetUsage, monthlyBudget };
  }, [costLogs, alerts, alertSettings]);

  // 每日成本趋势数据
  const dailyTrendData = useMemo(() => {
    const days = 30;
    const data: { date: string; cost: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MM-dd');
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(subDays(date, -1));
      
      const dayCost = costLogs
        .filter(l => {
          const d = new Date(l.created_at);
          return d >= dayStart && d < dayEnd;
        })
        .reduce((sum, l) => sum + Number(l.estimated_cost_cny), 0);
      
      data.push({ date: dateStr, cost: Number(dayCost.toFixed(2)) });
    }
    
    return data;
  }, [costLogs]);

  // 按功能分类成本
  const functionCostData = useMemo(() => {
    const functionTotals: Record<string, number> = {};
    
    costLogs.forEach(log => {
      const key = log.function_name;
      functionTotals[key] = (functionTotals[key] || 0) + Number(log.estimated_cost_cny);
    });
    
    return Object.entries(functionTotals)
      .map(([name, value]) => ({ name: name.replace(/-/g, ' '), value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [costLogs]);

  // 高成本调用列表
  const highCostCalls = useMemo(() => {
    return [...costLogs]
      .sort((a, b) => Number(b.estimated_cost_cny) - Number(a.estimated_cost_cny))
      .slice(0, 20);
  }, [costLogs]);

  // 利润率分析数据
  const profitabilityData = useMemo((): FeatureProfitability[] => {
    // 按功能分组统计
    const functionStats: Record<string, { count: number; totalCost: number }> = {};
    
    costLogs.forEach(log => {
      const key = log.function_name;
      if (!functionStats[key]) {
        functionStats[key] = { count: 0, totalCost: 0 };
      }
      functionStats[key].count += 1;
      functionStats[key].totalCost += Number(log.estimated_cost_cny);
    });
    
    // 计算每个功能的利润率
    return Object.entries(functionStats)
      .map(([functionName, stats]) => {
        const featureName = FEATURE_NAME_MAP[functionName] || functionName.replace(/-/g, ' ');
        const quotaPerUse = featureSettings[functionName] || DEFAULT_FEATURE_QUOTA[functionName] || 1;
        
        return calculateFeatureProfitability(
          functionName,
          featureName,
          stats.count,
          stats.totalCost,
          quotaPerUse
        );
      })
      .sort((a, b) => a.profitMargin - b.profitMargin);
  }, [costLogs, featureSettings]);

  // 利润率汇总统计
  const profitStats = useMemo(() => {
    const profitable = profitabilityData.filter(p => p.status === 'profitable').length;
    const loss = profitabilityData.filter(p => p.status === 'loss').length;
    const breakEven = profitabilityData.filter(p => p.status === 'break_even').length;
    
    const totalRevenue = profitabilityData.reduce((sum, p) => sum + p.totalRevenueCny, 0);
    const totalCost = profitabilityData.reduce((sum, p) => sum + p.totalCostCny, 0);
    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return { profitable, loss, breakEven, totalRevenue, totalCost, totalProfit, overallMargin };
  }, [profitabilityData]);

  // 利润率图表数据
  const profitChartData = useMemo(() => {
    return profitabilityData
      .slice(0, 15)
      .map(p => ({
        name: p.featureName.length > 8 ? p.featureName.slice(0, 8) + '...' : p.featureName,
        fullName: p.featureName,
        margin: Number(p.profitMargin.toFixed(1)),
        profit: Number(p.profitCny.toFixed(2)),
        status: p.status,
      }));
  }, [profitabilityData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">成本监控</h1>
          <p className="text-sm text-muted-foreground">实时追踪 API 调用成本、预算预警与账单核对</p>
        </div>
      </div>
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日成本</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.todayCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats.dailyChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-destructive" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              较昨日 {stats.dailyChange >= 0 ? '+' : ''}{stats.dailyChange.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月成本</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.monthCost.toFixed(2)}</div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${stats.budgetUsage > 80 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${Math.min(stats.budgetUsage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              预算 ¥{stats.monthlyBudget} 的 {stats.budgetUsage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API 调用次数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costLogs.length}</div>
            <p className="text-xs text-muted-foreground">最近 1000 条记录</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理预警</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.pendingAlerts}
              {stats.pendingAlerts > 0 && (
                <Badge variant="destructive" className="text-xs">需处理</Badge>
              )}
            </div>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs"
              onClick={runAlertCheck}
              disabled={checking}
            >
              {checking ? '检查中...' : '立即检查预警'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="trends">成本趋势</TabsTrigger>
          <TabsTrigger value="breakdown">成本分析</TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            语音成本
          </TabsTrigger>
          <TabsTrigger value="profit" className="flex items-center gap-1">
            <PieChartIcon className="h-3 w-3" />
            利润分析
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            扣费监控
          </TabsTrigger>
          <TabsTrigger value="alerts">预警管理</TabsTrigger>
          <TabsTrigger value="settings">阈值设置</TabsTrigger>
          <TabsTrigger value="logs">调用日志</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">每日成本趋势（最近30天）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [`¥${value.toFixed(2)}`, '成本']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">功能成本排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={functionCostData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [`¥${value.toFixed(2)}`, '成本']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">成本分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={functionCostData.slice(0, 5)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {functionCostData.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`¥${value.toFixed(2)}`, '成本']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 语音成本分析 Tab */}
        <TabsContent value="voice" className="space-y-4">
          <VoiceCostAnalysis />
        </TabsContent>

        {/* 利润分析 Tab */}
        <TabsContent value="profit" className="space-y-4">
          {/* 利润概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总体利润率</CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${profitStats.overallMargin >= 50 ? 'text-green-600' : profitStats.overallMargin >= 0 ? 'text-amber-600' : 'text-destructive'}`}>
                  {profitStats.overallMargin.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {profitStats.overallMargin >= 70 ? '🟢 优秀' : profitStats.overallMargin >= 50 ? '🟡 良好' : profitStats.overallMargin >= 0 ? '🟠 一般' : '🔴 亏损'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">盈利功能</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{profitStats.profitable}</div>
                <p className="text-xs text-muted-foreground">
                  共 {profitabilityData.length} 个功能
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">亏损功能</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive flex items-center gap-2">
                  {profitStats.loss}
                  {profitStats.loss > 0 && (
                    <Badge variant="destructive" className="text-xs">需优化</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  持平: {profitStats.breakEven} 个
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">预估总利润</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${profitStats.totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  ¥{profitStats.totalProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  收入 ¥{profitStats.totalRevenue.toFixed(2)} - 成本 ¥{profitStats.totalCost.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 亏损功能预警 */}
          {profitStats.loss > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  亏损功能预警
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profitabilityData
                  .filter(p => p.status === 'loss')
                  .map(p => (
                    <div key={p.featureKey} className="flex items-start justify-between p-3 bg-background rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="font-medium">{p.featureName}</span>
                          <Badge variant="destructive" className="text-xs">
                            {p.profitMargin.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          成本 ¥{p.avgCostPerUse.toFixed(3)}/次 | 收入 ¥{p.avgRevenuePerUse.toFixed(3)}/次 | 配额消耗 {p.quotaPerUse}
                        </p>
                      </div>
                      {p.suggestion && (
                        <div className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <Lightbulb className="h-3 w-3" />
                          {p.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* 利润率排行图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">功能利润率排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={['dataMin - 10', 'dataMax + 10']} className="text-xs" />
                      <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'margin' ? `${value}%` : `¥${value}`,
                          name === 'margin' ? '利润率' : '利润'
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                      />
                      <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
                      <Bar 
                        dataKey="margin" 
                        radius={[0, 4, 4, 0]}
                        fill="hsl(var(--primary))"
                      >
                        {profitChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.status === 'profitable' ? 'hsl(142 76% 36%)' : entry.status === 'loss' ? 'hsl(var(--destructive))' : 'hsl(45 93% 47%)'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">利润构成分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '盈利功能', value: profitStats.profitable, fill: 'hsl(142 76% 36%)' },
                          { name: '持平功能', value: profitStats.breakEven, fill: 'hsl(45 93% 47%)' },
                          { name: '亏损功能', value: profitStats.loss, fill: 'hsl(var(--destructive))' },
                        ].filter(d => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value, percent }) => `${name} ${value}个 (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} 个功能`, '数量']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 详细数据表格 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">功能利润率明细</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>功能</TableHead>
                    <TableHead className="text-right">使用次数</TableHead>
                    <TableHead className="text-right">成本/次</TableHead>
                    <TableHead className="text-right">配额消耗</TableHead>
                    <TableHead className="text-right">收入/次</TableHead>
                    <TableHead className="text-right">总成本</TableHead>
                    <TableHead className="text-right">总收入</TableHead>
                    <TableHead className="text-right">利润</TableHead>
                    <TableHead className="text-right">利润率</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitabilityData.map(p => (
                    <TableRow key={p.featureKey}>
                      <TableCell className="font-medium">{p.featureName}</TableCell>
                      <TableCell className="text-right">{p.usageCount}</TableCell>
                      <TableCell className="text-right">¥{p.avgCostPerUse.toFixed(4)}</TableCell>
                      <TableCell className="text-right">{p.quotaPerUse}</TableCell>
                      <TableCell className="text-right">¥{p.avgRevenuePerUse.toFixed(4)}</TableCell>
                      <TableCell className="text-right">¥{p.totalCostCny.toFixed(2)}</TableCell>
                      <TableCell className="text-right">¥{p.totalRevenueCny.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-medium ${p.profitCny >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {p.profitCny >= 0 ? '+' : ''}¥{p.profitCny.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${p.status === 'profitable' ? 'text-green-600' : p.status === 'loss' ? 'text-destructive' : 'text-amber-600'}`}>
                        {p.profitMargin.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'profitable' ? 'default' : p.status === 'loss' ? 'destructive' : 'secondary'} className={p.status === 'profitable' ? 'bg-green-600' : ''}>
                          {p.status === 'profitable' ? '🟢 盈利' : p.status === 'loss' ? '🔴 亏损' : '🟡 持平'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 扣费监控 Tab */}
        <TabsContent value="billing" className="space-y-4">
          {/* 扣费异常概览 */}
          {(() => {
            const billingMismatches = alerts.filter(a => a.alert_type === 'billing_mismatch');
            const pendingMismatches = billingMismatches.filter(a => !a.is_acknowledged);
            const severeMismatches = billingMismatches.filter(a => 
              Math.abs(a.metadata?.deviation_percentage || 0) > 50
            );
            const affectedFeatures = [...new Set(billingMismatches.map(a => a.metadata?.feature_name).filter(Boolean))];

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">扣费异常总数</CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{billingMismatches.length}</div>
                      <p className="text-xs text-muted-foreground">最近100条记录</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">待处理异常</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive flex items-center gap-2">
                        {pendingMismatches.length}
                        {pendingMismatches.length > 0 && (
                          <Badge variant="destructive" className="text-xs">需处理</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">未确认的异常</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">严重异常</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{severeMismatches.length}</div>
                      <p className="text-xs text-muted-foreground">偏差超过50%</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">涉及功能</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{affectedFeatures.length}</div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-xs"
                        onClick={() => runMismatchCheck(false, false)}
                        disabled={checkingMismatch}
                      >
                        {checkingMismatch ? '检查中...' : '立即检查异常'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* 异常列表 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">扣费异常记录</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => runMismatchCheck(false, false)} 
                        disabled={checkingMismatch || autoFixing}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${checkingMismatch ? 'animate-spin' : ''}`} />
                        检查异常
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => runMismatchCheck(true, false)} 
                        disabled={checkingMismatch || autoFixing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {autoFixing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            修复中...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            自动修复
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {billingMismatches.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="text-lg font-medium text-green-600">扣费正常</p>
                        <p className="text-sm">暂无扣费异常记录</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>时间</TableHead>
                            <TableHead>功能</TableHead>
                            <TableHead>用户ID</TableHead>
                            <TableHead className="text-right">预期扣费</TableHead>
                            <TableHead className="text-right">实际扣费</TableHead>
                            <TableHead className="text-right">偏差</TableHead>
                            <TableHead>修复状态</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {billingMismatches.map(alert => {
                            const expected = alert.metadata?.expected_amount || alert.threshold_cny;
                            const actual = alert.metadata?.actual_amount || alert.actual_cost_cny;
                            const difference = expected - actual;
                            const correctionType = difference > 0 ? '补扣' : '退还';
                            
                            return (
                              <TableRow key={alert.id}>
                                <TableCell className="text-sm text-muted-foreground">
                                  {format(new Date(alert.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {alert.metadata?.feature_name || alert.metadata?.feature_key || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {alert.user_id?.slice(0, 8) || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {expected} 点
                                </TableCell>
                                <TableCell className="text-right">
                                  {actual} 点
                                </TableCell>
                                <TableCell className={`text-right font-medium ${
                                  (alert.metadata?.deviation_percentage || 0) > 0 ? 'text-destructive' : 'text-amber-600'
                                }`}>
                                  {(alert.metadata?.deviation_percentage || 0) > 0 ? '+' : ''}
                                  {(alert.metadata?.deviation_percentage || 0).toFixed(1)}%
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({correctionType}{Math.abs(difference)}点)
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {alert.correction_status === 'corrected' ? (
                                    <Badge variant="outline" className="text-green-600 bg-green-50">
                                      <Check className="h-3 w-3 mr-1" />
                                      已修复
                                    </Badge>
                                  ) : alert.correction_status === 'failed' ? (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      修复失败
                                    </Badge>
                                  ) : alert.correction_status === 'skipped' ? (
                                    <Badge variant="secondary">
                                      跳过
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600 bg-amber-50">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      待修复
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {alert.correction_status === 'pending' && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => acknowledgeAlert(alert.id)}
                                    >
                                      跳过
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* 修复记录 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">修复记录</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {corrections.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">暂无修复记录</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>时间</TableHead>
                            <TableHead>功能</TableHead>
                            <TableHead>用户ID</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead className="text-right">原扣费</TableHead>
                            <TableHead className="text-right">应扣费</TableHead>
                            <TableHead className="text-right">修复金额</TableHead>
                            <TableHead>状态</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {corrections.map(correction => (
                            <TableRow key={correction.id}>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(correction.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                              </TableCell>
                              <TableCell className="font-medium">
                                {correction.feature_name || correction.feature_key || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {correction.user_id?.slice(0, 8) || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={correction.correction_type === 'refund' ? 'default' : 'secondary'} 
                                  className={correction.correction_type === 'refund' ? 'bg-green-600' : 'bg-amber-600'}>
                                  {correction.correction_type === 'refund' ? '退还' : '补扣'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {correction.original_amount} 点
                              </TableCell>
                              <TableCell className="text-right">
                                {correction.expected_amount} 点
                              </TableCell>
                              <TableCell className={`text-right font-medium ${
                                correction.correction_type === 'refund' ? 'text-green-600' : 'text-amber-600'
                              }`}>
                                {correction.correction_type === 'refund' ? '+' : '-'}{correction.correction_amount} 点
                              </TableCell>
                              <TableCell>
                                {correction.status === 'completed' ? (
                                  <Badge variant="outline" className="text-green-600">
                                    <Check className="h-3 w-3 mr-1" />
                                    完成
                                  </Badge>
                                ) : correction.status === 'failed' ? (
                                  <Badge variant="destructive" title={correction.error_message || ''}>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    失败
                                  </Badge>
                                ) : correction.status === 'skipped' ? (
                                  <Badge variant="secondary">
                                    跳过
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    待处理
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">预警记录</CardTitle>
              <div className="flex gap-2">
                {alerts.some(a => !a.is_acknowledged) && (
                  <Button size="sm" variant="outline" onClick={acknowledgeAllAlerts}>
                    <Check className="h-4 w-4 mr-2" />
                    全部确认
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={runAlertCheck} disabled={checking}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                  检查预警
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无预警记录
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>类型</TableHead>
                      <TableHead>详情</TableHead>
                      <TableHead>阈值</TableHead>
                      <TableHead>实际成本</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map(alert => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge variant={alert.is_acknowledged ? 'secondary' : 'destructive'}>
                            {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {alert.alert_message}
                        </TableCell>
                        <TableCell>¥{Number(alert.threshold_cny).toFixed(2)}</TableCell>
                        <TableCell>¥{Number(alert.actual_cost_cny).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(alert.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell>
                          {alert.is_acknowledged ? (
                            <Badge variant="outline" className="text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              已确认
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              待处理
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!alert.is_acknowledged && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              确认
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                预警阈值设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {alertSettings.map(setting => (
                <div key={setting.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">
                      {ALERT_TYPE_LABELS[setting.alert_type] || setting.alert_type}
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">阈值: ¥</span>
                      <Input
                        type="number"
                        value={setting.threshold_cny}
                        onChange={(e) => updateAlertSetting(setting.id, { 
                          threshold_cny: parseFloat(e.target.value) 
                        })}
                        className="w-24 h-8"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.is_active}
                        onCheckedChange={(checked) => updateAlertSetting(setting.id, { 
                          is_active: checked 
                        })}
                      />
                      <Label className="text-sm">启用</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.notify_wecom}
                        onCheckedChange={(checked) => updateAlertSetting(setting.id, { 
                          notify_wecom: checked 
                        })}
                      />
                      <Label className="text-sm">企微通知</Label>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">高成本调用记录</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>函数</TableHead>
                    <TableHead>模型</TableHead>
                    <TableHead>输入 Tokens</TableHead>
                    <TableHead>输出 Tokens</TableHead>
                    <TableHead>成本 (CNY)</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highCostCalls.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.function_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.model?.split('/').pop() || '-'}
                      </TableCell>
                      <TableCell>{log.input_tokens}</TableCell>
                      <TableCell>{log.output_tokens}</TableCell>
                      <TableCell className="font-medium">
                        ¥{Number(log.estimated_cost_cny).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  CheckCircle2, 
  Clock,
  Calculator,
  PiggyBank,
  Wallet,
  Users
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  useBloomMonthlySummary, 
  useBloomMonthlyTrends, 
  useCalculateMonthlyProfit,
  useBloomConfirmedOrders 
} from '@/hooks/useBloomMonthlyProfit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Generate last 12 months options
const generateMonthOptions = () => {
  const options = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    options.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'yyyy年M月', { locale: zhCN }),
    });
  }
  return options;
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  variant = 'default' 
}) => {
  const bgClass = {
    default: 'bg-card',
    success: 'bg-green-50 dark:bg-green-950/30',
    warning: 'bg-yellow-50 dark:bg-yellow-950/30',
    destructive: 'bg-red-50 dark:bg-red-950/30',
  }[variant];

  return (
    <Card className={bgClass}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && trendValue && (
              <div className="flex items-center gap-1 text-xs">
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 bg-background rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminBloomMonthlyProfit() {
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useBloomMonthlySummary(selectedMonth);
  const { data: trends, isLoading: trendsLoading } = useBloomMonthlyTrends(12);
  const { data: confirmedOrders, isLoading: ordersLoading } = useBloomConfirmedOrders(selectedMonth);
  const calculateProfit = useCalculateMonthlyProfit();
  
  const handleCalculate = async () => {
    try {
      await calculateProfit.mutateAsync(selectedMonth);
      toast.success('月度利润计算完成');
      refetchSummary();
    } catch (error) {
      toast.error('计算失败');
    }
  };
  
  const chartData = trends?.map(t => ({
    month: t.year_month.substring(5),
    预售款: t.total_presale_amount,
    确认收入: t.total_confirmed_revenue,
    利润: t.monthly_profit,
  })) || [];

  const profitRateData = trends?.map(t => ({
    month: t.year_month.substring(5),
    利润率: t.profit_rate,
  })) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">绽放产品月度利润报表</h1>
          <p className="text-muted-foreground">预售款与确认收入核算，按交付完成确认利润</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleCalculate} 
            disabled={calculateProfit.isPending}
            className="gap-2"
          >
            <Calculator className="h-4 w-4" />
            {calculateProfit.isPending ? '计算中...' : '重新计算'}
          </Button>
          <Button variant="outline" onClick={() => refetchSummary()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summaryLoading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : summary ? (
        <>
          {/* Presales Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              本月销售（预售款）
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="合伙人套餐"
                value={formatCurrency(summary.presale_partner_amount)}
                subtitle={`${summary.presale_partner_count} 单`}
                icon={<Users className="h-5 w-5 text-purple-500" />}
              />
              <StatCard
                title="单独训练营"
                value={formatCurrency(summary.presale_single_amount)}
                subtitle={`${summary.presale_single_count} 单`}
                icon={<Package className="h-5 w-5 text-blue-500" />}
              />
              <StatCard
                title="预售款合计"
                value={formatCurrency(summary.total_presale_amount)}
                subtitle={`共 ${summary.presale_partner_count + summary.presale_single_count} 单`}
                icon={<DollarSign className="h-5 w-5 text-amber-500" />}
                variant="warning"
              />
              <StatCard
                title="累计待确认预售款"
                value={formatCurrency(summary.cumulative_presale - summary.cumulative_confirmed)}
                subtitle="待交付完成"
                icon={<Clock className="h-5 w-5 text-orange-500" />}
              />
            </div>
          </div>

          {/* Confirmed Revenue Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              本月确认收入（交付完成）
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="合伙人套餐"
                value={formatCurrency(summary.confirmed_partner_revenue)}
                subtitle={`${summary.confirmed_partner_count} 单`}
                icon={<Users className="h-5 w-5 text-green-500" />}
                variant="success"
              />
              <StatCard
                title="单独训练营"
                value={formatCurrency(summary.confirmed_single_revenue)}
                subtitle={`${summary.confirmed_single_count} 单`}
                icon={<Package className="h-5 w-5 text-green-500" />}
                variant="success"
              />
              <StatCard
                title="确认收入合计"
                value={formatCurrency(summary.total_confirmed_revenue)}
                subtitle={`共 ${summary.confirmed_partner_count + summary.confirmed_single_count} 单`}
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                variant="success"
              />
              <StatCard
                title="累计已确认收入"
                value={formatCurrency(summary.cumulative_confirmed)}
                subtitle="历史累计"
                icon={<PiggyBank className="h-5 w-5 text-green-500" />}
              />
            </div>
          </div>

          {/* Costs Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-red-500" />
              成本支出
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="L1 合伙人分成 (30%)"
                value={formatCurrency(summary.l1_commission_expense)}
                icon={<Users className="h-5 w-5 text-orange-500" />}
              />
              <StatCard
                title="L2 合伙人分成 (10%)"
                value={formatCurrency(summary.l2_commission_expense)}
                icon={<Users className="h-5 w-5 text-yellow-500" />}
              />
              <StatCard
                title="教练结算成本"
                value={formatCurrency(summary.coach_cost_expense)}
                icon={<Users className="h-5 w-5 text-blue-500" />}
              />
              <StatCard
                title="总成本"
                value={formatCurrency(summary.total_expense)}
                icon={<Wallet className="h-5 w-5 text-red-500" />}
                variant="destructive"
              />
            </div>
          </div>

          {/* Profit Section */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                月度利润核算
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">确认收入</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_confirmed_revenue)}</p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">总成本</p>
                  <p className="text-2xl font-bold text-red-500">- {formatCurrency(summary.total_expense)}</p>
                </div>
                <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg border-2 border-green-300 dark:border-green-700">
                  <p className="text-sm text-muted-foreground mb-1">净利润</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(summary.monthly_profit)}
                  </p>
                  <Badge variant="outline" className="mt-2 bg-green-100 text-green-700 border-green-300">
                    利润率 {formatPercent(summary.profit_rate)}
                  </Badge>
                </div>
              </div>
              {summary.calculated_at && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  最后计算时间: {format(new Date(summary.calculated_at), 'yyyy-MM-dd HH:mm:ss')}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">暂无该月份数据</p>
          <Button onClick={handleCalculate} disabled={calculateProfit.isPending}>
            <Calculator className="h-4 w-4 mr-2" />
            计算本月数据
          </Button>
        </Card>
      )}

      {/* Trends Charts */}
      {!trendsLoading && trends && trends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">收入趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="预售款" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="确认收入" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="利润" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">利润率趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profitRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(value: number) => formatPercent(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="利润率" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-4))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmed Orders Detail */}
      <Tabs defaultValue="partner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partner">合伙人套餐订单</TabsTrigger>
          <TabsTrigger value="single">单独训练营订单</TabsTrigger>
        </TabsList>
        
        <TabsContent value="partner">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">本月确认收入 - 合伙人套餐明细</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-4 text-muted-foreground">加载中...</div>
              ) : confirmedOrders?.partnerOrders && confirmedOrders.partnerOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户</TableHead>
                      <TableHead>推荐合伙人</TableHead>
                      <TableHead className="text-right">订单金额</TableHead>
                      <TableHead className="text-right">L1分成</TableHead>
                      <TableHead className="text-right">L2分成</TableHead>
                      <TableHead className="text-right">教练成本</TableHead>
                      <TableHead className="text-right">利润</TableHead>
                      <TableHead>完成时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedOrders.partnerOrders.map((order: any) => {
                      const profit = order.bloom_partner_profit?.[0];
                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            {(order.profiles as any)?.display_name || '未知用户'}
                          </TableCell>
                          <TableCell>
                            {(order.partners as any)?.name || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(order.order_amount)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            -{formatCurrency(profit?.l1_commission || 0)}
                          </TableCell>
                          <TableCell className="text-right text-yellow-600">
                            -{formatCurrency(profit?.l2_commission || 0)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            -{formatCurrency(profit?.total_coach_cost || 0)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(profit?.profit || 0)}
                          </TableCell>
                          <TableCell>
                            {order.completed_at ? format(new Date(order.completed_at), 'MM-dd HH:mm') : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  本月暂无确认收入的合伙人套餐订单
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">本月确认收入 - 单独训练营明细</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-4 text-muted-foreground">加载中...</div>
              ) : confirmedOrders?.singleDeliveries && confirmedOrders.singleDeliveries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>训练营类型</TableHead>
                      <TableHead className="text-right">订单金额</TableHead>
                      <TableHead className="text-right">L1分成</TableHead>
                      <TableHead className="text-right">L2分成</TableHead>
                      <TableHead className="text-right">教练成本</TableHead>
                      <TableHead className="text-right">利润</TableHead>
                      <TableHead>完成时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedOrders.singleDeliveries.map((delivery: any) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {delivery.camp_type === 'identity_bloom' ? '身份绽放' :
                             delivery.camp_type === 'emotion_bloom' ? '情绪绽放' :
                             delivery.camp_type === 'life_bloom' ? '生命绽放' : delivery.camp_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(delivery.order_amount)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          -{formatCurrency(delivery.l1_commission)}
                        </TableCell>
                        <TableCell className="text-right text-yellow-600">
                          -{formatCurrency(delivery.l2_commission)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          -{formatCurrency(delivery.coach_cost)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(delivery.profit)}
                        </TableCell>
                        <TableCell>
                          {delivery.completed_at ? format(new Date(delivery.completed_at), 'MM-dd HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  本月暂无确认收入的单独训练营订单
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

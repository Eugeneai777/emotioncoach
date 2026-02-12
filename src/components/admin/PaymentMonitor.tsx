import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp, Clock, AlertCircle, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PaymentAnomaly {
  id: string;
  type: 'high_abandon' | 'slow_payment' | 'repeated_failure' | 'large_amount';
  level: 'error' | 'warn';
  title: string;
  detail: string;
  timestamp: string;
}

export default function PaymentMonitor() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const { data: paymentMetrics, isLoading } = useQuery({
    queryKey: ['payment-monitor', timeRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 计算时间范围
      const now = new Date();
      const ranges: Record<string, Date> = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
      const startTime = ranges[timeRange].toISOString();

      // 查询所有订单数据
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, user_id, amount, status, created_at, paid_at')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

      if (!ordersData) return null;

      // 计算基础指标
      const totalOrders = ordersData.length;
      const paidOrders = ordersData.filter(o => o.status === 'paid');
      const failedOrders = ordersData.filter(o => o.status === 'failed');
      const pendingOrders = ordersData.filter(o => o.status === 'pending');
      
      const totalAmount = ordersData.reduce((sum, o) => sum + (o.amount || 0), 0);
      const paidAmount = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      
      const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0;
      const failureRate = totalOrders > 0 ? (failedOrders.length / totalOrders) * 100 : 0;
      const abandonRate = totalOrders > 0 ? (pendingOrders.length / totalOrders) * 100 : 0;

      // 计算平均支付时间
      const paymentTimes = paidOrders
        .filter(o => o.created_at && o.paid_at)
        .map(o => {
          const created = new Date(o.created_at).getTime();
          const paid = new Date(o.paid_at!).getTime();
          return (paid - created) / 1000 / 60; // 转换为分钟
        });
      const avgPaymentTime = paymentTimes.length > 0 
        ? paymentTimes.reduce((a, b) => a + b) / paymentTimes.length 
        : 0;

      // 异常检测
      const detectedAnomalies: PaymentAnomaly[] = [];

      // 1. 高放弃率
      if (totalOrders >= 5 && abandonRate > 50) {
        detectedAnomalies.push({
          id: 'high_abandon',
          type: 'high_abandon',
          level: abandonRate > 70 ? 'error' : 'warn',
          title: '支付放弃率过高',
          detail: `当前放弃率 ${abandonRate.toFixed(1)}%，待支付订单 ${pendingOrders.length} 笔`,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. 支付缓慢
      if (avgPaymentTime > 30) {
        detectedAnomalies.push({
          id: 'slow_payment',
          type: 'slow_payment',
          level: avgPaymentTime > 60 ? 'error' : 'warn',
          title: '支付完成时间过长',
          detail: `平均支付完成时间 ${avgPaymentTime.toFixed(0)} 分钟`,
          timestamp: new Date().toISOString(),
        });
      }

      // 3. 高失败率
      if (totalOrders >= 5 && failureRate > 20) {
        detectedAnomalies.push({
          id: 'high_failure',
          type: 'repeated_failure',
          level: failureRate > 40 ? 'error' : 'warn',
          title: '支付失败率过高',
          detail: `当前失败率 ${failureRate.toFixed(1)}%，失败订单 ${failedOrders.length} 笔`,
          timestamp: new Date().toISOString(),
        });
      }

      // 4. 大额订单
      const largeAmountOrders = ordersData.filter(o => o.amount && o.amount > 5000);
      if (largeAmountOrders.length > 0) {
        detectedAnomalies.push({
          id: 'large_amount',
          type: 'large_amount',
          level: 'warn',
          title: '大额订单',
          detail: `${timeRange} 内有 ${largeAmountOrders.length} 笔金额 > ¥5000 的订单`,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        totalOrders,
        totalAmount,
        paidAmount,
        paidOrders: paidOrders.length,
        failedOrders: failedOrders.length,
        pendingOrders: pendingOrders.length,
        conversionRate,
        failureRate,
        abandonRate,
        avgPaymentTime,
        anomalies: detectedAnomalies,
        recentOrders: ordersData.slice(0, 20),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded w-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!paymentMetrics) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (rate: number): string => {
    if (rate > 60) return 'text-destructive';
    if (rate > 30) return 'text-accent';
    return 'text-primary';
  };

  return (
    <div className="space-y-6">
      {/* 时间范围选择 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">时间范围:</span>
        <ToggleGroup type="single" value={timeRange} onValueChange={(v) => v && setTimeRange(v as any)}>
          <ToggleGroupItem value="1h" aria-label="1小时">1h</ToggleGroupItem>
          <ToggleGroupItem value="24h" aria-label="24小时">24h</ToggleGroupItem>
          <ToggleGroupItem value="7d" aria-label="7天">7d</ToggleGroupItem>
          <ToggleGroupItem value="30d" aria-label="30天">30d</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* 核心指标 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单总数</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMetrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">金额 ¥{paymentMetrics.totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">支付成功</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{paymentMetrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{paymentMetrics.paidOrders} 笔订单 · ¥{paymentMetrics.paidAmount.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">支付失败</CardTitle>
            <TrendingDown className={`h-4 w-4 ${getStatusColor(paymentMetrics.failureRate)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(paymentMetrics.failureRate)}`}>
              {paymentMetrics.failureRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">{paymentMetrics.failedOrders} 笔待处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均支付时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMetrics.avgPaymentTime.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">分钟</p>
          </CardContent>
        </Card>
      </div>

      {/* 异常检测 */}
      {paymentMetrics.anomalies.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-destructive" />
              检测到异常
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMetrics.anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`p-3 rounded-lg border ${
                    anomaly.level === 'error'
                      ? 'border-destructive/50 bg-destructive/5'
                      : 'border-accent/30 bg-accent/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{anomaly.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{anomaly.detail}</p>
                    </div>
                    <Badge variant={anomaly.level === 'error' ? 'destructive' : 'secondary'} className="ml-2">
                      {anomaly.level === 'error' ? '严重' : '警告'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近订单 */}
      <Card>
        <CardHeader>
          <CardTitle>最近订单</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单ID</TableHead>
                  <TableHead>用户ID</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMetrics.recentOrders.length > 0 ? (
                  paymentMetrics.recentOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs font-mono">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs font-mono">{order.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">¥{order.amount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === 'paid'
                              ? 'default'
                              : order.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {order.status === 'paid'
                            ? '已支付'
                            : order.status === 'failed'
                            ? '失败'
                            : '待支付'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      暂无订单
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

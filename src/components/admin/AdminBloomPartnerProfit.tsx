import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Wallet,
  RefreshCw,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';
import { 
  useBloomPartnerProfits, 
  useBloomProfitStats,
  useCalculateBloomProfit,
  useBloomPartnerOrders
} from '@/hooks/useBloomPartnerOrders';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'primary' 
}: { 
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof DollarSign;
  trend?: 'up' | 'down';
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`h-5 w-5 text-${color}`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? '+12%' : '-5%'}
            </span>
            <span className="text-xs text-muted-foreground">较上月</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminBloomPartnerProfit() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: profits, isLoading, refetch } = useBloomPartnerProfits(statusFilter);
  const { data: stats, isLoading: statsLoading } = useBloomProfitStats();
  const { data: orders } = useBloomPartnerOrders();
  const calculateProfit = useCalculateBloomProfit();
  
  const handleCalculateAll = async () => {
    if (!orders) return;
    for (const order of orders) {
      await calculateProfit.mutateAsync(order.id);
    }
  };
  
  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="总收入"
          value={formatCurrency(stats?.totalRevenue || 0)}
          subtitle={`${stats?.totalOrders || 0} 笔订单`}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="合伙人分成"
          value={formatCurrency(stats?.totalCommission || 0)}
          subtitle="L1 + L2 分成"
          icon={Users}
          color="orange-500"
        />
        <StatCard
          title="教练成本"
          value={formatCurrency(stats?.totalCoachCost || 0)}
          subtitle="3个训练营"
          icon={Wallet}
          color="blue-500"
        />
        <StatCard
          title="净利润"
          value={formatCurrency(stats?.totalProfit || 0)}
          subtitle={`利润率 ${(stats?.avgProfitRate || 0).toFixed(1)}%`}
          icon={TrendingUp}
          color="green-500"
          trend={stats?.totalProfit && stats.totalProfit > 0 ? 'up' : 'down'}
        />
      </div>
      
      {/* Profit Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            利润构成
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-green-500">
                {(stats?.avgProfitRate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">平均利润率</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-orange-500">
                {stats?.totalRevenue 
                  ? ((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">分成占比</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-blue-500">
                {stats?.totalRevenue 
                  ? ((stats.totalCoachCost / stats.totalRevenue) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">教练成本占比</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待结算</TabsTrigger>
            <TabsTrigger value="partial">部分结算</TabsTrigger>
            <TabsTrigger value="final">已结算</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCalculateAll}
            disabled={calculateProfit.isPending}
          >
            <Calculator className={`h-4 w-4 mr-1 ${calculateProfit.isPending ? 'animate-spin' : ''}`} />
            重算全部
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>
      
      {/* Profit Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead className="text-right">订单金额</TableHead>
                <TableHead className="text-right">L1分成</TableHead>
                <TableHead className="text-right">L2分成</TableHead>
                <TableHead className="text-right">教练成本</TableHead>
                <TableHead className="text-right">净利润</TableHead>
                <TableHead className="text-right">利润率</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : profits?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暂无利润数据
                  </TableCell>
                </TableRow>
              ) : (
                profits?.map((profit) => (
                  <TableRow key={profit.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {(profit as any).user_profile?.display_name || '未设置'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(profit.created_at), 'MM/dd', { locale: zhCN })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(profit.order_amount)}
                    </TableCell>
                    <TableCell className="text-right text-orange-500">
                      -{formatCurrency(profit.l1_commission)}
                    </TableCell>
                    <TableCell className="text-right text-orange-500">
                      -{formatCurrency(profit.l2_commission)}
                    </TableCell>
                    <TableCell className="text-right text-blue-500">
                      -{formatCurrency(profit.total_coach_cost)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${profit.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(profit.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {profit.profit_rate.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          profit.status === 'final' ? 'default' :
                          profit.status === 'partial' ? 'secondary' : 'outline'
                        }
                      >
                        {profit.status === 'final' ? '已结算' :
                         profit.status === 'partial' ? '部分结算' : '待结算'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Summary Footer */}
      {profits && profits.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                共 {profits.length} 条记录
              </span>
              <div className="flex items-center gap-6 text-sm">
                <span>
                  总收入: <strong>{formatCurrency(stats?.totalRevenue || 0)}</strong>
                </span>
                <span>
                  总成本: <strong className="text-orange-500">
                    {formatCurrency((stats?.totalCommission || 0) + (stats?.totalCoachCost || 0))}
                  </strong>
                </span>
                <span>
                  净利润: <strong className="text-green-500">
                    {formatCurrency(stats?.totalProfit || 0)}
                  </strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

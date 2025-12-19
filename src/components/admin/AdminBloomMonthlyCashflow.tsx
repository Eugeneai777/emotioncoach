import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, Calculator, Clock, TrendingUp, Wallet } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import {
  useBloomMonthlyCashflow,
  useBloomCashflowTrends,
  useCalculateMonthlyCashflow,
  useBloomCashflowInflows,
  useBloomCashflowOutflows,
} from '@/hooks/useBloomMonthlyCashflow';

export default function AdminBloomMonthlyCashflow() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const { data: cashflowData, isLoading } = useBloomMonthlyCashflow(selectedMonth);
  const { data: trendsData } = useBloomCashflowTrends(12);
  const { data: inflowsData } = useBloomCashflowInflows(selectedMonth);
  const { data: outflowsData } = useBloomCashflowOutflows(selectedMonth);
  const calculateMutation = useCalculateMonthlyCashflow();

  // 生成月份选项（过去12个月）
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'yyyy年MM月', { locale: zhCN }),
    };
  });

  const handleCalculate = async () => {
    try {
      await calculateMutation.mutateAsync(selectedMonth);
      toast.success('现金流计算完成');
    } catch (error) {
      toast.error('计算失败');
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    return `¥${(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 趋势图数据
  const chartData = trendsData?.map(item => ({
    month: item.year_month.slice(5),
    inflow: item.total_cash_inflow,
    outflow: item.total_cash_outflow,
    netCashflow: item.net_cashflow,
    balance: item.cash_balance,
  })) || [];

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">绽放产品月度现金流</h1>
          <p className="text-muted-foreground">按收付实现制统计现金流入流出</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]">
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
          <Button onClick={handleCalculate} disabled={calculateMutation.isPending}>
            <Calculator className="w-4 h-4 mr-2" />
            {calculateMutation.isPending ? '计算中...' : '重新计算'}
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 现金流入 */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-green-500" />
              现金流入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(cashflowData?.total_cash_inflow)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <div>合伙人套餐: {cashflowData?.partner_package_inflow || 0}笔 / {formatCurrency(cashflowData?.partner_package_amount)}</div>
              <div>单独训练营: {cashflowData?.single_camp_inflow || 0}笔 / {formatCurrency(cashflowData?.single_camp_amount)}</div>
            </div>
          </CardContent>
        </Card>

        {/* 现金流出 */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-red-500" />
              现金流出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(cashflowData?.total_cash_outflow)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <div>L1分成: {formatCurrency(cashflowData?.l1_commission_outflow)}</div>
              <div>L2分成: {formatCurrency(cashflowData?.l2_commission_outflow)}</div>
              <div>教练结算: {formatCurrency(cashflowData?.coach_settlement_outflow)}</div>
            </div>
          </CardContent>
        </Card>

        {/* 净现金流 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              净现金流
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(cashflowData?.net_cashflow || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(cashflowData?.net_cashflow)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              流入 - 流出 = 净现金流
            </div>
          </CardContent>
        </Card>

        {/* 待付款项 */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              待付款项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(cashflowData?.total_pending_payment)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <div>待付分成: {formatCurrency(cashflowData?.pending_commission)}</div>
              <div>待付教练结算: {formatCurrency(cashflowData?.pending_coach_settlement)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 累计现金余额 */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">累计现金余额</div>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(cashflowData?.cash_balance)}
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>累计流入: {formatCurrency(cashflowData?.cumulative_inflow)}</div>
              <div>累计流出: {formatCurrency(cashflowData?.cumulative_outflow)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle>现金流趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `${label}月`}
                />
                <Legend />
                <Bar dataKey="inflow" name="现金流入" fill="#22c55e" />
                <Bar dataKey="outflow" name="现金流出" fill="#ef4444" />
                <Bar dataKey="netCashflow" name="净现金流" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 累计余额趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>累计现金余额趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `${label}月`}
                />
                <Legend />
                <Line type="monotone" dataKey="balance" name="累计余额" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 明细标签页 */}
      <Card>
        <CardHeader>
          <CardTitle>收付款明细</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inflows">
            <TabsList>
              <TabsTrigger value="inflows">收款明细</TabsTrigger>
              <TabsTrigger value="outflows">付款明细</TabsTrigger>
            </TabsList>

            <TabsContent value="inflows" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>收款时间</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>训练营</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {inflowsData?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{format(new Date(item.purchased_at), 'MM-dd HH:mm')}</TableCell>
                          <TableCell>{item.display_name || '未知用户'}</TableCell>
                          <TableCell>
                            <Badge variant={item.camp_type === 'bloom_package' ? 'default' : 'secondary'}>
                              {item.camp_type === 'bloom_package' ? '合伙人套餐' : '单独购买'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.camp_type === 'bloom_emotion' && '情绪训练营'}
                        {item.camp_type === 'bloom_identity' && '自我认同营'}
                        {item.camp_type === 'bloom_life' && '生命力训练营'}
                        {item.camp_type === 'bloom_package' && '绽放套餐'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        +{formatCurrency(item.purchase_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!inflowsData || inflowsData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        本月暂无收款记录
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="outflows" className="mt-4">
              <div className="space-y-6">
                {/* 分成支出 */}
                <div>
                  <h4 className="font-medium mb-2">合伙人分成支出</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>支付时间</TableHead>
                        <TableHead>合伙人</TableHead>
                        <TableHead>级别</TableHead>
                        <TableHead className="text-right">金额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outflowsData?.commissions?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{format(new Date(item.paid_at), 'MM-dd HH:mm')}</TableCell>
                          <TableCell>{item.partners?.profiles?.display_name || '未知'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">L{item.commission_level}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            -{formatCurrency(item.commission_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!outflowsData?.commissions || outflowsData.commissions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                            本月暂无分成支出
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* 教练结算支出 */}
                <div>
                  <h4 className="font-medium mb-2">教练结算支出</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>支付时间</TableHead>
                        <TableHead>教练</TableHead>
                        <TableHead className="text-right">金额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outflowsData?.settlements?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{format(new Date(item.paid_at), 'MM-dd HH:mm')}</TableCell>
                          <TableCell>{item.human_coaches?.name || '未知教练'}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            -{formatCurrency(item.settlement_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!outflowsData?.settlements || outflowsData.settlements.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                            本月暂无教练结算支出
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 计算时间 */}
      {cashflowData?.calculated_at && (
        <div className="text-center text-sm text-muted-foreground">
          最后计算时间: {format(new Date(cashflowData.calculated_at), 'yyyy-MM-dd HH:mm:ss')}
        </div>
      )}
    </div>
  );
}

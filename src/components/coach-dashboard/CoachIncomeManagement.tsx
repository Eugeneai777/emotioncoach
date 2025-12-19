import { useState } from "react";
import { useCoachSettlements, useCoachBalance, useSettlementRules } from "@/hooks/useCoachSettlements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Wallet, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Star,
  AlertCircle,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CoachIncomeManagementProps {
  coachId: string;
}

export function CoachIncomeManagement({ coachId }: CoachIncomeManagementProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: balance } = useCoachBalance(coachId);
  const { data: pendingSettlements } = useCoachSettlements(coachId, 'pending');
  const { data: confirmedSettlements } = useCoachSettlements(coachId, 'confirmed');
  const { data: allSettlements } = useCoachSettlements(coachId);
  const { data: rules } = useSettlementRules();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">待确认</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">已确认</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">已打款</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">已取消</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const incomeCards = [
    {
      title: "可提现余额",
      value: `¥${balance?.available_balance?.toFixed(2) || '0.00'}`,
      icon: Wallet,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      description: "可申请提现的金额",
    },
    {
      title: "待结算金额",
      value: `¥${balance?.pending_balance?.toFixed(2) || '0.00'}`,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: `冷却期${rules?.confirm_days || 7}天后自动确认`,
    },
    {
      title: "累计收入",
      value: `¥${balance?.total_earnings?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "历史已确认总收入",
    },
    {
      title: "已提现",
      value: `¥${balance?.withdrawn_amount?.toFixed(2) || '0.00'}`,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: "历史提现总额",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">收入管理</h1>
          <p className="text-muted-foreground">查看您的结算明细和余额</p>
        </div>
      </div>

      {/* 结算规则说明 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">结算规则说明</p>
              <div className="text-blue-700 space-y-1">
                <p>• 基础佣金比例：{((rules?.base_commission_rate || 0.30) * 100).toFixed(0)}%</p>
                <p>• 5分评价：获得基础佣金的{((rules?.rating_5_multiplier || 1) * 100).toFixed(0)}%</p>
                <p>• 4分评价：获得基础佣金的{((rules?.rating_4_multiplier || 0.8) * 100).toFixed(0)}%</p>
                <p>• 3分评价：获得基础佣金的{((rules?.rating_3_multiplier || 0.6) * 100).toFixed(0)}%</p>
                <p>• {rules?.rating_2_threshold || 2}分以下：不予结算</p>
                <p>• 冷却期：学员评价后{rules?.confirm_days || 7}天自动确认结算</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {incomeCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            全部记录 ({allSettlements?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            待确认 ({pendingSettlements?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            已确认 ({confirmedSettlements?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>全部结算记录</CardTitle>
              <CardDescription>查看所有咨询的结算情况</CardDescription>
            </CardHeader>
            <CardContent>
              {allSettlements && allSettlements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>订单金额</TableHead>
                      <TableHead>评分</TableHead>
                      <TableHead>结算比例</TableHead>
                      <TableHead className="text-right">结算金额</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSettlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          {format(new Date(settlement.created_at), 'MM/dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell>¥{Number(settlement.order_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {settlement.rating_at_settlement || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-muted-foreground">
                                  {(Number(settlement.final_rate) * 100).toFixed(0)}%
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>基础{(Number(settlement.base_rate) * 100).toFixed(0)}% × 评分系数{(Number(settlement.rating_multiplier) * 100).toFixed(0)}%</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={settlement.status === 'cancelled' ? 'text-muted-foreground line-through' : 'text-emerald-600'}>
                            ¥{Number(settlement.settlement_amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(settlement.status)}
                          {settlement.cancel_reason && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-3.5 w-3.5 text-red-500 ml-1 inline" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{settlement.cancel_reason}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  暂无结算记录
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>待确认结算</CardTitle>
              <CardDescription>冷却期内的结算记录，到期后自动确认</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSettlements && pendingSettlements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>订单金额</TableHead>
                      <TableHead>评分</TableHead>
                      <TableHead className="text-right">结算金额</TableHead>
                      <TableHead>预计确认</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSettlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          {format(new Date(settlement.created_at), 'MM/dd', { locale: zhCN })}
                        </TableCell>
                        <TableCell>¥{Number(settlement.order_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {settlement.rating_at_settlement}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          ¥{Number(settlement.settlement_amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {settlement.confirm_at 
                            ? format(new Date(settlement.confirm_at), 'MM/dd', { locale: zhCN })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  暂无待确认结算
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>已确认结算</CardTitle>
              <CardDescription>冷却期已过，可申请提现</CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedSettlements && confirmedSettlements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>确认日期</TableHead>
                      <TableHead>订单金额</TableHead>
                      <TableHead>评分</TableHead>
                      <TableHead className="text-right">结算金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedSettlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          {settlement.confirmed_at 
                            ? format(new Date(settlement.confirmed_at), 'MM/dd', { locale: zhCN })
                            : '-'}
                        </TableCell>
                        <TableCell>¥{Number(settlement.order_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {settlement.rating_at_settlement}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          ¥{Number(settlement.settlement_amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  暂无已确认结算
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

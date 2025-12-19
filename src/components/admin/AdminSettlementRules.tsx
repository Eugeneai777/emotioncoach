import { useState } from "react";
import { useAllSettlementRules, useUpdateSettlementRules, useAllSettlements } from "@/hooks/useCoachSettlements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Settings, 
  Save,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";

export function AdminSettlementRules() {
  const [activeTab, setActiveTab] = useState("rules");
  const [settlementFilter, setSettlementFilter] = useState<string>("");
  
  const { data: rules, isLoading: rulesLoading } = useAllSettlementRules();
  const { data: allSettlements, isLoading: settlementsLoading } = useAllSettlements(settlementFilter || undefined);
  const updateRules = useUpdateSettlementRules();

  const activeRule = rules?.find(r => r.is_active);
  
  const [formData, setFormData] = useState({
    base_commission_rate: 30,
    rating_5_multiplier: 100,
    rating_4_multiplier: 80,
    rating_3_multiplier: 60,
    rating_2_threshold: 2,
    confirm_days: 7,
  });

  // 当规则数据加载后更新表单
  useState(() => {
    if (activeRule) {
      setFormData({
        base_commission_rate: Number(activeRule.base_commission_rate) * 100,
        rating_5_multiplier: Number(activeRule.rating_5_multiplier) * 100,
        rating_4_multiplier: Number(activeRule.rating_4_multiplier) * 100,
        rating_3_multiplier: Number(activeRule.rating_3_multiplier) * 100,
        rating_2_threshold: activeRule.rating_2_threshold,
        confirm_days: activeRule.confirm_days,
      });
    }
  });

  const handleSaveRules = async () => {
    if (!activeRule) return;

    try {
      await updateRules.mutateAsync({
        id: activeRule.id,
        base_commission_rate: formData.base_commission_rate / 100,
        rating_5_multiplier: formData.rating_5_multiplier / 100,
        rating_4_multiplier: formData.rating_4_multiplier / 100,
        rating_3_multiplier: formData.rating_3_multiplier / 100,
        rating_2_threshold: formData.rating_2_threshold,
        confirm_days: formData.confirm_days,
      });
      toast.success('结算规则已更新');
    } catch (error) {
      toast.error('更新失败，请重试');
    }
  };

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

  // 统计数据
  const stats = {
    total: allSettlements?.length || 0,
    pending: allSettlements?.filter(s => s.status === 'pending').length || 0,
    confirmed: allSettlements?.filter(s => s.status === 'confirmed').length || 0,
    paid: allSettlements?.filter(s => s.status === 'paid').length || 0,
    cancelled: allSettlements?.filter(s => s.status === 'cancelled').length || 0,
    totalAmount: allSettlements?.reduce((sum, s) => sum + (s.status !== 'cancelled' ? Number(s.settlement_amount) : 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">教练结算管理</h1>
        <p className="text-muted-foreground">配置结算规则和查看结算记录</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">总结算额</span>
            </div>
            <p className="text-xl font-bold mt-1">¥{stats.totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">待确认</span>
            </div>
            <p className="text-xl font-bold mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">已确认</span>
            </div>
            <p className="text-xl font-bold mt-1">{stats.confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">已打款</span>
            </div>
            <p className="text-xl font-bold mt-1">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">已取消</span>
            </div>
            <p className="text-xl font-bold mt-1">{stats.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-1" />
            结算规则
          </TabsTrigger>
          <TabsTrigger value="records">
            结算记录 ({stats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>结算规则配置</CardTitle>
              <CardDescription>设置教练收入的计算规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {rulesLoading ? (
                <p className="text-center text-muted-foreground py-4">加载中...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="base_rate">基础佣金比例 (%)</Label>
                      <Input
                        id="base_rate"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.base_commission_rate}
                        onChange={(e) => setFormData({ ...formData, base_commission_rate: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">教练可获得订单金额的百分比</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_days">冷却期 (天)</Label>
                      <Input
                        id="confirm_days"
                        type="number"
                        min="1"
                        max="30"
                        value={formData.confirm_days}
                        onChange={(e) => setFormData({ ...formData, confirm_days: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">学员评价后多少天自动确认结算</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      评分系数设置
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>5分评价系数 (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.rating_5_multiplier}
                          onChange={(e) => setFormData({ ...formData, rating_5_multiplier: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>4分评价系数 (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.rating_4_multiplier}
                          onChange={(e) => setFormData({ ...formData, rating_4_multiplier: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>3分评价系数 (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.rating_3_multiplier}
                          onChange={(e) => setFormData({ ...formData, rating_3_multiplier: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>不结算阈值 (分)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={formData.rating_2_threshold}
                          onChange={(e) => setFormData({ ...formData, rating_2_threshold: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      最终结算 = 订单金额 × 基础佣金 × 评分系数
                    </p>
                  </div>

                  {/* 计算示例 */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">结算示例（订单金额 ¥200）</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">5分评价</p>
                        <p className="font-medium text-emerald-600">
                          ¥{(200 * formData.base_commission_rate / 100 * formData.rating_5_multiplier / 100).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">4分评价</p>
                        <p className="font-medium text-emerald-600">
                          ¥{(200 * formData.base_commission_rate / 100 * formData.rating_4_multiplier / 100).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">3分评价</p>
                        <p className="font-medium text-emerald-600">
                          ¥{(200 * formData.base_commission_rate / 100 * formData.rating_3_multiplier / 100).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{formData.rating_2_threshold}分以下</p>
                        <p className="font-medium text-red-500">¥0.00</p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveRules} disabled={updateRules.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    保存规则
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>结算记录</CardTitle>
                  <CardDescription>查看所有教练的结算记录</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={settlementFilter === '' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setSettlementFilter('')}
                  >
                    全部
                  </Button>
                  <Button 
                    variant={settlementFilter === 'pending' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setSettlementFilter('pending')}
                  >
                    待确认
                  </Button>
                  <Button 
                    variant={settlementFilter === 'confirmed' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setSettlementFilter('confirmed')}
                  >
                    已确认
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {settlementsLoading ? (
                <p className="text-center text-muted-foreground py-8">加载中...</p>
              ) : allSettlements && allSettlements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>创建时间</TableHead>
                      <TableHead>教练</TableHead>
                      <TableHead>订单金额</TableHead>
                      <TableHead>评分</TableHead>
                      <TableHead>结算比例</TableHead>
                      <TableHead className="text-right">结算金额</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSettlements.map((settlement: any) => (
                      <TableRow key={settlement.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(settlement.created_at), 'MM/dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell>
                          {settlement.human_coaches?.name || '-'}
                        </TableCell>
                        <TableCell>¥{Number(settlement.order_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {settlement.rating_at_settlement || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(Number(settlement.final_rate) * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={settlement.status === 'cancelled' ? 'text-muted-foreground line-through' : 'text-emerald-600'}>
                            ¥{Number(settlement.settlement_amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(settlement.status)}</TableCell>
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
      </Tabs>
    </div>
  );
}

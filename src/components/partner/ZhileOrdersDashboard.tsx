import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Truck, CheckCircle, Clock, Download, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: 'pending', label: '待发货', color: 'bg-amber-100 text-amber-800' },
  { value: 'shipped', label: '已发货', color: 'bg-blue-100 text-blue-800' },
  { value: 'delivered', label: '已签收', color: 'bg-emerald-100 text-emerald-800' },
];

interface ZhileOrdersDashboardProps {
  isAdmin?: boolean;
}

export function ZhileOrdersDashboard({ isAdmin = false }: ZhileOrdersDashboardProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["zhile-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_zhile_orders") as { data: any[]; error: any };
      if (error) throw error;

      const userIds = [...new Set((data || []).map(o => o.user_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);
        if (profiles) {
          profiles.forEach(p => { profileMap[p.id] = p.display_name || ''; });
        }
      }

      return (data || []).map(order => ({
        ...order,
        user_display_name: profileMap[order.user_id] || '',
      }));
    },
  });

  const updateShipping = useMutation({
    mutationFn: async ({ orderId, status, note, source, field }: { orderId: string; status: string; note?: string; source?: string; field?: string; value?: string }) => {
      if (source === 'store_orders') {
        const updateData: Record<string, string> = {
          status: status === 'shipped' ? 'shipped' : status === 'delivered' ? 'completed' : 'paid',
        };
        if (note !== undefined) updateData.tracking_number = note;
        if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
        if (status === 'delivered') updateData.completed_at = new Date().toISOString();

        const { data, error } = await supabase
          .from("store_orders" as any)
          .update(updateData)
          .eq("id", orderId)
          .select("id");
        if (error) throw error;
        if (!data || (data as any[]).length === 0) throw new Error("无权限更新此订单，请联系管理员");
      } else {
        const updateData: Record<string, string> = { shipping_status: status };
        if (note !== undefined) updateData.shipping_note = note;

        const { data, error } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", orderId)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("无权限更新此订单，请联系管理员");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zhile-orders"] });
      toast.success("已更新");
    },
    onError: (err: Error) => toast.error(err.message || "更新失败"),
  });

  // 更新收货信息（收货人/手机号/地址）
  const updateBuyerInfo = useMutation({
    mutationFn: async ({ orderId, field, value, source }: { orderId: string; field: string; value: string; source?: string }) => {
      if (source === 'store_orders') {
        const { data, error } = await supabase
          .from("store_orders" as any)
          .update({ [field]: value })
          .eq("id", orderId)
          .select("id");
        if (error) throw error;
        if (!data || (data as any[]).length === 0) throw new Error("无权限更新");
      } else {
        const { data, error } = await supabase
          .from("orders")
          .update({ [field]: value })
          .eq("id", orderId)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("无权限更新");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zhile-orders"] });
      toast.success("已更新");
    },
    onError: (err: Error) => toast.error(err.message || "更新失败"),
  });

  const filtered = orders.filter(o => {
    const matchSearch = !searchTerm || 
      o.order_no?.includes(searchTerm) ||
      o.buyer_name?.includes(searchTerm) ||
      o.buyer_phone?.includes(searchTerm) ||
      o.id_card_name?.includes(searchTerm);
    const matchStatus = statusFilter === "all" || (o.shipping_status || 'pending') === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => !o.shipping_status || o.shipping_status === 'pending').length,
    shipped: orders.filter(o => o.shipping_status === 'shipped').length,
    delivered: orders.filter(o => o.shipping_status === 'delivered').length,
  };

  const exportCSV = () => {
    const headers = ['订单号', '来源', '用户昵称', '收货人', '手机号', '收货地址', '身份证姓名', '身份证号码', '金额', '物流状态', '快递单号/备注', '支付方式', '下单时间'];
    const rows = filtered.map(o => [
      o.order_no,
      o.source === 'store_orders' ? '商城' : '订单',
      o.user_display_name,
      o.buyer_name || '',
      o.buyer_phone || '',
      o.buyer_address || '',
      o.id_card_name || '',
      o.id_card_number || '',
      o.amount,
      STATUS_OPTIONS.find(s => s.value === (o.shipping_status || 'pending'))?.label || '待发货',
      o.shipping_note || '',
      o.pay_type === 'alipay' ? '支付宝' : o.pay_type ? '微信支付' : '-',
      o.paid_at ? format(new Date(o.paid_at), 'yyyy-MM-dd HH:mm') : '',
    ]);
    
    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `知乐订单_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5" />
            知乐胶囊订单管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "总订单", value: stats.total, icon: Package, color: "text-foreground" },
              { label: "待发货", value: stats.pending, icon: Clock, color: "text-amber-600" },
              { label: "已发货", value: stats.shipped, icon: Truck, color: "text-blue-600" },
              { label: "已签收", value: stats.delivered, icon: CheckCircle, color: "text-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-lg border bg-card text-center">
                <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索订单号、收货人、手机号..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="物流状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCSV} className="shrink-0">
              <Download className="h-4 w-4 mr-1" />
              导出CSV
            </Button>
          </div>

          {/* Orders Table */}
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">暂无订单数据</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">订单号</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>收货人</TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead className="min-w-[160px]">收货地址</TableHead>
                    <TableHead>清关信息</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>物流状态</TableHead>
                    <TableHead className="min-w-[140px]">快递单号</TableHead>
                    <TableHead>下单时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(order => {
                    const currentStatus = order.shipping_status || 'pending';
                    const statusInfo = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.order_no}
                          {order.source === 'store_orders' && (
                            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">商城</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{order.user_display_name || '-'}</TableCell>
                        <TableCell className="text-sm">{order.buyer_name || '-'}</TableCell>
                        <TableCell className="text-sm">{order.buyer_phone || '-'}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{order.buyer_address || '-'}</TableCell>
                        <TableCell className="text-xs">
                          {order.id_card_name ? (
                            <div>
                              <p>{order.id_card_name}</p>
                              <p className="text-muted-foreground">{order.id_card_number || '-'}</p>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">¥{order.amount}</TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Select
                              value={currentStatus}
                              onValueChange={(val) => updateShipping.mutate({ orderId: order.id, status: val, source: order.source })}
                            >
                              <SelectTrigger className="h-7 text-xs w-[90px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(s => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Input
                              className="h-7 text-xs w-[130px]"
                              placeholder="输入快递单号"
                              defaultValue={order.shipping_note || ''}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== (order.shipping_note || '')) {
                                  updateShipping.mutate({ orderId: order.id, status: currentStatus, note: val, source: order.source });
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">{order.shipping_note || '-'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {order.paid_at ? format(new Date(order.paid_at), 'MM-dd HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ZhileOrdersDashboard;

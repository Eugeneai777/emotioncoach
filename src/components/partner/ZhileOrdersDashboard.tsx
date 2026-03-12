import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Package, Truck, CheckCircle, Clock, Download, Search, Loader2, CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

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
    mutationFn: async ({ orderId, status, note, source }: { orderId: string; status: string; note?: string; source?: string }) => {
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

  const updateCustomsInfo = useMutation({
    mutationFn: async ({ orderId, idCardName, idCardNumber, source }: { orderId: string; idCardName: string; idCardNumber: string; source?: string }) => {
      if (source === 'store_orders') {
        const { data, error } = await supabase
          .from("store_orders" as any)
          .update({ id_card_name: idCardName, id_card_number: idCardNumber })
          .eq("id", orderId)
          .select("id");
        if (error) throw error;
        if (!data || (data as any[]).length === 0) throw new Error("无权限更新");
      } else {
        const { data, error } = await supabase
          .from("orders")
          .update({ id_card_name: idCardName, id_card_number: idCardNumber })
          .eq("id", orderId)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("无权限更新");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zhile-orders"] });
      toast.success("清关信息已更新");
    },
    onError: (err: Error) => toast.error(err.message || "更新失败"),
  });

  const updateNickname = useMutation({
    mutationFn: async ({ userId, value }: { userId: string; value: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ display_name: value })
        .eq("id", userId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("无权限更新昵称");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zhile-orders"] });
      toast.success("昵称已更新");
    },
    onError: (err: Error) => toast.error(err.message || "昵称更新失败"),
  });

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = !searchTerm || 
      o.order_no?.includes(searchTerm) ||
      o.buyer_name?.includes(searchTerm) ||
      o.buyer_phone?.includes(searchTerm) ||
      o.id_card_name?.includes(searchTerm) ||
      o.product_name?.includes(searchTerm);
    const matchStatus = statusFilter === "all" || (o.shipping_status || 'pending') === statusFilter;
    
    // Date range filter
    let matchDate = true;
    if (dateFrom || dateTo) {
      const orderDate = o.paid_at ? new Date(o.paid_at) : o.created_at ? new Date(o.created_at) : null;
      if (!orderDate) {
        matchDate = false;
      } else {
        if (dateFrom && isBefore(orderDate, startOfDay(dateFrom))) matchDate = false;
        if (dateTo && isAfter(orderDate, endOfDay(dateTo))) matchDate = false;
      }
    }
    
    return matchSearch && matchStatus && matchDate;
  }), [orders, searchTerm, statusFilter, dateFrom, dateTo]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => !o.shipping_status || o.shipping_status === 'pending').length,
    shipped: orders.filter(o => o.shipping_status === 'shipped').length,
    delivered: orders.filter(o => o.shipping_status === 'delivered').length,
  };

  const hasDateFilter = dateFrom || dateTo;

  const exportCSV = () => {
    const headers = ['下单时间', '商品名称', '订单号', '来源', '用户昵称', '收货人', '手机号', '收货地址', '身份证姓名', '身份证号码', '金额', '物流状态', '快递单号/备注', '支付方式'];
    const rows = filtered.map(o => [
      o.paid_at ? format(new Date(o.paid_at), 'yyyy-MM-dd HH:mm') : '',
      o.product_name || '-',
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
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索订单号、商品名称、收货人、手机号..."
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

            {/* Date range filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">下单日期:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, 'yyyy-MM-dd') : '开始日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={zhCN} initialFocus />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">至</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, 'yyyy-MM-dd') : '结束日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={zhCN} initialFocus />
                </PopoverContent>
              </Popover>
              {hasDateFilter && (
                <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  清除
                </Button>
              )}
              {hasDateFilter && (
                <span className="text-xs text-muted-foreground ml-auto">
                  筛选结果: {filtered.length} 条
                </span>
              )}
            </div>
          </div>

          {/* Orders Table */}
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">暂无订单数据</p>
          ) : (
            <>
              {/* Scroll hint + manual scroll buttons */}
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">← 左右滑动查看全部字段 →</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Force visible scrollbar on all platforms */}
              <style>{`
                .zhile-scroll-outer::-webkit-scrollbar { height: 12px; }
                .zhile-scroll-outer::-webkit-scrollbar-track { background: hsl(var(--muted)); border-radius: 6px; }
                .zhile-scroll-outer::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 6px; }
                .zhile-scroll-outer::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
                .zhile-scroll-outer { scrollbar-width: auto; scrollbar-color: hsl(var(--border)) hsl(var(--muted)); }
                .zhile-scroll-inner::-webkit-scrollbar { width: 10px; }
                .zhile-scroll-inner::-webkit-scrollbar-track { background: hsl(var(--muted)); border-radius: 6px; }
                .zhile-scroll-inner::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 6px; min-height: 40px; }
                .zhile-scroll-inner::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
                .zhile-scroll-inner { scrollbar-width: auto; scrollbar-color: hsl(var(--border)) hsl(var(--muted)); }
              `}</style>
              <div
                ref={scrollRef}
                className="zhile-scroll-outer border rounded-lg"
                style={{
                  overflowX: 'scroll',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div
                  className="zhile-scroll-inner"
                  style={{
                    overflowY: 'auto',
                    maxHeight: '60vh',
                    minWidth: '1900px',
                  }}
                >
                  <table className="w-max caption-bottom text-sm" style={{ minWidth: '1900px' }}>
                    <thead className="[&_tr]:border-b sticky top-0 z-10 bg-background">
                      <tr className="border-b">
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 110 }}>下单时间</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 160 }}>商品名称</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 150 }}>订单号</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 90 }}>用户</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 80 }}>收货人</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 120 }}>手机号</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 200 }}>收货地址</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 180 }}>清关信息</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 70 }}>金额</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 110 }}>物流状态</th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 160 }}>快递单号</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {filtered.map(order => {
                        const currentStatus = order.shipping_status || 'pending';
                        const statusInfo = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

                        return (
                          <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-3 align-middle text-xs text-muted-foreground whitespace-nowrap">
                              {order.paid_at ? format(new Date(order.paid_at), 'MM-dd HH:mm') : '-'}
                            </td>
                            <td className="p-3 align-middle whitespace-nowrap">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="text-sm font-medium max-w-[150px] truncate block cursor-pointer hover:text-primary">
                                    {order.product_name || '-'}
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="max-w-xs p-2">
                                  <p className="text-sm">{order.product_name}</p>
                                </PopoverContent>
                              </Popover>
                            </td>
                            <td className="p-3 align-middle font-mono text-xs whitespace-nowrap">
                              {order.order_no}
                              {order.source === 'store_orders' && (
                                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">商城</Badge>
                              )}
                            </td>
                            <td className="p-3 align-middle text-sm whitespace-nowrap">
                              {isAdmin ? (
                                <Input
                                  className="h-7 text-xs w-[80px]"
                                  placeholder="昵称"
                                  defaultValue={order.user_display_name || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val !== (order.user_display_name || '') && order.user_id) {
                                      updateNickname.mutate({ userId: order.user_id, value: val });
                                    }
                                  }}
                                />
                              ) : (order.user_display_name || '-')}
                            </td>
                            <td className="p-3 align-middle text-sm whitespace-nowrap">
                              {order.buyer_name || '-'}
                            </td>
                            <td className="p-3 align-middle text-sm whitespace-nowrap">
                              {order.buyer_phone || '-'}
                            </td>
                            <td className="p-3 align-middle text-xs whitespace-nowrap">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="max-w-[180px] truncate block cursor-pointer hover:text-primary">
                                    {order.buyer_address || '-'}
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="max-w-sm p-2">
                                  <p className="text-sm">{order.buyer_address}</p>
                                </PopoverContent>
                              </Popover>
                            </td>
                            <td className="p-3 align-middle text-xs whitespace-nowrap">
                              {isAdmin && (!order.id_card_name && !order.id_card_number) ? (
                                <div className="flex gap-1">
                                  <Input
                                    className="h-7 text-xs w-[60px]"
                                    placeholder="姓名"
                                    onBlur={(e) => {
                                      const name = e.target.value.trim();
                                      const numInput = e.target.parentElement?.querySelector<HTMLInputElement>('input:last-child');
                                      const num = numInput?.value?.trim() || '';
                                      if (name && num) {
                                        updateCustomsInfo.mutate({ orderId: order.id, idCardName: name, idCardNumber: num, source: order.source });
                                      }
                                    }}
                                  />
                                  <Input
                                    className="h-7 text-xs w-[90px]"
                                    placeholder="证件号"
                                  />
                                </div>
                              ) : order.id_card_name ? (
                                <div>
                                  <p>{order.id_card_name}</p>
                                  <p className="text-muted-foreground">{order.id_card_number || '-'}</p>
                                </div>
                              ) : <span className="text-muted-foreground">-</span>}
                            </td>
                            <td className="p-3 align-middle font-medium whitespace-nowrap">¥{order.amount}</td>
                            <td className="p-3 align-middle whitespace-nowrap">
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
                            </td>
                            <td className="p-3 align-middle whitespace-nowrap">
                              {isAdmin ? (
                                <Input
                                  className="h-7 text-xs w-[140px]"
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ZhileOrdersDashboard;

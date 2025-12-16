import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";

interface UnifiedOrder {
  id: string;
  order_id: string;
  user_id: string;
  package_name: string | null;
  amount: number;
  status: string;
  source: 'wechat_pay' | 'admin_charge';
  created_at: string;
}

export function OrdersTable() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      // 查询微信支付订单
      const { data: wechatOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) console.error('Error fetching orders:', ordersError);

      // 查询管理员充值记录
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) console.error('Error fetching subscriptions:', subError);

      // 合并数据，统一字段格式
      const allOrders: UnifiedOrder[] = [
        ...(wechatOrders?.map(o => ({
          id: o.id,
          order_id: o.order_no,
          user_id: o.user_id,
          package_name: o.package_name,
          amount: o.amount || 0,
          status: o.status,
          source: 'wechat_pay' as const,
          created_at: o.created_at,
        })) || []),
        ...(subscriptions?.map(s => ({
          id: s.id,
          order_id: s.mysql_order_id || s.id.slice(0, 8),
          user_id: s.user_id,
          package_name: s.combo_name,
          amount: s.combo_amount || 0,
          status: s.status,
          source: 'admin_charge' as const,
          created_at: s.created_at,
        })) || []),
      ];

      // 按创建时间排序
      return allOrders.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.user_id.toLowerCase().includes(search.toLowerCase()) ||
      order.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      order.package_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesSource && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'active':
        return <Badge className="bg-green-500">已完成</Badge>;
      case 'pending':
        return <Badge variant="secondary">待支付</Badge>;
      case 'expired':
        return <Badge variant="outline">已过期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    return source === 'wechat_pay' 
      ? <Badge className="bg-green-600">微信支付</Badge>
      : <Badge className="bg-blue-600">管理员充值</Badge>;
  };

  if (isLoading) return <div>加载中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="搜索用户ID、订单ID或套餐名..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="订单来源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部来源</SelectItem>
            <SelectItem value="wechat_pay">微信支付</SelectItem>
            <SelectItem value="admin_charge">管理员充值</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="订单状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="paid">已支付</SelectItem>
            <SelectItem value="active">已激活</SelectItem>
            <SelectItem value="pending">待支付</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground self-center">
          共 {filteredOrders?.length || 0} 条订单
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>订单ID</TableHead>
            <TableHead>用户ID</TableHead>
            <TableHead>套餐名</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>来源</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders?.map((order) => (
            <TableRow key={`${order.source}-${order.id}`}>
              <TableCell className="font-mono text-sm">
                {order.order_id?.slice(0, 12) || order.id.slice(0, 8)}...
              </TableCell>
              <TableCell className="font-mono text-sm">{order.user_id.slice(0, 8)}...</TableCell>
              <TableCell>{order.package_name === 'custom' ? '管理员充值' : (order.package_name || '-')}</TableCell>
              <TableCell>¥{order.amount}</TableCell>
              <TableCell>{getSourceBadge(order.source)}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell>{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
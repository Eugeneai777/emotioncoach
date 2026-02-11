import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";

interface UnifiedOrder {
  id: string;
  order_id: string;
  user_id: string;
  package_name: string | null;
  amount: number;
  status: string;
  source: 'wechat_pay' | 'alipay_pay' | 'admin_charge';
  created_at: string;
  user_display_name?: string | null;
  user_avatar_url?: string | null;
}

export function OrdersTable() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      // 查询微信/支付宝订单
      const { data: wechatOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*, pay_type')
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
          source: (o.pay_type === 'alipay_h5' ? 'alipay_pay' : 'wechat_pay') as 'wechat_pay' | 'alipay_pay',
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

      // 获取所有唯一用户ID
      const userIds = [...new Set(allOrders.map(o => o.user_id).filter(Boolean))];

      // 批量查询 profiles 表
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      // 合并用户资料到订单
      const ordersWithProfiles = allOrders.map(order => ({
        ...order,
        user_display_name: profiles?.find(p => p.id === order.user_id)?.display_name,
        user_avatar_url: profiles?.find(p => p.id === order.user_id)?.avatar_url,
      }));

      // 按创建时间排序
      return ordersWithProfiles.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  // 提取不重复的商品名称
  const uniquePackages = [...new Set(orders?.map(o => o.package_name).filter(Boolean) as string[])].sort();

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      (order.user_id || '').toLowerCase().includes(search.toLowerCase()) ||
      order.user_display_name?.toLowerCase().includes(search.toLowerCase()) ||
      (order.order_id || '').toLowerCase().includes(search.toLowerCase()) ||
      order.package_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;
    const matchesStatus = packageFilter !== 'all' 
      ? (order.status === 'paid' || order.status === 'active')
      : (statusFilter === 'all' || order.status === statusFilter);
    const matchesPackage = packageFilter === 'all' || order.package_name === packageFilter;
    
    return matchesSearch && matchesSource && matchesStatus && matchesPackage;
  });

  const exportToCSV = () => {
    if (!filteredOrders?.length) return;

    const headers = ['订单号', '用户昵称', '用户ID', '套餐名称', '金额', '订单来源', '状态', '创建时间'];
    const statusMap: Record<string, string> = { paid: '已支付', active: '已激活', pending: '待支付', expired: '已过期' };
    const sourceMap: Record<string, string> = { wechat_pay: '微信支付', alipay_pay: '支付宝', admin_charge: '管理员充值' };

    const rows = filteredOrders.map(order => [
      order.order_id || order.id,
      order.user_display_name || '未设置昵称',
      order.user_id,
      order.package_name === 'custom' ? '管理员充值' : (order.package_name || '-'),
      order.amount.toString(),
      sourceMap[order.source] || order.source,
      statusMap[order.status] || order.status,
      format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `订单明细_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

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
    if (source === 'alipay_pay') {
      return <Badge className="bg-blue-600">支付宝</Badge>;
    }
    return source === 'wechat_pay' 
      ? <Badge className="bg-green-600">微信支付</Badge>
      : <Badge className="bg-purple-600">管理员充值</Badge>;
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
            <SelectItem value="alipay_pay">支付宝</SelectItem>
            <SelectItem value="admin_charge">管理员充值</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter} disabled={packageFilter !== 'all'}>
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
        <Select value={packageFilter} onValueChange={setPackageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="商品筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部商品</SelectItem>
            {uniquePackages.map(pkg => (
              <SelectItem key={pkg} value={pkg}>
                {pkg === 'custom' ? '管理员充值' : pkg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground self-center">
          共 {filteredOrders?.length || 0} 条订单
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={!filteredOrders?.length}
          className="gap-2 ml-auto"
        >
          <Download className="w-4 h-4" />
          导出 CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>订单ID</TableHead>
            <TableHead>用户</TableHead>
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
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={order.user_avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(order.user_display_name || order.user_id || "??").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {order.user_display_name || '未设置昵称'}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {(order.user_id || '').slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </TableCell>
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
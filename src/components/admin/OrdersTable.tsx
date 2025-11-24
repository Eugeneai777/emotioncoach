import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";

export function OrdersTable() {
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const filteredOrders = orders?.filter(order => 
    order.user_id.toLowerCase().includes(search.toLowerCase()) ||
    order.mysql_order_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div>加载中...</div>;

  return (
    <div className="space-y-4">
      <Input
        placeholder="搜索用户ID或订单ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>订单ID</TableHead>
            <TableHead>用户ID</TableHead>
            <TableHead>套餐名</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders?.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-sm">
                {order.mysql_order_id || order.id.slice(0, 8)}
              </TableCell>
              <TableCell className="font-mono text-sm">{order.user_id.slice(0, 8)}...</TableCell>
              <TableCell>{order.combo_name || '-'}</TableCell>
              <TableCell>¥{order.combo_amount || 0}</TableCell>
              <TableCell>
                <Badge variant="outline">{order.subscription_type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={order.status === 'active' ? 'default' : 'secondary'}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

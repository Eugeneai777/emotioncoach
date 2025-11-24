import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function PurchaseHistory() {
  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchase-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>加载中...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>购买历史</CardTitle>
        <CardDescription>查看您的充值记录</CardDescription>
      </CardHeader>
      <CardContent>
        {purchases && purchases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>套餐名称</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>次数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>购买时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{purchase.combo_name || '-'}</TableCell>
                  <TableCell>¥{purchase.combo_amount || 0}</TableCell>
                  <TableCell>{purchase.total_quota || 0}次</TableCell>
                  <TableCell>
                    <Badge variant={purchase.status === 'active' ? 'default' : 'secondary'}>
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(purchase.created_at), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">暂无购买记录</p>
        )}
      </CardContent>
    </Card>
  );
}

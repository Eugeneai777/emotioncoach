import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Receipt, Calendar, Coins, Package, CreditCard, Gift } from "lucide-react";

interface UnifiedPurchaseRecord {
  id: string;
  source: 'wechat_pay' | 'admin_charge';
  name: string;
  amount: number;
  quota?: number;
  status: string;
  created_at: string;
}

export function PurchaseHistory() {
  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchase-history-unified'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      // 并行查询 orders 和 subscriptions 两张表
      const [ordersResult, subscriptionsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_no, package_name, amount, status, paid_at, created_at')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('subscriptions')
          .select('id, combo_name, combo_amount, total_quota, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      // 合并并格式化为统一结构
      const records: UnifiedPurchaseRecord[] = [
        ...(ordersResult.data || []).map(o => ({
          id: o.id,
          source: 'wechat_pay' as const,
          name: o.package_name || '套餐购买',
          amount: o.amount || 0,
          status: o.status,
          created_at: o.paid_at || o.created_at,
        })),
        ...(subscriptionsResult.data || []).map(s => ({
          id: s.id,
          source: 'admin_charge' as const,
          name: s.combo_name || '套餐充值',
          amount: s.combo_amount || 0,
          quota: s.total_quota,
          status: s.status,
          created_at: s.created_at,
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return records;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">已完成</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">已过期</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200">已取消</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceIcon = (source: 'wechat_pay' | 'admin_charge') => {
    if (source === 'wechat_pay') {
      return <CreditCard className="h-4 w-4 text-green-600" />;
    }
    return <Gift className="h-4 w-4 text-amber-600" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            购买历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-muted rounded-lg h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          购买历史
        </CardTitle>
        <CardDescription className="text-xs">查看您的充值和购买记录</CardDescription>
      </CardHeader>
      <CardContent>
        {purchases && purchases.length > 0 ? (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getSourceIcon(purchase.source)}
                    <span className="font-medium text-sm truncate">
                      {purchase.name}
                    </span>
                  </div>
                  {getStatusBadge(purchase.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5" />
                    <span>¥{purchase.amount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {purchase.quota ? (
                      <span className="text-primary font-medium">+{purchase.quota}次</span>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0">
                        {purchase.source === 'wechat_pay' ? '微信支付' : '管理员充值'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(purchase.created_at), 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">暂无购买记录</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
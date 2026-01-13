import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Receipt, Calendar, Coins, Package } from "lucide-react";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">生效中</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">已过期</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200">已取消</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
        <CardDescription className="text-xs">查看您的充值记录</CardDescription>
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
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-sm truncate">
                      {purchase.combo_name || '套餐充值'}
                    </span>
                  </div>
                  {getStatusBadge(purchase.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5" />
                    <span>¥{purchase.combo_amount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-medium">+{purchase.total_quota || 0}次</span>
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

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Receipt, Calendar, Coins, CreditCard, Gift, Truck, MapPin, ChevronDown, ChevronUp, Clock, CheckCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const SHIPPING_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待发货", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  shipped: { label: "已发货", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  delivered: { label: "已签收", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

interface UnifiedPurchaseRecord {
  id: string;
  source: 'wechat_pay' | 'alipay_pay' | 'admin_charge';
  name: string;
  amount: number;
  quota?: number;
  status: string;
  created_at: string;
  // shipping fields (only for orders with buyer_address)
  order_no?: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_address?: string;
  shipping_status?: string;
  shipping_note?: string;
}

export function PurchaseHistory() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchase-history-unified'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const [ordersResult, subscriptionsResult, storeOrdersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_no, package_name, amount, status, paid_at, created_at, pay_type, buyer_name, buyer_phone, buyer_address, shipping_status, shipping_note')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('subscriptions')
          .select('id, combo_name, combo_amount, total_quota, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('store_orders' as any)
          .select('id, order_no, product_name, price, quantity, status, paid_at, created_at, buyer_name, buyer_phone, buyer_address, tracking_number')
          .eq('buyer_id', user.id)
          .in('status', ['paid', 'shipped', 'completed'])
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      const records: UnifiedPurchaseRecord[] = [
        ...(ordersResult.data || []).map(o => ({
          id: o.id,
          source: (o.pay_type === 'alipay_h5' ? 'alipay_pay' : 'wechat_pay') as 'wechat_pay' | 'alipay_pay',
          name: o.package_name || '套餐购买',
          amount: o.amount || 0,
          status: o.status,
          created_at: o.paid_at || o.created_at,
          order_no: o.order_no,
          buyer_name: o.buyer_name,
          buyer_phone: o.buyer_phone,
          buyer_address: o.buyer_address,
          shipping_status: o.shipping_status,
          shipping_note: o.shipping_note,
        })),
        ...(subscriptionsResult.data || []).map(s => ({
          id: s.id,
          source: 'admin_charge' as const,
          name: s.combo_name || '套餐充值',
          amount: s.combo_amount || 0,
          quota: s.total_quota,
          status: s.status,
          created_at: s.created_at,
        })),
        ...((storeOrdersResult.data as any[]) || []).map((so: any) => ({
          id: so.id,
          source: 'wechat_pay' as const,
          name: so.product_name || '商城购买',
          amount: so.price || 0,
          status: so.status === 'completed' ? 'paid' : so.status,
          created_at: so.paid_at || so.created_at,
          order_no: so.order_no,
          buyer_name: so.buyer_name,
          buyer_phone: so.buyer_phone,
          buyer_address: so.buyer_address,
          shipping_status: so.status === 'paid' ? 'pending' : so.status === 'shipped' ? 'shipped' : so.status === 'completed' ? 'delivered' : 'pending',
          shipping_note: so.tracking_number,
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

  const getSourceIcon = (source: 'wechat_pay' | 'alipay_pay' | 'admin_charge') => {
    if (source === 'alipay_pay') return <CreditCard className="h-4 w-4 text-blue-600" />;
    if (source === 'wechat_pay') return <CreditCard className="h-4 w-4 text-green-600" />;
    return <Gift className="h-4 w-4 text-amber-600" />;
  };

  const hasShipping = (p: UnifiedPurchaseRecord) => !!p.buyer_address;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            已购订单
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
          已购订单
        </CardTitle>
        <CardDescription className="text-xs">查看您的购买记录与物流信息</CardDescription>
      </CardHeader>
      <CardContent>
        {purchases && purchases.length > 0 ? (
          <div className="space-y-3">
            {purchases.map((purchase) => {
              const expanded = expandedId === purchase.id;
              const shippable = hasShipping(purchase);
              const shippingInfo = shippable ? SHIPPING_STATUS_MAP[purchase.shipping_status || 'pending'] || SHIPPING_STATUS_MAP.pending : null;

              return (
                <div
                  key={purchase.id}
                  className={cn(
                    "rounded-lg border bg-card transition-colors overflow-hidden",
                    shippable && "cursor-pointer hover:bg-accent/50"
                  )}
                  onClick={() => shippable && setExpandedId(expanded ? null : purchase.id)}
                >
                  {/* Main order info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {getSourceIcon(purchase.source)}
                        <span className="font-medium text-sm truncate">{purchase.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {shippingInfo && (
                          <Badge className={cn("text-[10px]", shippingInfo.color)}>{shippingInfo.label}</Badge>
                        )}
                        {getStatusBadge(purchase.status)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Coins className="h-3.5 w-3.5" />
                          ¥{purchase.amount}
                        </span>
                        {purchase.quota && (
                          <span className="text-primary font-medium">+{purchase.quota}次</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(purchase.created_at), 'yyyy-MM-dd HH:mm')}
                        </span>
                      </div>
                      {shippable && (
                        <div className="flex items-center gap-1 text-primary">
                          <Truck className="h-3.5 w-3.5" />
                          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline shipping detail (expanded) */}
                  {expanded && shippable && (
                    <div className="border-t bg-muted/30 p-3 space-y-2.5 text-xs">
                      {purchase.shipping_note && (
                        <div className="flex items-start gap-2 text-muted-foreground bg-background p-2 rounded">
                          <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                          <span>{purchase.shipping_note}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <div>
                          <span>{purchase.buyer_name} {purchase.buyer_phone}</span>
                          <p className="mt-0.5">{purchase.buyer_address}</p>
                        </div>
                      </div>
                      {purchase.order_no && (
                        <div className="text-muted-foreground/70 pt-1 border-t border-border/50">
                          订单号: {purchase.order_no}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

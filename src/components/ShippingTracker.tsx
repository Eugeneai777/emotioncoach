import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: "待发货", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: Clock },
  shipped: { label: "已发货", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Truck },
  delivered: { label: "已签收", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle },
};

export function ShippingTracker() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["shipping-orders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const [ordersRes, storeRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_no, package_name, amount, buyer_name, buyer_phone, buyer_address, shipping_status, shipping_note, paid_at, created_at")
          .eq("user_id", user.id)
          .eq("status", "paid")
          .not("buyer_address", "is", null)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("store_orders" as any)
          .select("id, order_no, product_name, price, buyer_name, buyer_phone, buyer_address, tracking_number, status, paid_at, created_at")
          .eq("buyer_id", user.id)
          .in("status", ["paid", "shipped", "completed"])
          .not("buyer_address", "is", null)
          .order("created_at", { ascending: false })
          .limit(20)
      ]);

      if (ordersRes.error) throw ordersRes.error;

      const standardOrders = ordersRes.data || [];
      const storeOrders = ((storeRes.data as any[]) || []).map((so: any) => ({
        id: so.id,
        order_no: so.order_no,
        package_name: so.product_name,
        amount: so.price,
        buyer_name: so.buyer_name,
        buyer_phone: so.buyer_phone,
        buyer_address: so.buyer_address,
        shipping_status: so.status === 'paid' ? 'pending' : so.status === 'shipped' ? 'shipped' : so.status === 'completed' ? 'delivered' : 'pending',
        shipping_note: so.tracking_number,
        paid_at: so.paid_at,
        created_at: so.created_at,
      }));

      return [...standardOrders, ...storeOrders].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-5 w-5" />
          物流配送
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order) => {
          const status = STATUS_MAP[order.shipping_status || "pending"] || STATUS_MAP.pending;
          const StatusIcon = status.icon;

          return (
            <div key={order.id} className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{order.package_name || "商品"}</p>
                <Badge className={status.color}>{status.label}</Badge>
              </div>

              {order.shipping_note && (
                <div className="flex items-start gap-2 text-xs bg-muted/50 p-2 rounded">
                  <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <span className="text-muted-foreground">快递单号：</span>
                    <span className="font-medium text-foreground select-all">{order.shipping_note}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <span>{order.buyer_name} {order.buyer_phone}</span>
                  <p className="mt-0.5">{order.buyer_address}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>订单号: {order.order_no}</span>
                <span>{order.paid_at ? format(new Date(order.paid_at), "yyyy-MM-dd") : ""}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

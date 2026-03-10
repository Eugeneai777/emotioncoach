import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, CheckCircle2, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface ShippingOrder {
  id: string;
  order_no: string;
  package_name: string;
  buyer_name: string;
  buyer_address: string;
  shipping_status: string;
  shipping_note: string | null;
  created_at: string;
  amount: number;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "待发货", icon: Clock, color: "text-amber-500" },
  shipped: { label: "已发货", icon: Truck, color: "text-blue-500" },
  delivered: { label: "已签收", icon: CheckCircle2, color: "text-green-500" },
};

export function ShippingTracker({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("orders")
      .select("id, order_no, package_name, buyer_name, buyer_address, shipping_status, shipping_note, created_at, amount")
      .eq("user_id", userId)
      .eq("status", "paid")
      .not("buyer_address", "is", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data as any);
        setLoading(false);
      });
  }, [userId]);

  if (loading || orders.length === 0) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          物流信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => {
          const sc = statusConfig[order.shipping_status] || statusConfig.pending;
          const StatusIcon = sc.icon;
          return (
            <div key={order.id} className="p-3 rounded-lg bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{order.package_name}</p>
                <div className={`flex items-center gap-1 text-xs font-medium ${sc.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {sc.label}
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>订单号：{order.order_no}</p>
                <p>下单时间：{format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}</p>
                {order.buyer_address && (
                  <p className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    {order.buyer_name} · {order.buyer_address}
                  </p>
                )}
                {order.shipping_note && (
                  <p className="text-primary/80">📝 {order.shipping_note}</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

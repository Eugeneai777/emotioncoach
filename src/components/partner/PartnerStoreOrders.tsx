import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Package, Truck, MapPin, Phone, User } from "lucide-react";
import { toast } from "sonner";

interface PartnerStoreOrdersProps {
  partnerId: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待支付", color: "bg-muted text-muted-foreground" },
  paid: { label: "待发货", color: "bg-orange-100 text-orange-700" },
  shipped: { label: "已发货", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-emerald-100 text-emerald-700" },
};

export function PartnerStoreOrders({ partnerId }: PartnerStoreOrdersProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [shipDialogOrder, setShipDialogOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["partner-store-orders", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_orders" as any)
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const shipMutation = useMutation({
    mutationFn: async () => {
      if (!shipDialogOrder || !trackingNumber.trim()) return;
      const { error } = await supabase
        .from("store_orders" as any)
        .update({
          status: "shipped",
          tracking_number: trackingNumber.trim(),
          shipped_at: new Date().toISOString(),
        })
        .eq("id", shipDialogOrder.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("已标记发货");
      queryClient.invalidateQueries({ queryKey: ["partner-store-orders", partnerId] });
      setShipDialogOrder(null);
      setTrackingNumber("");
    },
    onError: (err: any) => toast.error("操作失败: " + err.message),
  });

  const filtered = statusFilter === "all"
    ? orders
    : orders.filter((o: any) => o.status === statusFilter);

  const paidCount = orders.filter((o: any) => o.status === "paid").length;

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">全部 ({orders.length})</TabsTrigger>
          <TabsTrigger value="paid">
            待发货 ({paidCount})
            {paidCount > 0 && <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full inline-block" />}
          </TabsTrigger>
          <TabsTrigger value="shipped">已发货</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">暂无订单</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
            return (
              <Card key={order.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{order.product_name}</p>
                      <p className="text-xs text-muted-foreground">订单号: {order.order_no}</p>
                    </div>
                    <Badge className={st.color}>{st.label}</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-destructive">¥{order.price}</span>
                    <span className="text-xs text-muted-foreground">× {order.quantity}</span>
                  </div>
                  {/* Buyer info */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{order.buyer_name || "未填写"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{order.buyer_phone || "未填写"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                      <span className="flex-1">{order.buyer_address || "未填写"}</span>
                    </div>
                  </div>
                  {order.tracking_number && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="w-3.5 h-3.5" />
                      <span>物流单号: {order.tracking_number}</span>
                    </div>
                  )}
                  {order.status === "paid" && (
                    <Button size="sm" className="w-full" onClick={() => { setShipDialogOrder(order); setTrackingNumber(""); }}>
                      <Truck className="w-4 h-4 mr-1" />
                      填写物流单号 · 发货
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!shipDialogOrder} onOpenChange={v => !v && setShipDialogOrder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>发货</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              商品: {shipDialogOrder?.product_name}
            </p>
            <div>
              <Input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="请输入物流单号"
              />
            </div>
            <Button
              onClick={() => shipMutation.mutate()}
              disabled={!trackingNumber.trim() || shipMutation.isPending}
              className="w-full"
            >
              {shipMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Truck className="w-4 h-4 mr-1" />}
              确认发货
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, Plus, Clock, Users, Tag, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface PartnerPromotionManagerProps {
  partnerId: string;
  partnerCode?: string;
}

interface Promotion {
  id: string;
  title: string;
  promotion_type: string;
  description: string | null;
  original_price: number | null;
  promo_price: number;
  max_participants: number | null;
  current_participants: number;
  starts_at: string;
  ends_at: string;
  status: string;
  promo_code: string | null;
  created_at: string;
}

function generatePromoCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PROMO-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function PartnerPromotionManager({ partnerId, partnerCode }: PartnerPromotionManagerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    promotion_type: "flash_sale",
    description: "",
    original_price: "",
    promo_price: "",
    max_participants: "",
    starts_at: "",
    ends_at: "",
  });

  useEffect(() => {
    loadPromotions();
  }, [partnerId]);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      // Use edge function or direct query via service role
      // For now, we'll use direct query since the table has service_role policy
      // In production, use an edge function
      const { data, error } = await supabase.functions.invoke("manage-partner-promotions", {
        body: { action: "list", partner_id: partnerId },
      });
      if (data?.promotions) {
        setPromotions(data.promotions);
      }
    } catch (err) {
      console.error("Load promotions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.promo_price || !form.starts_at || !form.ends_at) {
      toast.error("请填写必要信息");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-partner-promotions", {
        body: {
          action: "create",
          partner_id: partnerId,
          ...form,
          original_price: form.original_price ? parseFloat(form.original_price) : null,
          promo_price: parseFloat(form.promo_price),
          max_participants: form.max_participants ? parseInt(form.max_participants) : null,
          promo_code: generatePromoCode(),
        },
      });
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success("活动创建成功");
      setDialogOpen(false);
      setForm({
        title: "",
        promotion_type: "flash_sale",
        description: "",
        original_price: "",
        promo_price: "",
        max_participants: "",
        starts_at: "",
        ends_at: "",
      });
      loadPromotions();
    } catch (err: any) {
      toast.error("创建失败: " + (err.message || "请重试"));
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (promoId: string, newStatus: string) => {
    try {
      await supabase.functions.invoke("manage-partner-promotions", {
        body: { action: "update_status", partner_id: partnerId, promotion_id: promoId, status: newStatus },
      });
      setPromotions((prev) =>
        prev.map((p) => (p.id === promoId ? { ...p, status: newStatus } : p))
      );
      toast.success("状态已更新");
    } catch {
      toast.error("更新失败");
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("优惠码已复制");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-0">进行中</Badge>;
      case "ended":
        return <Badge variant="secondary">已结束</Badge>;
      case "cancelled":
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge variant="outline">草稿</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "flash_sale": return "限时优惠";
      case "group_buy": return "拼团";
      case "limited_offer": return "限量特价";
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          营销活动
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              创建活动
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>创建营销活动</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">活动名称</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="如：新春限时特惠"
                />
              </div>
              <div>
                <label className="text-sm font-medium">活动类型</label>
                <Select value={form.promotion_type} onValueChange={(v) => setForm({ ...form, promotion_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flash_sale">限时优惠</SelectItem>
                    <SelectItem value="group_buy">拼团</SelectItem>
                    <SelectItem value="limited_offer">限量特价</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">原价 (¥)</label>
                  <Input
                    type="number"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    placeholder="选填"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">活动价 (¥) *</label>
                  <Input
                    type="number"
                    value={form.promo_price}
                    onChange={(e) => setForm({ ...form, promo_price: e.target.value })}
                    placeholder="必填"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">限制人数</label>
                <Input
                  type="number"
                  value={form.max_participants}
                  onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                  placeholder="留空不限"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">开始时间 *</label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">结束时间 *</label>
                  <Input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">活动描述</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="活动详细说明..."
                  rows={2}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                创建活动
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : promotions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>还没有营销活动</p>
            <p className="text-sm mt-1">创建限时优惠或拼团活动来吸引更多用户</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <Card key={promo.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{promo.title}</h4>
                      {getStatusBadge(promo.status)}
                      <Badge variant="outline" className="text-xs">{getTypeLabel(promo.promotion_type)}</Badge>
                    </div>
                    {promo.description && (
                      <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {promo.original_price && (
                      <span className="line-through text-muted-foreground">¥{promo.original_price}</span>
                    )}
                    <span className="font-bold text-primary">¥{promo.promo_price}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {format(new Date(promo.starts_at), "MM/dd")} - {format(new Date(promo.ends_at), "MM/dd")}
                  </div>
                  {promo.max_participants && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {promo.current_participants}/{promo.max_participants}
                    </div>
                  )}
                  {promo.promo_code && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => copyCode(promo.promo_code!)}
                    >
                      {copiedCode === promo.promo_code ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {promo.promo_code}
                    </Button>
                  )}
                </div>

                {promo.status === "draft" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleStatusChange(promo.id, "active")}>
                      发布活动
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(promo.id, "cancelled")}>
                      取消
                    </Button>
                  </div>
                )}
                {promo.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => handleStatusChange(promo.id, "ended")}
                  >
                    结束活动
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

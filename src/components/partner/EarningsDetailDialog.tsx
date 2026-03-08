import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Search, Loader2, TrendingUp, Wallet, Users, ArrowDownCircle } from "lucide-react";

export type DetailType = "earnings" | "pending" | "available" | "withdrawn" | "referrals_l1" | "referrals_l2";

interface EarningsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  type: DetailType;
}

interface Commission {
  id: string;
  order_type: string;
  order_amount: number;
  commission_level: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  processed_at: string | null;
}

interface Referral {
  id: string;
  referred_user_id: string;
  created_at: string;
  conversion_status: string | null;
  profile?: { display_name: string | null } | null;
  orders?: { package_name: string; amount: number; created_at: string }[];
}

const TYPE_CONFIG: Record<DetailType, { title: string; icon: React.ReactNode }> = {
  earnings: { title: "累计收益明细", icon: <TrendingUp className="w-5 h-5 text-orange-500" /> },
  pending: { title: "待确认佣金明细", icon: <TrendingUp className="w-5 h-5 text-amber-500" /> },
  available: { title: "可提现明细", icon: <Wallet className="w-5 h-5 text-orange-500" /> },
  withdrawn: { title: "已提现记录", icon: <ArrowDownCircle className="w-5 h-5 text-orange-500" /> },
  referrals_l1: { title: "直推用户明细", icon: <Users className="w-5 h-5 text-orange-500" /> },
  referrals_l2: { title: "二级用户明细", icon: <Users className="w-5 h-5 text-orange-500" /> },
};

const ORDER_TYPE_NAMES: Record<string, string> = {
  basic: "尝鲜会员",
  member365: "365会员",
  partner: "合伙人套餐",
  store_product: "商城商品",
  hqj_7day_trial: "好奇劲7天体验",
};

export function EarningsDetailDialog({ open, onOpenChange, partnerId, type }: EarningsDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissionFilter, setCommissionFilter] = useState<"all" | "pending" | "confirmed">("all");

  useEffect(() => {
    if (!open) return;
    setSearch("");
    loadData();
  }, [open, partnerId, type]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (type === "earnings" || type === "available") {
        const query = supabase
          .from("partner_commissions")
          .select("id, order_type, order_amount, commission_level, commission_rate, commission_amount, status, created_at")
          .eq("partner_id", partnerId)
          .order("created_at", { ascending: false });

        if (type === "available") {
          query.eq("status", "confirmed");
        }

        const { data } = await query;
        setCommissions((data as Commission[]) || []);
      } else if (type === "withdrawn") {
        const { data } = await supabase
          .from("partner_withdrawals")
          .select("id, amount, status, payment_method, created_at, processed_at")
          .eq("partner_id", partnerId)
          .order("created_at", { ascending: false });
        setWithdrawals((data as Withdrawal[]) || []);
      } else {
        // referrals
        const level = type === "referrals_l1" ? 1 : 2;
        const { data } = await supabase
          .from("partner_referrals")
          .select("id, referred_user_id, created_at, conversion_status")
          .eq("partner_id", partnerId)
          .eq("level", level)
          .order("created_at", { ascending: false });

        const refs = (data || []) as Referral[];
        // Fetch profiles
        const userIds = refs.map((r) => r.referred_user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds);
          const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

          // Fetch orders for these users
          const { data: orders } = await supabase
            .from("orders")
            .select("user_id, package_name, amount, created_at")
            .in("user_id", userIds)
            .eq("status", "paid")
            .order("created_at", { ascending: false });

          const orderMap = new Map<string, { package_name: string; amount: number; created_at: string }[]>();
          (orders || []).forEach((o: any) => {
            if (!orderMap.has(o.user_id)) orderMap.set(o.user_id, []);
            orderMap.get(o.user_id)!.push({ package_name: o.package_name, amount: o.amount, created_at: o.created_at });
          });

          refs.forEach((r) => {
            r.profile = profileMap.get(r.referred_user_id) || null;
            r.orders = orderMap.get(r.referred_user_id) || [];
          });
        }
        setReferrals(refs);
      }
    } catch (err) {
      console.error("Load detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommissions = useMemo(() => {
    let list = commissions;
    if (commissionFilter !== "all") {
      list = list.filter((c) => c.status === commissionFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => (ORDER_TYPE_NAMES[c.order_type] || c.order_type).toLowerCase().includes(q));
    }
    return list;
  }, [commissions, commissionFilter, search]);

  const filteredWithdrawals = useMemo(() => {
    if (!search) return withdrawals;
    const q = search.toLowerCase();
    return withdrawals.filter((w) => w.status.includes(q) || w.payment_method.includes(q));
  }, [withdrawals, search]);

  const filteredReferrals = useMemo(() => {
    if (!search) return referrals;
    const q = search.toLowerCase();
    return referrals.filter(
      (r) =>
        (r.profile?.display_name || "").toLowerCase().includes(q) ||
        (r.orders || []).some((o) => (o.package_name || "").toLowerCase().includes(q))
    );
  }, [referrals, search]);

  const config = TYPE_CONFIG[type];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "secondary" | "default" | "destructive"; label: string }> = {
      pending: { variant: "secondary", label: "待确认" },
      confirmed: { variant: "default", label: "已确认" },
      cancelled: { variant: "destructive", label: "已取消" },
      processing: { variant: "secondary", label: "处理中" },
      completed: { variant: "default", label: "已完成" },
      rejected: { variant: "destructive", label: "已拒绝" },
    };
    const c = map[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getConversionBadge = (status: string | null) => {
    const map: Record<string, { variant: "secondary" | "default" | "outline"; label: string }> = {
      registered: { variant: "outline", label: "已注册" },
      purchased_365: { variant: "default", label: "已购365" },
      became_partner: { variant: "default", label: "已成为合伙人" },
    };
    const c = map[status || ""] || { variant: "outline" as const, label: "已注册" };
    return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Commission filter tabs */}
        {(type === "earnings" || type === "available") && (
          <Tabs value={commissionFilter} onValueChange={(v) => setCommissionFilter(v as any)}>
            <TabsList className="w-full">
              <ResponsiveTabsTrigger value="all" label="全部" />
              <ResponsiveTabsTrigger value="pending" label="待确认" />
              <ResponsiveTabsTrigger value="confirmed" label="已确认" />
            </TabsList>
          </Tabs>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Commissions */}
              {(type === "earnings" || type === "available") && (
                <>
                  {filteredCommissions.length === 0 ? (
                    <EmptyState />
                  ) : (
                    filteredCommissions.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {ORDER_TYPE_NAMES[c.order_type] || c.order_type}
                            </span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {c.commission_level === 1 ? "一级" : "二级"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            订单 ¥{c.order_amount.toFixed(2)} · {(c.commission_rate * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(c.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                          </div>
                        </div>
                        <div className="text-right space-y-1 shrink-0">
                          <div className="text-sm font-bold text-orange-600">+¥{c.commission_amount.toFixed(2)}</div>
                          {getStatusBadge(c.status)}
                        </div>
                      </div>
                    ))
                  )}
                  <SummaryRow
                    label="合计"
                    value={`¥${filteredCommissions.reduce((s, c) => s + c.commission_amount, 0).toFixed(2)}`}
                    count={filteredCommissions.length}
                  />
                </>
              )}

              {/* Withdrawals */}
              {type === "withdrawn" && (
                <>
                  {filteredWithdrawals.length === 0 ? (
                    <EmptyState />
                  ) : (
                    filteredWithdrawals.map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">
                            提现 ¥{w.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {w.payment_method === "wechat" ? "微信" : w.payment_method === "alipay" ? "支付宝" : "银行卡"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(w.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm font-bold text-orange-600">-¥{w.amount.toFixed(2)}</div>
                          {getStatusBadge(w.status)}
                        </div>
                      </div>
                    ))
                  )}
                  <SummaryRow
                    label="合计提现"
                    value={`¥${filteredWithdrawals.reduce((s, w) => s + w.amount, 0).toFixed(2)}`}
                    count={filteredWithdrawals.length}
                  />
                </>
              )}

              {/* Referrals */}
              {(type === "referrals_l1" || type === "referrals_l2") && (
                <>
                  {filteredReferrals.length === 0 ? (
                    <EmptyState />
                  ) : (
                    filteredReferrals.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {r.profile?.display_name || "未设昵称"}
                            </span>
                            {getConversionBadge(r.conversion_status)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(r.created_at), "MM-dd HH:mm", { locale: zhCN })}
                          </span>
                        </div>
                        {r.orders && r.orders.length > 0 && (
                          <div className="space-y-1 pl-2 border-l-2 border-orange-200">
                            {r.orders.map((o, i) => (
                              <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                <span>{o.package_name || "未知产品"}</span>
                                <span className="text-orange-600 font-medium">¥{o.amount?.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <SummaryRow label="合计用户" value="" count={filteredReferrals.length} />
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <TrendingUp className="w-8 h-8 mx-auto opacity-40 mb-2" />
      <p className="text-sm">暂无数据</p>
    </div>
  );
}

function SummaryRow({ label, value, count }: { label: string; value: string; count: number }) {
  return (
    <div className="flex justify-between items-center px-3 py-2 bg-muted/30 rounded-lg text-sm">
      <span className="text-muted-foreground">{label}（{count} 条）</span>
      {value && <span className="font-bold text-orange-600">{value}</span>}
    </div>
  );
}

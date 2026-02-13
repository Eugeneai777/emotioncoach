import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, CheckCircle, ShoppingCart, TrendingUp, Loader2 } from "lucide-react";
import { PartnerCampaigns } from "./PartnerCampaigns";
import { PartnerProducts } from "./PartnerProducts";

interface PartnerFlywheelProps {
  partnerId: string;
}

interface FunnelStats {
  impressions: number;
  completeTest: number;
  payments: number;
  revenue: number;
  cost: number;
}

export function PartnerFlywheel({ partnerId }: PartnerFlywheelProps) {
  const [stats, setStats] = useState<FunnelStats>({ impressions: 0, completeTest: 0, payments: 0, revenue: 0, cost: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [partnerId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Get my campaigns
      const { data: campaigns } = await supabase
        .from("campaigns" as any)
        .select("id, promotion_cost")
        .eq("partner_id", partnerId);

      const campaignIds = (campaigns || []).map((c: any) => c.id).filter(Boolean);
      const totalCost = (campaigns || []).reduce((sum: number, c: any) => sum + (Number(c.promotion_cost) || 0), 0);

      if (campaignIds.length === 0) {
        setStats({ impressions: 0, completeTest: 0, payments: 0, revenue: 0, cost: totalCost });
        setLoading(false);
        return;
      }

      // 2. Get conversion events for my campaigns (7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: events } = await supabase
        .from("conversion_events" as any)
        .select("event_type")
        .in("campaign_id", campaignIds)
        .gte("created_at", sevenDaysAgo);

      const evts = events || [];
      const impressions = evts.filter((e: any) => e.event_type === "click" || e.event_type === "page_view").length;
      const completeTest = evts.filter((e: any) => e.event_type === "complete_test").length;

      // 3. Get orders linked to my campaigns (simplified: use campaign referral users)
      // For now use partner_referrals to get user_ids, then count orders
      const { data: referrals } = await supabase
        .from("partner_referrals" as any)
        .select("referred_user_id")
        .eq("partner_id", partnerId);

      const userIds = (referrals || []).map((r: any) => r.referred_user_id).filter(Boolean);
      
      let payments = 0;
      let revenue = 0;
      if (userIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders" as any)
          .select("amount")
          .in("user_id", userIds)
          .eq("status", "paid")
          .gte("created_at", sevenDaysAgo);
        
        payments = (orders || []).length;
        revenue = (orders || []).reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0);
      }

      setStats({ impressions, completeTest, payments, revenue, cost: totalCost });
    } catch (err) {
      console.error("PartnerFlywheel fetchStats error:", err);
    } finally {
      setLoading(false);
    }
  };

  const roi = stats.cost > 0 ? (stats.revenue / stats.cost).toFixed(2) : "N/A";

  const statCards = [
    { label: "我的曝光", value: stats.impressions, icon: Eye, color: "text-blue-500" },
    { label: "测评完成", value: stats.completeTest, icon: CheckCircle, color: "text-green-500" },
    { label: "成交笔数", value: stats.payments, icon: ShoppingCart, color: "text-orange-500" },
    { label: "我的ROI", value: roi, icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <p className="text-xl font-bold">{s.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 收入卡片 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">7日成交额</p>
              <p className="text-2xl font-bold">¥{stats.revenue.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">推广总成本</p>
              <p className="text-lg font-semibold text-muted-foreground">¥{stats.cost.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 我的活动 */}
      <PartnerCampaigns partnerId={partnerId} />

      {/* 我的产品包 */}
      <PartnerProducts partnerId={partnerId} />
    </div>
  );
}

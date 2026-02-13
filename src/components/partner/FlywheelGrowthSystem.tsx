import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, Users, DollarSign, TrendingUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { FlywheelLevelCard, type FlywheelLevel } from "./FlywheelLevelCard";
import { AILandingPageWizard } from "./AILandingPageWizard";
import { AIActivityAnalysis } from "./AIActivityAnalysis";
import { PartnerCampaigns } from "./PartnerCampaigns";
import { PartnerProducts } from "./PartnerProducts";
import { cn } from "@/lib/utils";

const FLYWHEEL_LEVELS: FlywheelLevel[] = [
  {
    level: "L1",
    name: "测评 & 工具",
    icon: "📊",
    description: "低门槛引流，获取用户数据",
    products: ["情绪健康测评", "SCL-90", "财富卡点测评"],
    priceRange: "免费~¥9.9",
    color: "blue",
  },
  {
    level: "L2",
    name: "有劲训练营",
    icon: "🏋️",
    description: "深度体验，建立信任",
    products: ["21天情绪日记训练营", "财富觉醒训练营", "青少年困境突破营"],
    priceRange: "¥299",
    color: "emerald",
  },
  {
    level: "L3",
    name: "绽放训练营",
    icon: "🌸",
    description: "高价值转化，深度服务",
    products: ["绽放合伙人体系"],
    priceRange: "更高价位",
    color: "purple",
  },
  {
    level: "L4",
    name: "有劲合伙人",
    icon: "💎",
    description: "裂变增长，长期分成",
    products: ["初级合伙人", "高级合伙人", "钻石合伙人"],
    priceRange: "¥792~¥4950",
    color: "amber",
  },
];

interface FlywheelGrowthSystemProps {
  partnerId: string;
}

export function FlywheelGrowthSystem({ partnerId }: FlywheelGrowthSystemProps) {
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({ reach: 0, conversions: 0, revenue: 0, roi: "N/A" });
  const [levelStats, setLevelStats] = useState<Record<string, { reach: number; conversions: number; revenue: number; conversionRate: number }>>({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLevel, setWizardLevel] = useState("L1");
  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [partnerId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [campaignsRes, referralsRes] = await Promise.all([
        supabase.from("campaigns" as any).select("id, promotion_cost").eq("partner_id", partnerId),
        supabase.from("partner_referrals" as any).select("referred_user_id").eq("partner_id", partnerId),
      ]);

      const campaigns = campaignsRes.data || [];
      const campaignIds = campaigns.map((c: any) => c.id).filter(Boolean);
      const totalCost = campaigns.reduce((s: number, c: any) => s + (Number(c.promotion_cost) || 0), 0);

      let events: any[] = [];
      if (campaignIds.length > 0) {
        const { data } = await supabase
          .from("conversion_events" as any)
          .select("event_type")
          .in("campaign_id", campaignIds)
          .gte("created_at", sevenDaysAgo);
        events = data || [];
      }

      const userIds = (referralsRes.data || []).map((r: any) => r.referred_user_id).filter(Boolean);
      let revenue = 0;
      if (userIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders" as any)
          .select("amount")
          .in("user_id", userIds)
          .eq("status", "paid")
          .gte("created_at", sevenDaysAgo);
        revenue = (orders || []).reduce((s: number, o: any) => s + (Number(o.amount) || 0), 0);
      }

      const reach = events.filter((e: any) => e.event_type === "page_view" || e.event_type === "click").length;
      const conversions = events.filter((e: any) => e.event_type === "payment" || e.event_type === "complete_test").length;

      setTotalStats({
        reach,
        conversions,
        revenue,
        roi: totalCost > 0 ? (revenue / totalCost).toFixed(2) : "N/A",
      });

      // Mock per-level stats (distribute proportionally for now)
      const levels = ["L1", "L2", "L3", "L4"];
      const ratios = [0.5, 0.25, 0.15, 0.1];
      const stats: Record<string, any> = {};
      levels.forEach((l, i) => {
        const r = Math.round(reach * ratios[i]);
        const c = Math.round(conversions * ratios[i]);
        const rev = Math.round(revenue * ratios[i]);
        stats[l] = { reach: r, conversions: c, revenue: rev, conversionRate: r > 0 ? (c / r) * 100 : 0 };
      });
      setLevelStats(stats);
    } catch (err) {
      console.error("FlywheelGrowthSystem fetchStats error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWizard = (level: string) => {
    setWizardLevel(level);
    setWizardOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔄</span>
        <h2 className="text-lg font-bold">有劲AI · 四级增长飞轮</h2>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总触达</p>
              <p className="text-lg font-bold">{totalStats.reach.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总转化</p>
              <p className="text-lg font-bold">{totalStats.conversions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总收入</p>
              <p className="text-lg font-bold">¥{totalStats.revenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ROI</p>
              <p className="text-lg font-bold">{totalStats.roi}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Four-level flywheel */}
      <div className="space-y-0">
        {FLYWHEEL_LEVELS.map((level, idx) => {
          const stats = levelStats[level.level] || { reach: 0, conversions: 0, revenue: 0, conversionRate: 0 };
          const nextStats = idx < FLYWHEEL_LEVELS.length - 1 ? levelStats[FLYWHEEL_LEVELS[idx + 1].level] : null;
          const upgradeRate = stats.conversions > 0 && nextStats ? (nextStats.reach / stats.conversions) * 100 : null;

          return (
            <FlywheelLevelCard
              key={level.level}
              levelConfig={level}
              stats={stats}
              upgradeRate={upgradeRate}
              isLast={idx === FLYWHEEL_LEVELS.length - 1}
              onOpenWizard={handleOpenWizard}
            />
          );
        })}
      </div>

      {/* Bottom collapsible sections */}
      <div className="space-y-2 pt-4 border-t">
        <Collapsible open={campaignsOpen} onOpenChange={setCampaignsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>📢 Campaign 管理</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", campaignsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <PartnerCampaigns partnerId={partnerId} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>📦 产品包管理</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", productsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <PartnerProducts partnerId={partnerId} />
          </CollapsibleContent>
        </Collapsible>

        <AIActivityAnalysis partnerId={partnerId} />
      </div>

      {/* AI Wizard Dialog */}
      <AILandingPageWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        partnerId={partnerId}
        level={wizardLevel}
      />
    </div>
  );
}

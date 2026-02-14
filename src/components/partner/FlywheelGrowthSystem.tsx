import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, Users, DollarSign, Megaphone, Sparkles, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { AILandingPageWizard } from "./AILandingPageWizard";
import { PartnerLandingPageList } from "./PartnerLandingPageList";
import { MiniSparkline } from "./MiniSparkline";

interface LevelConfig {
  level: string;
  name: string;
  icon: string;
  description: string;
  priceRange: string;
}

const FLYWHEEL_LEVELS: LevelConfig[] = [
  { level: "L1", name: "测评&工具", icon: "1", description: "低门槛引流，获取用户数据", priceRange: "免费~¥9.9" },
  { level: "L2", name: "有劲训练营", icon: "2", description: "深度体验，建立信任", priceRange: "¥299" },
  { level: "L3", name: "绽放训练营", icon: "3", description: "高价值转化，深度服务", priceRange: "更高价位" },
  { level: "L4", name: "有劲合伙人", icon: "4", description: "裂变增长，长期分成", priceRange: "¥792~¥4950" },
];

interface FlywheelGrowthSystemProps {
  partnerId: string;
}

function GrowthIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-emerald-600">
        <TrendingUp className="w-3 h-3" />
        +{value.toFixed(0)}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-destructive">
        <TrendingDown className="w-3 h-3" />
        {value.toFixed(0)}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" />
      0%
    </span>
  );
}

export function FlywheelGrowthSystem({ partnerId }: FlywheelGrowthSystemProps) {
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    campaigns: 0, spend: 0, reach: 0, conversions: 0, revenue: 0,
    reachGrowth: 0, conversionGrowth: 0, revenueGrowth: 0,
  });
  const [dailyData, setDailyData] = useState<{ reach: number[]; conversions: number[]; revenue: number[] }>({
    reach: [], conversions: [], revenue: [],
  });
  const [levelStats, setLevelStats] = useState<Record<string, { reach: number; conversions: number; revenue: number; conversionRate: number }>>({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLevel, setWizardLevel] = useState("L1");

  useEffect(() => {
    fetchStats();
  }, [partnerId]);

  const calcGrowth = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = Date.now();
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [campaignsRes, referralsRes, activePagesRes] = await Promise.all([
        supabase.from("campaigns" as any).select("id, promotion_cost").eq("partner_id", partnerId),
        supabase.from("partner_referrals" as any).select("referred_user_id").eq("partner_id", partnerId),
        supabase.from("partner_landing_pages" as any).select("id").eq("partner_id", partnerId).eq("status", "published"),
      ]);

      const campaigns = campaignsRes.data || [];
      const campaignIds = campaigns.map((c: any) => c.id).filter(Boolean);
      const totalCost = campaigns.reduce((s: number, c: any) => s + (Number(c.promotion_cost) || 0), 0);
      const activeCampaigns = (activePagesRes.data || []).length;

      let currentEvents: any[] = [];
      let prevEvents: any[] = [];
      if (campaignIds.length > 0) {
        const [currRes, prevRes] = await Promise.all([
          supabase.from("conversion_events" as any).select("event_type, created_at").in("campaign_id", campaignIds).gte("created_at", sevenDaysAgo),
          supabase.from("conversion_events" as any).select("event_type").in("campaign_id", campaignIds).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
        ]);
        currentEvents = currRes.data || [];
        prevEvents = prevRes.data || [];
      }

      const userIds = (referralsRes.data || []).map((r: any) => r.referred_user_id).filter(Boolean);
      let currentRevenue = 0;
      let prevRevenue = 0;
      let revenueEvents: any[] = [];
      if (userIds.length > 0) {
        const [currOrders, prevOrders] = await Promise.all([
          supabase.from("orders" as any).select("amount, created_at").in("user_id", userIds).eq("status", "paid").gte("created_at", sevenDaysAgo),
          supabase.from("orders" as any).select("amount").in("user_id", userIds).eq("status", "paid").gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
        ]);
        revenueEvents = currOrders.data || [];
        currentRevenue = revenueEvents.reduce((s: number, o: any) => s + (Number(o.amount) || 0), 0);
        prevRevenue = (prevOrders.data || []).reduce((s: number, o: any) => s + (Number(o.amount) || 0), 0);
      }

      const countMetrics = (events: any[]) => ({
        reach: events.filter((e: any) => e.event_type === "page_view" || e.event_type === "click").length,
        conversions: events.filter((e: any) => e.event_type === "payment" || e.event_type === "complete_test").length,
      });

      const curr = countMetrics(currentEvents);
      const prev = countMetrics(prevEvents);

      // Build daily sparkline data (7 days)
      const dailyReach = new Array(7).fill(0);
      const dailyConversions = new Array(7).fill(0);
      const dailyRevenue = new Array(7).fill(0);
      
      currentEvents.forEach((e: any) => {
        if (!e.created_at) return;
        const dayIndex = 6 - Math.min(6, Math.floor((now - new Date(e.created_at).getTime()) / (24 * 60 * 60 * 1000)));
        if (e.event_type === "page_view" || e.event_type === "click") dailyReach[dayIndex]++;
        if (e.event_type === "payment" || e.event_type === "complete_test") dailyConversions[dayIndex]++;
      });
      revenueEvents.forEach((o: any) => {
        if (!o.created_at) return;
        const dayIndex = 6 - Math.min(6, Math.floor((now - new Date(o.created_at).getTime()) / (24 * 60 * 60 * 1000)));
        dailyRevenue[dayIndex] += Number(o.amount) || 0;
      });

      setDailyData({ reach: dailyReach, conversions: dailyConversions, revenue: dailyRevenue });

      setTotalStats({
        campaigns: activeCampaigns,
        spend: totalCost,
        reach: curr.reach,
        conversions: curr.conversions,
        revenue: currentRevenue,
        reachGrowth: calcGrowth(curr.reach, prev.reach),
        conversionGrowth: calcGrowth(curr.conversions, prev.conversions),
        revenueGrowth: calcGrowth(currentRevenue, prevRevenue),
      });

      const levels = ["L1", "L2", "L3", "L4"];
      const ratios = [0.5, 0.25, 0.15, 0.1];
      const stats: Record<string, any> = {};
      levels.forEach((l, i) => {
        const r = Math.round(curr.reach * ratios[i]);
        const c = Math.round(curr.conversions * ratios[i]);
        const rev = Math.round(currentRevenue * ratios[i]);
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
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔄</span>
        <h2 className="text-lg font-bold">有劲AI · 四级增长飞轮</h2>
      </div>

      {/* Summary stats - 5 cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <FileText className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">活跃活动</p>
              <p className="text-lg font-bold">{totalStats.campaigns}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总投放</p>
              <p className="text-lg font-bold">¥{totalStats.spend.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">总触达</p>
                <p className="text-lg font-bold">{totalStats.reach.toLocaleString()}</p>
                <GrowthIndicator value={totalStats.reachGrowth} />
              </div>
            </div>
            <MiniSparkline data={dailyData.reach} color="hsl(var(--primary))" />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">总转化</p>
                <p className="text-lg font-bold">{totalStats.conversions.toLocaleString()}</p>
                <GrowthIndicator value={totalStats.conversionGrowth} />
              </div>
            </div>
            <MiniSparkline data={dailyData.conversions} color="hsl(var(--primary))" />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">总收入</p>
                <p className="text-lg font-bold">¥{totalStats.revenue.toLocaleString()}</p>
                <GrowthIndicator value={totalStats.revenueGrowth} />
              </div>
            </div>
            <MiniSparkline data={dailyData.revenue} color="hsl(var(--primary))" />
          </CardContent>
        </Card>
      </div>

      {/* Four-level flywheel as Tabs */}
      <Tabs defaultValue="L1" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          {FLYWHEEL_LEVELS.map((level) => (
            <ResponsiveTabsTrigger
              key={level.level}
              value={level.level}
              label={`${level.icon} ${level.name}`}
              shortLabel={level.icon}
            />
          ))}
        </TabsList>

        {FLYWHEEL_LEVELS.map((level) => {
          const stats = levelStats[level.level] || { reach: 0, conversions: 0, revenue: 0, conversionRate: 0 };
          return (
            <TabsContent key={level.level} value={level.level} className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{level.icon}</span>
                <div>
                  <h3 className="font-semibold text-sm">{level.name}</h3>
                  <p className="text-xs text-muted-foreground">{level.description} · {level.priceRange}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">{stats.reach}</p>
                  <p className="text-xs text-muted-foreground">触达</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">{stats.conversions}</p>
                  <p className="text-xs text-muted-foreground">转化</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">¥{stats.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">收入</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleOpenWizard(level.level)}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                设置推广活动
              </Button>

              <PartnerLandingPageList partnerId={partnerId} level={level.level} />
            </TabsContent>
          );
        })}
      </Tabs>

      <AILandingPageWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        partnerId={partnerId}
        level={wizardLevel}
      />
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart, TrendingUp, Loader2, BarChart3, AlertTriangle, Sparkles } from "lucide-react";
import { PartnerCampaigns } from "./PartnerCampaigns";
import { PartnerProducts } from "./PartnerProducts";
import { PartnerStoreProducts } from "./PartnerStoreProducts";
import { PartnerStoreOrders } from "./PartnerStoreOrders";
import { toast } from "sonner";

interface PartnerFlywheelProps {
  partnerId: string;
}

interface FunnelStep {
  key: string;
  label: string;
}

interface Campaign {
  id: string;
  name: string;
  custom_funnel_steps: FunnelStep[] | null;
  promotion_cost: number | null;
}

interface StepData {
  key: string;
  label: string;
  count: number;
  rate: number | null; // conversion rate from previous step
}

export function PartnerFlywheel({ partnerId }: PartnerFlywheelProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<StepData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { fetchCampaigns(); }, [partnerId]);
  useEffect(() => { fetchFunnelData(); }, [partnerId, selectedCampaignId, campaigns]);

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from("campaigns" as any)
      .select("id, name, custom_funnel_steps, promotion_cost")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    setCampaigns((data || []) as any);
  };

  const currentSteps = useMemo<FunnelStep[]>(() => {
    if (selectedCampaignId !== "all") {
      const camp = campaigns.find(c => c.id === selectedCampaignId);
      if (camp?.custom_funnel_steps && camp.custom_funnel_steps.length > 0) {
        return camp.custom_funnel_steps;
      }
    }
    // Merge all campaigns' steps or use default
    const allSteps = campaigns.flatMap(c => c.custom_funnel_steps || []);
    if (allSteps.length > 0) {
      // Deduplicate by key, preserve order
      const seen = new Set<string>();
      return allSteps.filter(s => {
        if (seen.has(s.key)) return false;
        seen.add(s.key);
        return true;
      });
    }
    return [
      { key: "page_view", label: "曝光" },
      { key: "complete_test", label: "测评完成" },
      { key: "payment", label: "成交" },
    ];
  }, [selectedCampaignId, campaigns]);

  const fetchFunnelData = async () => {
    setLoading(true);
    try {
      const targetCampaignIds = selectedCampaignId === "all"
        ? campaigns.map(c => c.id).filter(Boolean)
        : [selectedCampaignId];

      if (targetCampaignIds.length === 0) {
        setFunnelData(currentSteps.map(s => ({ ...s, count: 0, rate: null })));
        setTotalRevenue(0);
        setTotalCost(campaigns.reduce((s, c) => s + (Number(c.promotion_cost) || 0), 0));
        setLoading(false);
        return;
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get conversion events
      const { data: events } = await supabase
        .from("conversion_events" as any)
        .select("event_type")
        .in("campaign_id", targetCampaignIds)
        .gte("created_at", sevenDaysAgo);

      const evts = events || [];
      const eventCounts: Record<string, number> = {};
      evts.forEach((e: any) => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
      });

      // Build funnel data with conversion rates
      const data: StepData[] = currentSteps.map((step, idx) => {
        const count = eventCounts[step.key] || 0;
        const prevCount = idx > 0 ? (eventCounts[currentSteps[idx - 1].key] || 0) : null;
        const rate = prevCount && prevCount > 0 ? (count / prevCount) * 100 : null;
        return { ...step, count, rate };
      });
      setFunnelData(data);

      // Revenue from referrals
      const { data: referrals } = await supabase
        .from("partner_referrals" as any)
        .select("referred_user_id")
        .eq("partner_id", partnerId);
      const userIds = (referrals || []).map((r: any) => r.referred_user_id).filter(Boolean);

      let revenue = 0;
      if (userIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders" as any)
          .select("amount")
          .in("user_id", userIds)
          .eq("status", "paid")
          .gte("created_at", sevenDaysAgo);
        revenue = (orders || []).reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0);
      }
      setTotalRevenue(revenue);

      const cost = selectedCampaignId === "all"
        ? campaigns.reduce((s, c) => s + (Number(c.promotion_cost) || 0), 0)
        : Number(campaigns.find(c => c.id === selectedCampaignId)?.promotion_cost || 0);
      setTotalCost(cost);
    } catch (err) {
      console.error("PartnerFlywheel fetchFunnelData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const roi = totalCost > 0 ? (totalRevenue / totalCost).toFixed(2) : "N/A";

  // Weakest link
  const weakestLink = useMemo(() => {
    const stepsWithRate = funnelData.filter(s => s.rate !== null && s.rate < 100);
    if (stepsWithRate.length === 0) return null;
    return stepsWithRate.reduce((min, s) => (s.rate! < min.rate! ? s : min));
  }, [funnelData]);

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("flywheel-ai-analysis", {
        body: { partnerId },
      });
      if (error) throw error;
      setAiAnalysis(data?.analysis || data?.message || "分析完成，暂无建议。");
    } catch (err: any) {
      toast.error("AI 分析失败：" + (err.message || "未知错误"));
    } finally {
      setAiLoading(false);
    }
  };

  const maxCount = Math.max(...funnelData.map(s => s.count), 1);

  return (
    <Tabs defaultValue="funnel" className="space-y-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="funnel">漏斗分析</TabsTrigger>
        <TabsTrigger value="campaigns">Campaign 管理</TabsTrigger>
        <TabsTrigger value="products">产品包</TabsTrigger>
        <TabsTrigger value="store">商城商品</TabsTrigger>
        <TabsTrigger value="orders">商城订单</TabsTrigger>
      </TabsList>

      <TabsContent value="funnel" className="space-y-4">
        {/* Campaign Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">筛选活动：</span>
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="全部活动" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部活动</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">7日收入</span>
              </div>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <p className="text-xl font-bold">¥{totalRevenue.toLocaleString()}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">推广成本</span>
              </div>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <p className="text-xl font-bold">¥{totalCost.toLocaleString()}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">ROI</span>
              </div>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <p className="text-xl font-bold">{roi}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">漏斗步骤</span>
              </div>
              <p className="text-xl font-bold">{currentSteps.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">转化漏斗（近7日）</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : funnelData.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">请先在 Campaign 中配置漏斗步骤</p>
            ) : (
              <div className="space-y-2">
                {funnelData.map((step, idx) => {
                  const widthPct = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 8) : 8;
                  const hue = 210 - (idx / (funnelData.length - 1 || 1)) * 150; // blue to green gradient
                  return (
                    <div key={step.key} className="space-y-1">
                      {idx > 0 && step.rate !== null && (
                        <div className="text-xs text-muted-foreground text-center">
                          ↓ {step.rate.toFixed(1)}%
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-xs w-20 text-right shrink-0 truncate">{step.label}</span>
                        <div className="flex-1 relative">
                          <div
                            className="h-8 rounded-sm flex items-center justify-end pr-3 transition-all"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: `hsl(${hue}, 65%, 55%)`,
                              minWidth: "60px",
                            }}
                          >
                            <span className="text-xs font-bold text-white">{step.count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weakest Link */}
        {weakestLink && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">最弱环节：{weakestLink.label}</p>
                <p className="text-xs text-muted-foreground">
                  转化率仅 {weakestLink.rate?.toFixed(1)}%，建议重点优化此环节以提升整体漏斗效率。
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Strategy Analysis */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button onClick={handleAiAnalysis} disabled={aiLoading} className="w-full">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              AI 策略分析
            </Button>
            {aiAnalysis && (
              <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">{aiAnalysis}</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="campaigns">
        <PartnerCampaigns partnerId={partnerId} />
      </TabsContent>

      <TabsContent value="products">
        <PartnerProducts partnerId={partnerId} />
      </TabsContent>

      <TabsContent value="store">
        <PartnerStoreProducts partnerId={partnerId} />
      </TabsContent>

      <TabsContent value="orders">
        <PartnerStoreOrders partnerId={partnerId} />
      </TabsContent>
    </Tabs>
  );
}

import { useState, useEffect } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { AdminStatCard } from "../shared/AdminStatCard";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MousePointerClick, CreditCard, TrendingUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FunnelStep {
  label: string;
  count: number;
  rate?: string;
}

export default function FlywheelDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    impressions: 0,
    completedTests: 0,
    todayRevenue: 0,
    roi: 0,
  });
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [aiDiagnosis, setAiDiagnosis] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [eventsRes, ordersRes, todayOrdersRes, campaignsRes] = await Promise.all([
        supabase.from("conversion_events").select("event_type").gte("created_at", sevenDaysAgo),
        supabase.from("orders").select("amount").eq("status", "paid").gte("created_at", sevenDaysAgo),
        supabase.from("orders").select("amount").eq("status", "paid").gte("created_at", todayStart.toISOString()),
        supabase.from("campaigns" as any).select("promotion_cost").eq("status", "active"),
      ]);

      const events = eventsRes.data || [];
      const orders = ordersRes.data || [];
      const todayOrders = todayOrdersRes.data || [];
      const campaigns = (campaignsRes.data || []) as any[];

      const impressions = events.filter(e => e.event_type === "click" || e.event_type === "page_view").length;
      const clicks = events.filter(e => e.event_type === "click").length;
      const startTest = events.filter(e => e.event_type === "start_test").length;
      const completeTest = events.filter(e => e.event_type === "complete_test").length;
      const aiRound5 = events.filter(e => e.event_type === "ai_round_5").length;
      const consultClick = events.filter(e => e.event_type === "consult_click").length;
      const payments = orders.length;

      const totalRevenue = orders.reduce((sum, o) => sum + (Number((o as any).amount) || 0), 0);
      const totalCost = campaigns.reduce((sum, c) => sum + (Number(c.promotion_cost) || 0), 0);
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number((o as any).amount) || 0), 0);

      setStats({
        impressions,
        completedTests: completeTest,
        todayRevenue,
        roi: totalCost > 0 ? Number((totalRevenue / totalCost).toFixed(2)) : 0,
      });

      const funnelData: FunnelStep[] = [
        { label: "曝光", count: impressions },
        { label: "点击", count: clicks, rate: impressions > 0 ? `${((clicks / impressions) * 100).toFixed(1)}%` : "-" },
        { label: "测评完成", count: completeTest, rate: startTest > 0 ? `${((completeTest / startTest) * 100).toFixed(1)}%` : "-" },
        { label: "AI≥5轮", count: aiRound5, rate: completeTest > 0 ? `${((aiRound5 / completeTest) * 100).toFixed(1)}%` : "-" },
        { label: "咨询", count: consultClick, rate: aiRound5 > 0 ? `${((consultClick / aiRound5) * 100).toFixed(1)}%` : "-" },
        { label: "成交", count: payments, rate: consultClick > 0 ? `${((payments / consultClick) * 100).toFixed(1)}%` : "-" },
      ];
      setFunnel(funnelData);

      // Find weakest link
      const rates = [
        { step: "点击→测评", rate: startTest > 0 ? completeTest / startTest : 1 },
        { step: "测评→AI深度", rate: completeTest > 0 ? aiRound5 / completeTest : 1 },
        { step: "AI→咨询", rate: aiRound5 > 0 ? consultClick / aiRound5 : 1 },
        { step: "咨询→成交", rate: consultClick > 0 ? payments / consultClick : 1 },
      ];
      const weakest = rates.reduce((min, r) => r.rate < min.rate ? r : min, rates[0]);
      setAiDiagnosis(`🧠 当前最弱环节：「${weakest.step}」转化率 ${(weakest.rate * 100).toFixed(1)}%，建议重点优化此环节。`);
    } catch (err) {
      console.error("Failed to fetch flywheel data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPageLayout title="飞轮总览" description="7天转化漏斗数据概览">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="7日曝光" value={stats.impressions} icon={Eye} loading={loading} accent="bg-blue-100 text-blue-600" />
        <AdminStatCard label="测评完成" value={stats.completedTests} icon={MousePointerClick} loading={loading} accent="bg-green-100 text-green-600" />
        <AdminStatCard label="今日成交" value={`¥${stats.todayRevenue.toLocaleString()}`} icon={CreditCard} loading={loading} accent="bg-amber-100 text-amber-600" />
        <AdminStatCard label="7日ROI" value={stats.roi > 0 ? `${stats.roi}x` : "N/A"} icon={TrendingUp} loading={loading} accent="bg-purple-100 text-purple-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">实时漏斗</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              {funnel.map((step, i) => (
                <div key={step.label} className="w-full flex flex-col items-center">
                  <div
                    className="bg-primary/10 text-foreground rounded-lg py-3 text-center font-medium transition-all"
                    style={{
                      width: `${Math.max(30, 100 - i * 12)}%`,
                    }}
                  >
                    <span className="text-sm">{step.label}</span>
                    <span className="ml-2 font-bold">{step.count}</span>
                    {step.rate && <span className="ml-2 text-xs text-muted-foreground">({step.rate})</span>}
                  </div>
                  {i < funnel.length - 1 && (
                    <ArrowDown className="h-4 w-4 text-muted-foreground my-0.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {aiDiagnosis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-sm">{aiDiagnosis}</p>
          </CardContent>
        </Card>
      )}
    </AdminPageLayout>
  );
}

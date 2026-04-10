import { useState, useEffect } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { AdminStatCard } from "../shared/AdminStatCard";
import { AdminTableContainer } from "../shared/AdminTableContainer";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MousePointerClick, CreditCard, TrendingUp, ArrowDown, ShoppingBag, BookOpen, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserProfileDrawer } from "./UserProfileDrawer";

interface FunnelStep {
  label: string;
  count: number;
  rate?: string;
}

interface ProductSale {
  label: string;
  icon: string;
  orders: number;
  revenue: number;
  users: number;
}

interface CampInsight {
  label: string;
  value: string | number;
  description: string;
}

interface ActiveUser {
  user_id: string;
  display_name: string;
  tags: string[];
  latest_activity: string;
}

const PRODUCT_MAP: Record<string, { label: string; icon: string }> = {
  wealth_block_assessment: { label: "财富卡点测评", icon: "💰" },
  emotion_health_assessment: { label: "情绪健康测评", icon: "💚" },
  midlife_awakening_assessment: { label: "觉醒力测评", icon: "🧭" },
  scl90_report: { label: "SCL-90测评", icon: "🧠" },
  synergy_bundle: { label: "协同套餐", icon: "🌟" },
  wealth_synergy_bundle: { label: "财商觉醒套餐", icon: "⚡" },
};

const CAMP_PACKAGE_PREFIXES = ["camp-"];

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
  const [products, setProducts] = useState<ProductSale[]>([]);
  const [campInsights, setCampInsights] = useState<CampInsight[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [drawerUser, setDrawerUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Original funnel queries + new queries in parallel
      const [eventsRes, ordersWeekRes, todayOrdersRes, campaignsRes, orders30Res, campsRes, postsRes, convsRes] = await Promise.all([
        supabase.from("conversion_events").select("event_type").gte("created_at", sevenDaysAgo),
        supabase.from("orders").select("amount").eq("status", "paid").gte("created_at", sevenDaysAgo),
        supabase.from("orders").select("amount").eq("status", "paid").gte("created_at", todayStart.toISOString()),
        supabase.from("campaigns" as any).select("promotion_cost").eq("status", "active"),
        // 30-day product sales
        supabase.from("orders").select("package_key, package_name, amount, user_id").eq("status", "paid").gte("created_at", thirtyDaysAgo),
        // Training camps
        supabase.from("training_camps").select("user_id, camp_name, camp_type, status, completed_days, duration_days, check_in_dates, updated_at"),
        // Community posts (30d)
        supabase.from("community_posts").select("user_id").gte("created_at", thirtyDaysAgo),
        // Conversations (30d)
        supabase.from("conversations").select("user_id").gte("created_at", thirtyDaysAgo),
      ]);

      // === Original funnel logic ===
      const events = eventsRes.data || [];
      const ordersWeek = ordersWeekRes.data || [];
      const todayOrders = todayOrdersRes.data || [];
      const campaigns = (campaignsRes.data || []) as any[];

      const impressions = events.filter(e => e.event_type === "click" || e.event_type === "page_view").length;
      const clicks = events.filter(e => e.event_type === "click").length;
      const startTest = events.filter(e => e.event_type === "start_test").length;
      const completeTest = events.filter(e => e.event_type === "complete_test").length;
      const aiRound5 = events.filter(e => e.event_type === "ai_round_5").length;
      const consultClick = events.filter(e => e.event_type === "consult_click").length;
      const payments = ordersWeek.length;

      const totalRevenue = ordersWeek.reduce((sum, o) => sum + (Number((o as any).amount) || 0), 0);
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

      const rates = [
        { step: "点击→测评", rate: startTest > 0 ? completeTest / startTest : 1 },
        { step: "测评→AI深度", rate: completeTest > 0 ? aiRound5 / completeTest : 1 },
        { step: "AI→咨询", rate: aiRound5 > 0 ? consultClick / aiRound5 : 1 },
        { step: "咨询→成交", rate: consultClick > 0 ? payments / consultClick : 1 },
      ];
      const weakest = rates.reduce((min, r) => r.rate < min.rate ? r : min, rates[0]);
      setAiDiagnosis(`🧠 当前最弱环节：「${weakest.step}」转化率 ${(weakest.rate * 100).toFixed(1)}%，建议重点优化此环节。`);

      // === Module 1: Product Sales ===
      const orders30 = (orders30Res.data || []) as any[];
      const productAgg = new Map<string, { orders: number; revenue: number; userSet: Set<string> }>();

      orders30.forEach(o => {
        let key = o.package_key as string;
        // Normalize camp package keys
        if (CAMP_PACKAGE_PREFIXES.some(p => key.startsWith(p))) {
          key = "camp_all";
        }
        // Normalize store product keys
        if (key.startsWith("store_product_")) {
          key = "store_product_all";
        }
        const existing = productAgg.get(key) || { orders: 0, revenue: 0, userSet: new Set<string>() };
        existing.orders++;
        existing.revenue += Number(o.amount) || 0;
        existing.userSet.add(o.user_id);
        productAgg.set(key, existing);
      });

      const productSales: ProductSale[] = [];
      // Known products first
      for (const [key, meta] of Object.entries(PRODUCT_MAP)) {
        const data = productAgg.get(key);
        if (data) {
          productSales.push({ label: meta.label, icon: meta.icon, orders: data.orders, revenue: data.revenue, users: data.userSet.size });
          productAgg.delete(key);
        }
      }
      // Camp aggregate
      const campData = productAgg.get("camp_all");
      if (campData) {
        productSales.push({ label: "训练营（合计）", icon: "🏕️", orders: campData.orders, revenue: campData.revenue, users: campData.userSet.size });
        productAgg.delete("camp_all");
      }
      // Store products
      const storeData = productAgg.get("store_product_all");
      if (storeData) {
        productSales.push({ label: "商城商品（合计）", icon: "🛒", orders: storeData.orders, revenue: storeData.revenue, users: storeData.userSet.size });
        productAgg.delete("store_product_all");
      }
      // Others
      for (const [key, data] of productAgg.entries()) {
        productSales.push({ label: key, icon: "📦", orders: data.orders, revenue: data.revenue, users: data.userSet.size });
      }
      productSales.sort((a, b) => b.orders - a.orders);
      setProducts(productSales);

      // === Module 2: Camp Insights ===
      const allCamps = (campsRes.data || []) as any[];
      const activeCamps = allCamps.filter(c => c.status === "active");
      const completedCamps = allCamps.filter(c => c.status === "completed");
      const avgCompletion = activeCamps.length > 0
        ? (activeCamps.reduce((s, c) => s + (c.duration_days > 0 ? c.completed_days / c.duration_days : 0), 0) / activeCamps.length * 100).toFixed(0)
        : "0";

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayCheckins = allCamps.filter(c => {
        const dates = c.check_in_dates as string[] | null;
        return dates && dates.includes(todayStr);
      }).length;

      const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const churned = activeCamps.filter(c => {
        const dates = c.check_in_dates as string[] | null;
        if (!dates || dates.length === 0) return true;
        const lastDate = new Date(dates[dates.length - 1]);
        return lastDate < sevenDaysAgoDate;
      }).length;

      setCampInsights([
        { label: "活跃营数", value: activeCamps.length, description: "status=active" },
        { label: "完营数", value: completedCamps.length, description: "status=completed" },
        { label: "平均完课率", value: `${avgCompletion}%`, description: "completed_days/duration" },
        { label: "今日打卡", value: todayCheckins, description: "今日在check_in_dates中" },
        { label: "7天流失", value: churned, description: "7天未打卡的active营" },
      ]);

      // === Module 3: User Personas ===
      const userActivity = new Map<string, { tags: Set<string>; latest: Date }>();

      const touchUser = (uid: string, tag: string, date: string) => {
        const existing = userActivity.get(uid) || { tags: new Set<string>(), latest: new Date(0) };
        existing.tags.add(tag);
        const d = new Date(date);
        if (d > existing.latest) existing.latest = d;
        userActivity.set(uid, existing);
      };

      // Orders → tags
      orders30.forEach(o => {
        const meta = PRODUCT_MAP[o.package_key as string];
        const tag = meta ? `${meta.icon}${meta.label.slice(0, 4)}` : (o.package_key as string).startsWith("camp-") ? "🏕️训练营" : "📦已购";
        touchUser(o.user_id, tag, o.created_at);
      });

      // Camps → tags
      allCamps.forEach((c: any) => {
        if (c.status === "completed") {
          touchUser(c.user_id, "🏕️已完营", c.updated_at || c.check_in_dates?.[0] || thirtyDaysAgo);
        } else if (c.status === "active") {
          touchUser(c.user_id, `🏕️Day${c.completed_days}`, c.updated_at || thirtyDaysAgo);
        }
      });

      // Posts → tags
      const postsByUser = new Map<string, number>();
      (postsRes.data || []).forEach((p: any) => {
        postsByUser.set(p.user_id, (postsByUser.get(p.user_id) || 0) + 1);
      });
      postsByUser.forEach((cnt, uid) => touchUser(uid, `📝社区×${cnt}`, thirtyDaysAgo));

      // Conversations → tags
      const convsByUser = new Map<string, number>();
      (convsRes.data || []).forEach((c: any) => {
        convsByUser.set(c.user_id, (convsByUser.get(c.user_id) || 0) + 1);
      });
      convsByUser.forEach((cnt, uid) => touchUser(uid, `🤖AI×${cnt}`, thirtyDaysAgo));

      // Sort by latest activity, limit 50
      const sortedUsers = Array.from(userActivity.entries())
        .sort((a, b) => b[1].latest.getTime() - a[1].latest.getTime())
        .slice(0, 50);

      // Fetch profile names
      const userIds = sortedUsers.map(([uid]) => uid);
      let profileMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, display_name, phone").in("id", userIds);
        (profiles || []).forEach((p: any) => {
          profileMap.set(p.id, p.display_name || p.phone || p.id.slice(0, 8));
        });
      }

      setActiveUsers(sortedUsers.map(([uid, info]) => ({
        user_id: uid,
        display_name: profileMap.get(uid) || uid.slice(0, 8),
        tags: Array.from(info.tags),
        latest_activity: info.latest.toISOString(),
      })));
    } catch (err) {
      console.error("Failed to fetch flywheel data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPageLayout title="飞轮总览" description="7天转化漏斗 + MVP产品数据 + 用户画像">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="7日曝光" value={stats.impressions} icon={Eye} loading={loading} accent="bg-blue-100 text-blue-600" />
        <AdminStatCard label="测评完成" value={stats.completedTests} icon={MousePointerClick} loading={loading} accent="bg-green-100 text-green-600" />
        <AdminStatCard label="今日成交" value={`¥${stats.todayRevenue.toLocaleString()}`} icon={CreditCard} loading={loading} accent="bg-amber-100 text-amber-600" />
        <AdminStatCard label="7日ROI" value={stats.roi > 0 ? `${stats.roi}x` : "N/A"} icon={TrendingUp} loading={loading} accent="bg-purple-100 text-purple-600" />
      </div>

      {/* Funnel */}
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
                    style={{ width: `${Math.max(30, 100 - i * 12)}%` }}
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

      {/* AI Diagnosis */}
      {aiDiagnosis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-sm">{aiDiagnosis}</p>
          </CardContent>
        </Card>
      )}

      {/* Module 1: Product Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            MVP 产品售卖概览（近30天）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无订单数据</p>
          ) : (
            <AdminTableContainer minWidth={500}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品</TableHead>
                    <TableHead className="text-right">订单数</TableHead>
                    <TableHead className="text-right">收入</TableHead>
                    <TableHead className="text-right">独立用户</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        <span className="mr-1">{p.icon}</span>{p.label}
                      </TableCell>
                      <TableCell className="text-right">{p.orders}</TableCell>
                      <TableCell className="text-right">¥{p.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{p.users}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableContainer>
          )}
        </CardContent>
      </Card>

      {/* Module 2: Camp Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            训练营学习洞察
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {campInsights.map((item) => (
                <div key={item.label} className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs font-medium text-foreground mt-1">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module 3: User Personas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            活跃用户画像（近30天·Top 50）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无活跃用户</p>
          ) : (
            <AdminTableContainer minWidth={600}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>行为标签</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeUsers.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium whitespace-nowrap">{u.display_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.tags.map((t, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDrawerUser({ id: u.user_id, name: u.display_name })}
                        >
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableContainer>
          )}
        </CardContent>
      </Card>

      {/* User Profile Drawer */}
      <UserProfileDrawer
        userId={drawerUser?.id || null}
        displayName={drawerUser?.name || ""}
        open={!!drawerUser}
        onOpenChange={(open) => { if (!open) setDrawerUser(null); }}
      />
    </AdminPageLayout>
  );
}

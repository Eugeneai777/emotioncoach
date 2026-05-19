import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, ShoppingCart, TrendingUp, Trophy, CalendarDays } from "lucide-react";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { AdminStatCard } from "../shared/AdminStatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CAMP_NAMES: Record<string, string> = {
  emotion_stress_7: "7天有劲训练营",
};

function pct(a: number, b: number) {
  return b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "-";
}

function useCampInsights(campKey: string, days: number) {
  return useQuery({
    queryKey: ["camp-insights", campKey, days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();

      // 1) 售前埋点
      const { data: signals } = await supabase
        .from("user_behavior_signals")
        .select("event_type,user_id,created_at,metadata,path")
        .gte("created_at", since)
        .in("event_type", [
          "page_view",
          "synergy_cta_click",
          "synergy_youzan_click",
          "synergy_youzan_qr_view",
          "synergy_redeem_success",
          "camp_checkin_page_view",
          "camp_task_start_click",
          "camp_meditation_complete",
          "camp_share_to_community_open",
        ])
        .limit(10000);

      const ev = signals || [];
      const uniq = (arr: any[]) => new Set(arr.map(e => e.user_id).filter(Boolean)).size;

      const promoPV = ev.filter(e => e.event_type === "page_view" && e.path === "/promo/synergy");
      const ctaClicks = ev.filter(e => e.event_type === "synergy_cta_click");
      const youzanClicks = ev.filter(e => e.event_type === "synergy_youzan_click" || e.event_type === "synergy_youzan_qr_view");
      const redeemSuccess = ev.filter(e => e.event_type === "synergy_redeem_success");
      const checkinPV = ev.filter(e => e.event_type === "camp_checkin_page_view" && e.metadata && (e.metadata as any).camp_type === campKey);
      const taskStarts = ev.filter(e => e.event_type === "camp_task_start_click" && e.metadata && (e.metadata as any).camp_type === campKey);
      const meditationComplete = ev.filter(e => e.event_type === "camp_meditation_complete");
      const shareOpen = ev.filter(e => e.event_type === "camp_share_to_community_open");

      // 2) 付费订单
      const { data: orders } = await supabase
        .from("orders")
        .select("id,user_id,created_at,amount,paid_at")
        .eq("package_key", campKey)
        .eq("status", "paid")
        .gte("created_at", since);

      // 3) 训练营 + 当日进度
      const { data: camps } = await supabase
        .from("training_camps")
        .select("id,user_id,camp_type,start_date,end_date,duration_days,completed_days,status,created_at")
        .eq("camp_type", campKey)
        .gte("created_at", since)
        .limit(2000);

      const campIds = (camps || []).map(c => c.id);
      const { data: progress } = campIds.length > 0
        ? await supabase
            .from("camp_daily_progress")
            .select("camp_id,user_id,progress_date,is_checked_in,declaration_completed,has_shared_to_community,checkin_type,checked_in_at")
            .in("camp_id", campIds)
        : { data: [] as any[] };

      // 4) 学员名单聚合
      const studentMap = new Map<string, any>();
      (camps || []).forEach(c => {
        const startDate = c.start_date ? new Date(c.start_date) : new Date(c.created_at);
        const dayIdx = Math.min(
          Math.floor((Date.now() - startDate.getTime()) / 86400000) + 1,
          c.duration_days || 7,
        );
        studentMap.set(c.id, {
          camp_id: c.id,
          user_id: c.user_id,
          start_date: c.start_date,
          current_day: dayIdx,
          completed_days: c.completed_days || 0,
          duration_days: c.duration_days || 7,
          status: c.status,
          last_active: null as string | null,
        });
      });
      (progress || []).forEach((p: any) => {
        const s = studentMap.get(p.camp_id);
        if (!s) return;
        const ts = p.checked_in_at || p.progress_date;
        if (!s.last_active || ts > s.last_active) s.last_active = ts;
      });

      // 5) 7-day heatmap (按 day_index 聚合)
      const heatmap: { day: number; enrolled: number; checked: number }[] = [];
      const camps7 = (camps || []).filter(c => (c.duration_days || 7) === 7);
      for (let d = 1; d <= 7; d++) {
        const eligible = camps7.filter(c => {
          const start = c.start_date ? new Date(c.start_date) : new Date(c.created_at);
          const reachedDay = Math.floor((Date.now() - start.getTime()) / 86400000) + 1;
          return reachedDay >= d;
        });
        const checkedCnt = eligible.filter(c => {
          const start = c.start_date ? new Date(c.start_date) : new Date(c.created_at);
          const target = new Date(start.getTime() + (d - 1) * 86400000).toISOString().slice(0, 10);
          return (progress || []).some((p: any) => p.camp_id === c.id && p.progress_date === target && p.is_checked_in);
        }).length;
        heatmap.push({ day: d, enrolled: eligible.length, checked: checkedCnt });
      }

      // 6) 结业指标
      const graduated = camps7.filter(c => (c.completed_days || 0) >= 7).length;
      const totalCamps = camps7.length;
      const enteredCount = (camps || []).filter(c => (c.completed_days || 0) >= 1).length;
      const makeupCount = (progress || []).filter((p: any) => p.checkin_type === "makeup").length;
      const avgCompleted = totalCamps > 0
        ? (camps7.reduce((s, c) => s + (c.completed_days || 0), 0) / totalCamps).toFixed(1)
        : "0";

      return {
        sales: {
          promoUV: uniq(promoPV),
          promoPV: promoPV.length,
          ctaUV: uniq(ctaClicks),
          youzanUV: uniq(youzanClicks),
          redeemSuccess: redeemSuccess.length,
          paidOrders: (orders || []).length,
        },
        learning: {
          checkinPV: checkinPV.length,
          checkinUV: uniq(checkinPV),
          taskStarts: taskStarts.length,
          meditationComplete: meditationComplete.length,
          shareOpen: shareOpen.length,
          enteredCount,
          graduated,
          totalCamps,
          makeupCount,
          avgCompleted,
          heatmap,
        },
        students: Array.from(studentMap.values()).sort((a, b) =>
          (b.last_active || "").localeCompare(a.last_active || ""),
        ),
      };
    },
  });
}

export default function CampInsightsDetail() {
  const { campKey = "emotion_stress_7" } = useParams<{ campKey: string }>();
  const navigate = useNavigate();
  const [days, setDays] = useState("30");
  const { data, isLoading } = useCampInsights(campKey, Number(days));

  const studentRows = useMemo(() => data?.students || [], [data]);

  if (isLoading || !data) {
    return (
      <AdminPageLayout title="数据洞察" description="加载中...">
        <Skeleton className="h-64 w-full" />
      </AdminPageLayout>
    );
  }

  const { sales, learning } = data;
  const campName = CAMP_NAMES[campKey] || campKey;

  return (
    <AdminPageLayout
      title={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/camps")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-2xl">🏕️</span>
          <span>{campName} · 数据洞察</span>
        </div>
      }
      description="售前转化 + 学习交付一体化漏斗"
      actions={
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">今日</SelectItem>
            <SelectItem value="7">近7天</SelectItem>
            <SelectItem value="30">近30天</SelectItem>
            <SelectItem value="90">近90天</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="sales">售前转化</TabsTrigger>
          <TabsTrigger value="learning">学习交付</TabsTrigger>
        </TabsList>

        {/* Tab 1: 总览 */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <AdminStatCard label="售前页 UV" value={sales.promoUV} icon={Users} />
            <AdminStatCard label="付费订单" value={sales.paidOrders} icon={ShoppingCart} accent="bg-blue-500/10 text-blue-600" />
            <AdminStatCard label="入营人数" value={learning.enteredCount} icon={TrendingUp} accent="bg-green-500/10 text-green-600" />
            <AdminStatCard label="结业人数" value={learning.graduated} icon={Trophy} accent="bg-amber-500/10 text-amber-600" />
            <AdminStatCard label="平均完成天数" value={learning.avgCompleted} icon={CalendarDays} accent="bg-purple-500/10 text-purple-600" />
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">核心转化率</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-muted-foreground">售前→付费</div><div className="text-xl font-semibold">{pct(sales.paidOrders, sales.promoUV)}</div></div>
              <div><div className="text-muted-foreground">付费→入营</div><div className="text-xl font-semibold">{pct(learning.enteredCount, sales.paidOrders)}</div></div>
              <div><div className="text-muted-foreground">7天结业率</div><div className="text-xl font-semibold">{pct(learning.graduated, learning.totalCamps)}</div></div>
              <div><div className="text-muted-foreground">补卡使用率</div><div className="text-xl font-semibold">{pct(learning.makeupCount, learning.enteredCount)}</div></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 售前漏斗 */}
        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">售前转化漏斗</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>步骤</TableHead>
                    <TableHead className="text-right">UV / 数量</TableHead>
                    <TableHead className="text-right">环节转化率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { step: "1. 售前页访问 (UV)", count: sales.promoUV, base: sales.promoUV },
                    { step: "2. CTA 点击 (UV)", count: sales.ctaUV, base: sales.promoUV },
                    { step: "3. 跳转有赞 / 小程序码 (UV)", count: sales.youzanUV, base: sales.ctaUV },
                    { step: "4. 兑换成功", count: sales.redeemSuccess, base: sales.youzanUV },
                    { step: "5. 付费订单", count: sales.paidOrders, base: sales.promoUV },
                  ].map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.step}</TableCell>
                      <TableCell className="text-right font-medium">{r.count}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{i === 0 ? "-" : pct(r.count, r.base)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: 学习交付 */}
        <TabsContent value="learning" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">7 天完成率热力图</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead className="text-right">应到</TableHead>
                    <TableHead className="text-right">打卡 UV</TableHead>
                    <TableHead className="text-right">完成率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learning.heatmap.map(h => (
                    <TableRow key={h.day}>
                      <TableCell>Day {h.day}</TableCell>
                      <TableCell className="text-right">{h.enrolled}</TableCell>
                      <TableCell className="text-right">{h.checked}</TableCell>
                      <TableCell className={`text-right font-medium ${parseFloat(pct(h.checked, h.enrolled)) < 50 ? "text-destructive" : "text-green-600"}`}>
                        {pct(h.checked, h.enrolled)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">学习行为漏斗</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>步骤</TableHead><TableHead className="text-right">事件数</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>打开打卡页 (PV)</TableCell><TableCell className="text-right">{learning.checkinPV}</TableCell></TableRow>
                  <TableRow><TableCell>打开打卡页 (UV)</TableCell><TableCell className="text-right">{learning.checkinUV}</TableCell></TableRow>
                  <TableRow><TableCell>点开任务 (累计)</TableCell><TableCell className="text-right">{learning.taskStarts}</TableCell></TableRow>
                  <TableRow><TableCell>冥想完成 (累计)</TableCell><TableCell className="text-right">{learning.meditationComplete}</TableCell></TableRow>
                  <TableRow><TableCell>打开分享 (累计)</TableCell><TableCell className="text-right">{learning.shareOpen}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">学员名单（{studentRows.length}）</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>入营日</TableHead>
                    <TableHead>当前 Day</TableHead>
                    <TableHead>完成天数</TableHead>
                    <TableHead>最后活跃</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRows.slice(0, 50).map(s => {
                    const lastActive = s.last_active ? new Date(s.last_active) : null;
                    const idleDays = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86400000) : 999;
                    const isGraduated = s.completed_days >= s.duration_days;
                    const isAtRisk = !isGraduated && idleDays > 2;
                    return (
                      <TableRow key={s.camp_id}>
                        <TableCell>{s.start_date ? format(new Date(s.start_date), "yyyy-MM-dd") : "-"}</TableCell>
                        <TableCell>Day {s.current_day}</TableCell>
                        <TableCell>{s.completed_days}/{s.duration_days}</TableCell>
                        <TableCell>{lastActive ? format(lastActive, "MM-dd HH:mm") : "—"}</TableCell>
                        <TableCell>
                          {isGraduated ? <Badge className="bg-green-500/10 text-green-700 border-green-300">已结业</Badge>
                            : isAtRisk ? <Badge variant="destructive">流失预警</Badge>
                            : <Badge variant="outline">进行中</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {studentRows.length > 50 && (
                <p className="text-xs text-muted-foreground mt-2">仅显示前 50 条 · 共 {studentRows.length} 名学员</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}

import { useState, useEffect } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTableContainer } from "../shared/AdminTableContainer";
import { Skeleton } from "@/components/ui/skeleton";

interface FunnelRow {
  step: string;
  count: number;
  rate: string;
}

export default function FlywheelFunnel() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7");
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);

  useEffect(() => { fetchFunnel(); }, [range]);

  const fetchFunnel = async () => {
    setLoading(true);
    const since = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();

    const { data: events } = await supabase
      .from("conversion_events")
      .select("event_type")
      .gte("created_at", since);

    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "paid")
      .gte("created_at", since);

    const ev = events || [];
    const impressions = ev.filter(e => e.event_type === "page_view" || e.event_type === "click").length;
    const clicks = ev.filter(e => e.event_type === "click").length;
    const startTest = ev.filter(e => e.event_type === "start_test").length;
    const completeTest = ev.filter(e => e.event_type === "complete_test").length;
    const aiRound5 = ev.filter(e => e.event_type === "ai_round_5").length;
    const consult = ev.filter(e => e.event_type === "consult_click").length;
    const payments = (orders || []).length;

    const pct = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "-";

    setFunnel([
      { step: "曝光/访问", count: impressions, rate: "-" },
      { step: "点击", count: clicks, rate: pct(clicks, impressions) },
      { step: "开始测评", count: startTest, rate: pct(startTest, clicks) },
      { step: "完成测评", count: completeTest, rate: pct(completeTest, startTest) },
      { step: "AI对话≥5轮", count: aiRound5, rate: pct(aiRound5, completeTest) },
      { step: "咨询点击", count: consult, rate: pct(consult, aiRound5) },
      { step: "成交", count: payments, rate: pct(payments, consult) },
    ]);
    setLoading(false);
  };

  const overallRate = funnel.length > 0 && funnel[0].count > 0
    ? `${((funnel[funnel.length - 1].count / funnel[0].count) * 100).toFixed(2)}%`
    : "-";

  return (
    <AdminPageLayout title="漏斗行为追踪" description="追踪每一步转化率，发现瓶颈">
      <div className="flex items-center gap-3">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">今日</SelectItem>
            <SelectItem value="7">近7天</SelectItem>
            <SelectItem value="30">近30天</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">整体转化率：<strong>{overallRate}</strong></span>
      </div>

      {loading ? (
        <Skeleton className="h-60 w-full" />
      ) : (
        <AdminTableContainer minWidth={600}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>漏斗步骤</TableHead>
                <TableHead className="text-right">人数</TableHead>
                <TableHead className="text-right">环节转化率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnel.map((row, i) => (
                <TableRow key={row.step}>
                  <TableCell className="font-medium">{row.step}</TableCell>
                  <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {i === 0 ? "-" : (
                      <span className={
                        parseFloat(row.rate) < 20 ? "text-destructive font-medium" :
                        parseFloat(row.rate) < 50 ? "text-amber-600 font-medium" :
                        "text-green-600 font-medium"
                      }>
                        {row.rate}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableContainer>
      )}
    </AdminPageLayout>
  );
}

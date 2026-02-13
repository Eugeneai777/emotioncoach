import { useState, useEffect } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { AdminStatCard } from "../shared/AdminStatCard";
import { AdminTableContainer } from "../shared/AdminTableContainer";
import { supabase } from "@/integrations/supabase/client";
import { Users, Handshake, DollarSign, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PartnerRow {
  id: string;
  name: string;
  invite_count: number;
  deal_count: number;
  total_earnings: number;
  commission_rate: number;
}

export default function FlywheelReferral() {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [stats, setStats] = useState({ totalPartners: 0, totalInvites: 0, totalDeals: 0, totalEarnings: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from("partners")
      .select("id, user_id, invite_count, deal_count, total_earnings, commission_rate, profiles!partners_user_id_fkey(display_name)")
      .order("total_earnings", { ascending: false })
      .limit(50);

    const rows = (data || []).map((p: any) => ({
      id: p.id,
      name: p.profiles?.display_name || "未知",
      invite_count: p.invite_count || 0,
      deal_count: p.deal_count || 0,
      total_earnings: Number(p.total_earnings) || 0,
      commission_rate: Number(p.commission_rate) || 0,
    }));

    setPartners(rows);
    setStats({
      totalPartners: rows.length,
      totalInvites: rows.reduce((s, r) => s + r.invite_count, 0),
      totalDeals: rows.reduce((s, r) => s + r.deal_count, 0),
      totalEarnings: rows.reduce((s, r) => s + r.total_earnings, 0),
    });
    setLoading(false);
  };

  return (
    <AdminPageLayout title="裂变追踪" description="合伙人贡献排名与裂变数据">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="合伙人数" value={stats.totalPartners} icon={Users} loading={loading} accent="bg-blue-100 text-blue-600" />
        <AdminStatCard label="总邀请" value={stats.totalInvites} icon={Handshake} loading={loading} accent="bg-green-100 text-green-600" />
        <AdminStatCard label="总成交" value={stats.totalDeals} icon={TrendingUp} loading={loading} accent="bg-amber-100 text-amber-600" />
        <AdminStatCard label="总分成" value={`¥${stats.totalEarnings.toLocaleString()}`} icon={DollarSign} loading={loading} accent="bg-purple-100 text-purple-600" />
      </div>

      <AdminTableContainer minWidth={600}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>排名</TableHead>
              <TableHead>合伙人</TableHead>
              <TableHead className="text-right">邀请人数</TableHead>
              <TableHead className="text-right">成交人数</TableHead>
              <TableHead className="text-right">总收入</TableHead>
              <TableHead className="text-right">分成比例</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
            ) : partners.map((p, i) => (
              <TableRow key={p.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right">{p.invite_count}</TableCell>
                <TableCell className="text-right">{p.deal_count}</TableCell>
                <TableCell className="text-right">¥{p.total_earnings.toLocaleString()}</TableCell>
                <TableCell className="text-right">{(p.commission_rate * 100).toFixed(0)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableContainer>
    </AdminPageLayout>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { AdminFilterBar } from "./shared/AdminFilterBar";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Network } from "lucide-react";
import { PartnerFlywheel } from "@/components/partner/PartnerFlywheel";

interface PartnerRow {
  id: string;
  partner_code: string;
  status: string;
  partner_type: string;
  total_referrals: number;
  created_at: string;
  user_id: string;
  nickname?: string;
}

export default function IndustryPartnerManagement() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("id, partner_code, status, partner_type, total_referrals, created_at, user_id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // fetch nicknames from profiles
      const userIds = (data || []).map((p) => p.user_id);
      let nicknameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles" as any)
          .select("id, nickname")
          .in("id", userIds);
        if (profiles) {
          (profiles as any[]).forEach((p: any) => {
            nicknameMap[p.id] = p.nickname || "";
          });
        }
      }

      setPartners(
        (data || []).map((p) => ({
          ...p,
          nickname: nicknameMap[p.user_id] || p.partner_code,
        }))
      );
    } catch (err) {
      console.error("fetchPartners error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.partner_code.toLowerCase().includes(q) ||
      (p.nickname || "").toLowerCase().includes(q)
    );
  });

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  if (selectedPartnerId && selectedPartner) {
    return (
      <AdminPageLayout
        title={`行业合作伙伴 — ${selectedPartner.nickname || selectedPartner.partner_code}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => setSelectedPartnerId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回列表
          </Button>
        }
      >
        <PartnerFlywheel partnerId={selectedPartnerId} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="行业合作伙伴" description="查看所有合作伙伴的飞轮数据、Campaign 与产品包">
      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜索合伙人编码或昵称…"
        totalCount={filtered.length}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>昵称</TableHead>
                <TableHead>合伙人编码</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">推荐用户</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nickname || "-"}</TableCell>
                  <TableCell>{p.partner_code}</TableCell>
                  <TableCell>{p.partner_type}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell className="text-right">{p.total_referrals}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPartnerId(p.id)}>
                      <Network className="h-4 w-4 mr-1" />
                      飞轮详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无合作伙伴数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageLayout>
  );
}

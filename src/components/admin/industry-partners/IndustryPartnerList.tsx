import { useState, useMemo } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { AdminFilterBar } from "../shared/AdminFilterBar";
import { AdminStatCard } from "../shared/AdminStatCard";
import { AdminTableContainer } from "../shared/AdminTableContainer";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Network, Building2, Link2, UserPlus, Unlink, TrendingUp, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { IndustryPartner } from "./types";
import { CreatePartnerDialog } from "./CreatePartnerDialog";
import { BindUserDialog } from "./BindUserDialog";

const PAGE_SIZE = 20;

interface IndustryPartnerListProps {
  partners: IndustryPartner[];
  loading: boolean;
  isPartnerAdmin: boolean;
  onSelectPartner: (id: string) => void;
  onCreatePartner: (form: any) => Promise<void>;
  isCreating: boolean;
  onBindUser: (data: { partnerId: string; phone: string }) => Promise<void>;
  isBinding: boolean;
  onUnbindUser: (partnerId: string) => Promise<void>;
  isUnbinding: boolean;
  unbindingId?: string;
}

export function IndustryPartnerList({
  partners,
  loading,
  isPartnerAdmin,
  onSelectPartner,
  onCreatePartner,
  isCreating,
  onBindUser,
  isBinding,
  onUnbindUser,
  isUnbinding,
  unbindingId,
}: IndustryPartnerListProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [bindPartnerId, setBindPartnerId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return partners.filter(
      (p) =>
        (p.company_name || "").toLowerCase().includes(q) ||
        p.partner_code.toLowerCase().includes(q) ||
        (p.contact_person || "").toLowerCase().includes(q)
    );
  }, [partners, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalEarnings = partners.reduce((s, p) => s + (p.total_earnings || 0), 0);

  const handleExportCSV = () => {
    const headers = ["公司名称", "合伙人编码", "联系人", "联系电话", "佣金比例", "推荐用户", "总收益", "状态"];
    const rows = filtered.map((p) => [
      p.company_name || "",
      p.partner_code,
      p.contact_person || "",
      p.contact_phone || "",
      `${((p.custom_commission_rate_l1 ?? 0.3) * 100).toFixed(0)}%`,
      p.total_referrals,
      p.total_earnings?.toFixed(2) || "0.00",
      p.status === "active" ? "活跃" : p.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `行业合伙人_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPageLayout
      title="行业合伙人"
      description="管理 B2B 渠道合作伙伴，配置独立佣金与 Campaign"
      actions={!isPartnerAdmin ? <CreatePartnerDialog onCreatePartner={onCreatePartner} isCreating={isCreating} /> : null}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <AdminStatCard label="合伙人总数" value={partners.length} icon={Building2} accent="bg-primary/10 text-primary" loading={loading} />
        <AdminStatCard label="活跃合伙人" value={partners.filter((p) => p.status === "active").length} icon={Network} accent="bg-emerald-50 text-emerald-600" loading={loading} />
        <AdminStatCard label="总推荐用户" value={partners.reduce((s, p) => s + (p.total_referrals || 0), 0)} icon={Network} accent="bg-blue-50 text-blue-600" loading={loading} />
        <AdminStatCard label="总收益" value={`¥${totalEarnings.toFixed(2)}`} icon={TrendingUp} accent="bg-amber-50 text-amber-600" loading={loading} />
      </div>

      <AdminFilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="搜索公司名称、编码或联系人…" totalCount={filtered.length}>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          导出
        </Button>
      </AdminFilterBar>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <AdminTableContainer minWidth={900}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司/机构</TableHead>
                  <TableHead>合伙人编码</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>一级佣金</TableHead>
                  <TableHead className="text-right">推荐用户</TableHead>
                  <TableHead className="text-right">总收益</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => onSelectPartner(p.id)}>
                    <TableCell className="font-medium">{p.company_name || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.partner_code}</TableCell>
                    <TableCell>{p.contact_person || "-"}</TableCell>
                    <TableCell>
                      {p.user_id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {p.nickname || "已绑定"}
                          </span>
                          {!isPartnerAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              disabled={isUnbinding && unbindingId === p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!confirm("确认移除负责人？移除后该合伙人将无法通过合伙人中心访问。")) return;
                                onUnbindUser(p.id);
                              }}
                            >
                              {isUnbinding && unbindingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      ) : (
                        !isPartnerAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBindPartnerId(p.id);
                              setBindDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                             设置
                          </Button>
                        )
                      )}
                    </TableCell>
                    <TableCell>{((p.custom_commission_rate_l1 ?? 0.3) * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">{p.total_referrals}</TableCell>
                    <TableCell className="text-right font-medium">¥{(p.total_earnings || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.status === "active" ? "活跃" : p.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPartner(p.id);
                        }}
                      >
                        <Network className="h-4 w-4 mr-1" />
                        管理
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      暂无行业合伙人，点击右上角"新建"添加
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AdminTableContainer>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">
                第 {page + 1} / {totalPages} 页
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <BindUserDialog
        open={bindDialogOpen}
        onOpenChange={setBindDialogOpen}
        onBind={async (phone) => {
          if (bindPartnerId) await onBindUser({ partnerId: bindPartnerId, phone });
          setBindPartnerId(null);
        }}
        isBinding={isBinding}
      />
    </AdminPageLayout>
  );
}

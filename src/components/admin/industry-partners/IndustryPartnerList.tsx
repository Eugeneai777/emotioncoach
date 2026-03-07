import { useState, useMemo } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { AdminFilterBar } from "../shared/AdminFilterBar";
import { AdminStatCard } from "../shared/AdminStatCard";
import { AdminTableContainer } from "../shared/AdminTableContainer";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent } from "@/components/ui/mobile-card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, Building2, Link2, UserPlus, Unlink, TrendingUp, ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { IndustryPartner } from "./types";
import { CreatePartnerDialog } from "./CreatePartnerDialog";
import { BindUserDialog } from "./BindUserDialog";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_SIZE = 20;

type SortField = "total_referrals" | "total_earnings" | null;
type SortDir = "asc" | "desc";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const isMobile = useIsMobile();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === "desc") setSortDir("asc");
      else { setSortField(null); setSortDir("desc"); }
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "desc" ? <ArrowDown className="h-3 w-3 ml-1" /> : <ArrowUp className="h-3 w-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = partners.filter(
      (p) =>
        (p.company_name || "").toLowerCase().includes(q) ||
        p.partner_code.toLowerCase().includes(q) ||
        (p.contact_person || "").toLowerCase().includes(q)
    );

    if (statusFilter === "active") result = result.filter((p) => p.status === "active");
    else if (statusFilter === "inactive") result = result.filter((p) => p.status !== "active");

    if (sortField) {
      result = [...result].sort((a, b) => {
        const av = (a[sortField] || 0) as number;
        const bv = (b[sortField] || 0) as number;
        return sortDir === "desc" ? bv - av : av - bv;
      });
    }

    return result;
  }, [partners, search, statusFilter, sortField, sortDir]);

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

  const renderPartnerCard = (p: IndustryPartner) => (
    <MobileCard key={p.id} interactive onClick={() => onSelectPartner(p.id)}>
      <MobileCardHeader>
        <MobileCardTitle className="flex-1 truncate">{p.company_name || p.partner_code}</MobileCardTitle>
        <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs shrink-0">
          {p.status === "active" ? "活跃" : p.status}
        </Badge>
      </MobileCardHeader>
      <MobileCardContent>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">编码：</span>
            <span className="font-mono">{p.partner_code}</span>
          </div>
          <div>
            <span className="text-muted-foreground">佣金：</span>
            {((p.custom_commission_rate_l1 ?? 0.3) * 100).toFixed(0)}%
          </div>
          <div>
            <span className="text-muted-foreground">推荐：</span>
            {p.total_referrals}
          </div>
          <div>
            <span className="text-muted-foreground">收益：</span>
            <span className="font-medium">¥{(p.total_earnings || 0).toFixed(2)}</span>
          </div>
          {p.contact_person && (
            <div>
              <span className="text-muted-foreground">联系人：</span>
              {p.contact_person}
            </div>
          )}
          <div>
            <span className="text-muted-foreground">负责人：</span>
            {p.user_id ? (
              <span className="text-emerald-600">{p.nickname || "已设置"}</span>
            ) : (
              <span className="text-muted-foreground">未设置</span>
            )}
          </div>
        </div>
        {!isPartnerAdmin && (
          <div className="flex gap-2 mt-3">
            {p.user_id ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                disabled={isUnbinding && unbindingId === p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!confirm("确认移除负责人？")) return;
                  onUnbindUser(p.id);
                }}
              >
                {isUnbinding && unbindingId === p.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Unlink className="h-3 w-3 mr-1" />}
                移除负责人
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setBindPartnerId(p.id);
                  setBindDialogOpen(true);
                }}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                设置负责人
              </Button>
            )}
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );

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

      <AdminFilterBar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }} searchPlaceholder="搜索公司名称、编码或联系人…" totalCount={filtered.length}>
        <ToggleGroup type="single" value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(0); } }}>
          <ToggleGroupItem value="all" className="text-xs h-8 px-3">全部</ToggleGroupItem>
          <ToggleGroupItem value="active" className="text-xs h-8 px-3">活跃</ToggleGroupItem>
          <ToggleGroupItem value="inactive" className="text-xs h-8 px-3">停用</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          导出
        </Button>
      </AdminFilterBar>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isMobile ? (
        /* Mobile: Card layout */
        <div className="space-y-3 mt-4">
          {paged.length > 0 ? (
            paged.map(renderPartnerCard)
          ) : (
            <div className="text-center text-muted-foreground py-8 text-sm">
              暂无行业合伙人
            </div>
          )}
        </div>
      ) : (
        /* Desktop: Table layout */
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
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("total_referrals")}>
                    <span className="inline-flex items-center">
                      推荐用户
                      <SortIcon field="total_referrals" />
                    </span>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("total_earnings")}>
                    <span className="inline-flex items-center">
                      总收益
                      <SortIcon field="total_earnings" />
                    </span>
                  </TableHead>
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
        </>
      )}

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

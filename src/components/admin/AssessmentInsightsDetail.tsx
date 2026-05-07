import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  Search,
  Download,
  Phone,
  Copy,
  Eye,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

import { AdminPageLayout } from "./shared/AdminPageLayout";
import { AdminStatCard } from "./shared/AdminStatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAdminAssessmentInsights, RespondentRow } from "@/hooks/useAdminAssessmentInsights";
import { AssessmentRespondentDrawer } from "./AssessmentRespondentDrawer";
import { formatClaimCode } from "@/utils/claimCodeUtils";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(217 91% 60%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(142 71% 45%)",
];

function maskPhone(p: string | null) {
  if (!p) return "—";
  if (p.length < 7) return p;
  return `${p.slice(0, 3)}****${p.slice(-4)}`;
}

function toCsv(rows: RespondentRow[], includeClaimCode = false) {
  const header = ["昵称", "手机号", "国家码", "主导类型", "总分", "测评时间", "管理员备注", "标签"];
  if (includeClaimCode) header.splice(5, 0, "领取码");
  const lines = rows.map((r) => {
    const cols = [
      r.displayName || "",
      r.phone || "",
      r.phoneCountryCode || "",
      r.primaryPattern || "",
      String(r.totalScore),
      format(new Date(r.createdAt), "yyyy-MM-dd HH:mm:ss"),
      r.adminNote || "",
      (r.adminTags || []).join("/"),
    ];
    if (includeClaimCode) cols.splice(5, 0, r.claimCode || "");
    return cols.map((s) => `"${String(s).replace(/"/g, '""')}"`).join(",");
  });
  return "\uFEFF" + [header.join(","), ...lines].join("\n");
}

export default function AssessmentInsightsDetail() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminAssessmentInsights(templateId);

  const [search, setSearch] = useState("");
  const [patternFilter, setPatternFilter] = useState<string>("all");
  const [drawerRow, setDrawerRow] = useState<RespondentRow | null>(null);

  const isMaleVitality = data?.template.assessmentKey === "male_midlife_vitality";

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.respondents.filter((r) => {
      if (patternFilter !== "all" && r.primaryPattern !== patternFilter) return false;
      if (search) {
        const q = search.trim().toLowerCase();
        const claimCodeNorm = (r.claimCode || "").toLowerCase().replace(/\s+/g, "");
        const queryNorm = q.replace(/\s+/g, "");
        const hit =
          (r.displayName || "").toLowerCase().includes(q) ||
          (r.phone || "").includes(q) ||
          (r.adminNote || "").toLowerCase().includes(q) ||
          (r.adminTags || []).some((t) => t.toLowerCase().includes(q)) ||
          (claimCodeNorm && claimCodeNorm.includes(queryNorm));
        if (!hit) return false;
      }
      return true;
    });
  }, [data, search, patternFilter]);

  const handleCopyPhone = (p: string | null) => {
    if (!p) return toast.error("该用户未绑定手机号");
    navigator.clipboard.writeText(p);
    toast.success(`已复制 ${p}`);
  };

  const handleExport = () => {
    if (filtered.length === 0) return toast.error("无数据可导出");
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `测评名单_${data?.template.title || "assessment"}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${filtered.length} 条记录`);
  };

  if (isLoading) {
    return (
      <AdminPageLayout title="测评数据洞察" description="加载中...">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72 mt-4" />
      </AdminPageLayout>
    );
  }

  if (!data) {
    return (
      <AdminPageLayout title="测评数据洞察" description="未找到测评">
        <Card><CardContent className="py-12 text-center text-muted-foreground">测评不存在或已被删除</CardContent></Card>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/assessments")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-2xl">{data.template.emoji || "📊"}</span>
          <span>{data.template.title} · 数据洞察</span>
        </div>
      }
      description="测评人数、用户画像与可执行运营名单"
    >
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AdminStatCard label="总测评人数" value={data.uniqueUsers} icon={Users} />
        <AdminStatCard label="总测评次数" value={data.totalResults} icon={ClipboardList} accent="bg-blue-500/10 text-blue-600" />
        <AdminStatCard label="今日新增" value={data.todayCount} icon={TrendingUp} accent="bg-green-500/10 text-green-600" />
        <AdminStatCard label="近7日新增" value={data.last7dCount} icon={CalendarDays} accent="bg-amber-500/10 text-amber-600" />
        <AdminStatCard label="复测率" value={`${data.retestRate}%`} icon={RefreshCw} accent="bg-purple-500/10 text-purple-600" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">主导类型分布</CardTitle></CardHeader>
          <CardContent className="h-64">
            {data.patternDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.patternDistribution} dataKey="value" nameKey="name" outerRadius={80} label>
                    {data.patternDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">分数分布</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {data.dimensionAverages.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">各维度均分</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.dimensionAverages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <RTooltip />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">30 日测评趋势</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Respondents Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">测评者名单 ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder={isMaleVitality ? "搜索昵称/手机号/领取码" : "搜索昵称/手机号"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 w-56"
                />
              </div>
              <Select value={patternFilter} onValueChange={setPatternFilter}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {data.patternDistribution.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name} ({p.value})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                <Download className="w-4 h-4" /> 导出 CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">用户</th>
                  <th className="text-left px-4 py-2 font-medium">手机号</th>
                  <th className="text-left px-4 py-2 font-medium">主导类型</th>
                  <th className="text-right px-4 py-2 font-medium">总分</th>
                  {isMaleVitality && <th className="text-left px-4 py-2 font-medium">领取码</th>}
                  <th className="text-left px-4 py-2 font-medium">测评时间</th>
                  <th className="text-right px-4 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={isMaleVitality ? 7 : 6} className="text-center py-10 text-muted-foreground">暂无数据</td></tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.resultId} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={r.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">{(r.displayName || "U").slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate max-w-[160px]">{r.displayName || "未命名"}</div>
                            {(r.adminNote || (r.adminTags && r.adminTags.length > 0)) ? (
                              <div className="flex items-center gap-1 mt-0.5 max-w-[200px]">
                                {r.adminTags?.slice(0, 2).map((t) => (
                                  <Badge key={t} variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-300 text-amber-700">
                                    {t}
                                  </Badge>
                                ))}
                                {r.adminNote && (
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    📝 {r.adminNote}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setDrawerRow(r)}
                                className="text-[11px] text-muted-foreground/60 hover:text-primary mt-0.5"
                              >
                                + 备注
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{maskPhone(r.phone)}</td>
                      <td className="px-4 py-2">
                        {r.primaryPattern ? <Badge variant="secondary">{r.primaryPattern}</Badge> : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-medium">{r.totalScore}</td>
                      {isMaleVitality && (
                        <td className="px-4 py-2">
                          {r.claimCode ? (
                            <button
                              type="button"
                              className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted/60 hover:bg-muted inline-flex items-center gap-1"
                              onClick={() => {
                                navigator.clipboard.writeText(r.claimCode!);
                                toast.success(`已复制 ${r.claimCode}`);
                              }}
                              title="点击复制"
                            >
                              {formatClaimCode(r.claimCode)}
                              <Copy className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-2 text-muted-foreground text-xs">
                        {format(new Date(r.createdAt), "MM-dd HH:mm")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="查看明细" onClick={() => setDrawerRow(r)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="复制手机号" onClick={() => handleCopyPhone(r.phone)}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          {r.phone && (
                            <a href={`tel:${r.phone}`} title="拨打">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Phone className="w-3.5 h-3.5" /></Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AssessmentRespondentDrawer
        open={!!drawerRow}
        onOpenChange={(v) => !v && setDrawerRow(null)}
        row={drawerRow}
        template={data.template}
      />
    </AdminPageLayout>
  );
}

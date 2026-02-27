import { useState, useEffect } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { AdminFilterBar } from "../shared/AdminFilterBar";
import { AdminTableContainer } from "../shared/AdminTableContainer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  traffic_source: string | null;
  target_audience: string | null;
  media_channel: string | null;
  landing_product: string | null;
  promotion_cost: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  partner_id: string | null;
}

interface PartnerOption {
  id: string;
  partner_code: string;
  user_id: string;
  partner_type: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  active: { label: "进行中", variant: "default" },
  paused: { label: "已暂停", variant: "outline" },
  completed: { label: "已完成", variant: "destructive" },
};

export default function FlywheelCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    name: "",
    traffic_source: "",
    target_audience: "",
    media_channel: "",
    landing_product: "",
    promotion_cost: 0,
    start_date: "",
    end_date: "",
    status: "draft",
    partner_id: "",
  });

  useEffect(() => { fetchCampaigns(); fetchPartners(); }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("id, partner_code, user_id, partner_type").eq("status", "active");
    if (data) setPartners(data as any);
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("campaigns" as any).select("*").order("created_at", { ascending: false });
    if (!error) setCampaigns((data || []) as any);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", traffic_source: "", target_audience: "", media_channel: "", landing_product: "", promotion_cost: 0, start_date: "", end_date: "", status: "draft", partner_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      name: c.name,
      traffic_source: c.traffic_source || "",
      target_audience: c.target_audience || "",
      media_channel: c.media_channel || "",
      landing_product: c.landing_product || "",
      promotion_cost: c.promotion_cost || 0,
      start_date: c.start_date || "",
      end_date: c.end_date || "",
      status: c.status,
      partner_id: c.partner_id || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("请输入活动名称"); return; }
    const payload = {
      name: form.name.trim(),
      traffic_source: form.traffic_source || null,
      target_audience: form.target_audience || null,
      media_channel: form.media_channel || null,
      landing_product: form.landing_product || null,
      promotion_cost: form.promotion_cost,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      partner_id: form.partner_id || null,
    };

    if (editing) {
      const { error } = await supabase.from("campaigns" as any).update(payload).eq("id", editing.id);
      if (error) { toast.error("更新失败"); return; }
      toast.success("更新成功");
    } else {
      const { error } = await supabase.from("campaigns" as any).insert(payload);
      if (error) { toast.error("创建失败"); return; }
      toast.success("创建成功");
    }
    setDialogOpen(false);
    fetchCampaigns();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此活动？")) return;
    const { error } = await supabase.from("campaigns" as any).delete().eq("id", id);
    if (error) { toast.error("删除失败"); return; }
    toast.success("已删除");
    fetchCampaigns();
  };

  const filtered = campaigns.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <AdminPageLayout
      title="Campaign实验室"
      description="管理推广活动，跟踪转化与ROI"
      actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />新建活动</Button>}
    >
      <AdminFilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="搜索活动名称..." totalCount={filtered.length}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="active">进行中</SelectItem>
            <SelectItem value="paused">已暂停</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
      </AdminFilterBar>

      <AdminTableContainer minWidth={900}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>活动名称</TableHead>
              <TableHead>合作伙伴</TableHead>
              <TableHead>流量来源</TableHead>
              <TableHead>渠道</TableHead>
              <TableHead>推广成本</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>开始日期</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无活动</TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  {c.partner_id ? (
                    <Badge variant="outline">{partners.find(p => p.id === c.partner_id)?.partner_code || "未知"}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">平台</span>
                  )}
                </TableCell>
                <TableCell>{c.media_channel || "-"}</TableCell>
                <TableCell>¥{(c.promotion_cost || 0).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_MAP[c.status]?.variant || "secondary"}>
                    {STATUS_MAP[c.status]?.label || c.status}
                  </Badge>
                </TableCell>
                <TableCell>{c.start_date ? format(new Date(c.start_date), "yyyy-MM-dd") : "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableContainer>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "编辑活动" : "新建活动"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div><Label>活动名称 *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>流量来源</Label><Input value={form.traffic_source} onChange={e => setForm(f => ({ ...f, traffic_source: e.target.value }))} placeholder="微信/抖音/小红书" /></div>
              <div><Label>媒体渠道</Label><Input value={form.media_channel} onChange={e => setForm(f => ({ ...f, media_channel: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>目标人群</Label><Input value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} /></div>
              <div><Label>引流产品</Label><Input value={form.landing_product} onChange={e => setForm(f => ({ ...f, landing_product: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>推广成本</Label><Input type="number" value={form.promotion_cost} onChange={e => setForm(f => ({ ...f, promotion_cost: Number(e.target.value) }))} /></div>
              <div><Label>开始日期</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>结束日期</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div>
              <Label>所属合作伙伴</Label>
              <Select value={form.partner_id || "none"} onValueChange={v => setForm(f => ({ ...f, partner_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="选择合作伙伴" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">平台级活动（无合伙人）</SelectItem>
                  {partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.partner_code} ({p.partner_type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>状态</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="active">进行中</SelectItem>
                  <SelectItem value="paused">已暂停</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave}>{editing ? "保存修改" : "创建活动"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}

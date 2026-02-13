import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PartnerProduct {
  id: string;
  partner_id: string;
  product_name: string;
  product_key: string;
  price: number;
  description: string | null;
  landing_page_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface PartnerProductsProps {
  partnerId: string;
}

export function PartnerProducts({ partnerId }: PartnerProductsProps) {
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerProduct | null>(null);
  const [form, setForm] = useState({
    product_name: "",
    product_key: "",
    price: 0,
    description: "",
    landing_page_url: "",
    is_active: true,
  });

  useEffect(() => { fetchProducts(); }, [partnerId]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partner_products" as any)
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    if (!error) setProducts((data || []) as any);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ product_name: "", product_key: "", price: 0, description: "", landing_page_url: "", is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (p: PartnerProduct) => {
    setEditing(p);
    setForm({
      product_name: p.product_name,
      product_key: p.product_key,
      price: p.price,
      description: p.description || "",
      landing_page_url: p.landing_page_url || "",
      is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_name.trim() || !form.product_key.trim()) {
      toast.error("请填写产品名称和标识");
      return;
    }
    const payload = {
      partner_id: partnerId,
      product_name: form.product_name.trim(),
      product_key: form.product_key.trim(),
      price: form.price,
      description: form.description || null,
      landing_page_url: form.landing_page_url.trim() || null,
      is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase.from("partner_products" as any).update(payload).eq("id", editing.id);
      if (error) { toast.error("更新失败"); return; }
      toast.success("产品已更新");
    } else {
      const { error } = await supabase.from("partner_products" as any).insert(payload);
      if (error) { toast.error("创建失败"); return; }
      toast.success("产品已创建");
    }
    setDialogOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此产品？")) return;
    const { error } = await supabase.from("partner_products" as any).delete().eq("id", id);
    if (error) { toast.error("删除失败"); return; }
    toast.success("已删除");
    fetchProducts();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="w-5 h-5" />
          我的产品包
        </CardTitle>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />添加产品</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品名称</TableHead>
                <TableHead>标识</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>落地页</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">暂无产品，点击"添加产品"开始配置</TableCell></TableRow>
              ) : products.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.product_name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.product_key}</TableCell>
                  <TableCell>¥{p.price.toLocaleString()}</TableCell>
                  <TableCell>
                    {p.landing_page_url ? (
                      <a href={p.landing_page_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                        链接 <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : <span className="text-muted-foreground text-xs">-</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "编辑产品" : "添加产品"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div><Label>产品名称 *</Label><Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} placeholder="如：知乐胶囊·身心评估套餐" /></div>
            <div><Label>产品标识 *</Label><Input value={form.product_key} onChange={e => setForm(f => ({ ...f, product_key: e.target.value }))} placeholder="如：zhile_assessment" /></div>
            <div><Label>价格（元）</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
            <div><Label>落地页 URL</Label><Input value={form.landing_page_url} onChange={e => setForm(f => ({ ...f, landing_page_url: e.target.value }))} placeholder="https://zhile.com/assessment" /></div>
            <div><Label>描述</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <Button onClick={handleSave}>{editing ? "保存" : "创建"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
